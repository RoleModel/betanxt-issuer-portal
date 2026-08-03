"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useTransition } from "react";

import { emptyMeetings, getNavigationTabs } from "./constants";
import { parsePhaseNumber } from "./utilities";
import type { components } from "@/domain-models/generated-schema";
import type { TabulationDisplayMode } from "@/utils/tabulation-display";
import type { MeetingTab, NavigationTab } from "./types";
import { useClient } from "@/contexts/ClientContext";
import { useMeetingSafe } from "@/contexts/MeetingContext";
import { useTabulationDisplay } from "@/contexts/TabulationDisplayContext";
import { useClientFeatures } from "@/hooks/useClientFeatures";
import { useRoutePreload } from "@/hooks/useRoutePreload";
import { formatDateWithYear } from "@/lib/formats";

type ApiMeeting = components["schemas"]["Meeting"];

const meetingIdPattern = /\/(?:past-)?meeting\/(?<meetingId>[^/]+)/u;
const urlTickerPattern = /^\/(?<ticker>[A-Za-z]{2,5})\//u;
const meetingRoutePrefixPattern = /^\/[^/]+\/(?:past-)?meeting\/[^/]+/u;
const prefetchDelayMs = 120;

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.length > 0;

/** The meeting id the current URL points at, if any. */
const extractMeetingId = (pathname: string): string | undefined =>
  meetingIdPattern.exec(pathname)?.groups?.meetingId;

/**
 * The ticker the URL is currently pointing at — the source of truth for which
 * client's tabs should render. Guards against showing the previously-viewed
 * client's meetings while the new client's data is still loading after a switch.
 */
const extractUrlTicker = (pathname: string): string | undefined => {
  const raw = urlTickerPattern.exec(pathname)?.groups?.ticker;
  return hasText(raw) ? raw.toUpperCase() : undefined;
};

const upperTicker = (meeting: ApiMeeting): string =>
  (meeting.ticker ?? "").toUpperCase();

/**
 * Epoch milliseconds for a meeting date, or 0 when the date is missing. Kept
 * separate so the sort comparator stays a single expression.
 */
const meetingTime = (value: string | undefined): number => {
  if (value === undefined) {
    return 0;
  }
  const date = new Date(value);
  return date.getTime();
};

const byMeetingDateThenTitle = (a: ApiMeeting, b: ApiMeeting): number => {
  const dateA = meetingTime(a.meetingDate);
  const dateB = meetingTime(b.meetingDate);
  if (dateA === dateB) {
    return (a.title ?? "").localeCompare(b.title ?? "");
  }
  return dateA - dateB;
};

interface CurrentMeetingLookup {
  readonly activeMeeting: ApiMeeting | null;
  readonly scopedMeetings: readonly ApiMeeting[];
  readonly urlTicker: string | undefined;
  readonly meetingIdFromUrl: string | undefined;
}

/**
 * The meeting whose tabs should render: the context's active meeting when it
 * belongs to the client in the URL, otherwise the meeting the URL names.
 */
const resolveCurrentMeeting = ({
  activeMeeting,
  scopedMeetings,
  urlTicker,
  meetingIdFromUrl,
}: CurrentMeetingLookup): ApiMeeting | undefined =>
  activeMeeting !== null &&
  (!hasText(urlTicker) || upperTicker(activeMeeting) === urlTicker)
    ? activeMeeting
    : scopedMeetings.find((m) => m.id === meetingIdFromUrl);

export interface MeetingNavigationState {
  readonly isPending: boolean;
  readonly pathname: string;
  readonly isMobile: boolean;
  readonly isCSM: boolean;
  readonly clientError: string | null;
  readonly isClientResolving: boolean;
  readonly navigationTabs: readonly NavigationTab[];
  readonly activeTab: string;
  readonly currentMeeting: ApiMeeting | undefined;
  readonly currentClientTicker: string | undefined;
  readonly transformedMeetings: {
    tab: MeetingTab;
    src: ApiMeeting;
  }[];
  readonly displayMode: TabulationDisplayMode;
  readonly setDisplayMode: (displayMode: TabulationDisplayMode) => void;
}

export const useMeetingNavigation = (): MeetingNavigationState => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending] = useTransition();
  const { displayMode, setDisplayMode } = useTabulationDisplay();
  const { data: session, status: sessionStatus } = useSession();
  const userType = session?.user.type ?? "PARENT_CLIENT";
  const isCSM = userType === "CSM";

  // Meeting context is optional — some pages (e.g. past-meetings) render the
  // tabs outside a MeetingProvider. useMeetingSafe returns undefined there
  // instead of throwing, so the hook is still called unconditionally.
  const meetingContextValue = useMeetingSafe();

  // A module-level constant keeps the empty case referentially stable, so this
  // needs no useMemo — and the React Compiler can then optimize the component
  // instead of bailing out on unpreservable manual memoization.
  const meetings = meetingContextValue?.meetings ?? emptyMeetings;
  const isLoading = meetingContextValue?.isLoading ?? false;
  const activeMeeting = meetingContextValue?.currentMeeting ?? null;

  const {
    currentClient,
    loading: clientLoading,
    error: clientError,
  } = useClient();
  const { isEnabled } = useClientFeatures();
  const theme = useTheme();
  const meetingIdFromUrl = extractMeetingId(pathname);
  const urlTicker = extractUrlTicker(pathname);
  const hasUrlTickerMismatch =
    hasText(urlTicker) && currentClient?.ticker !== urlTicker;
  const isClientResolving =
    sessionStatus === "loading" ||
    clientLoading ||
    !currentClient ||
    hasUrlTickerMismatch;
  // Only consider meetings that belong to the client in the URL. Stale meetings
  // from a prior client are filtered out until the correct ones load.
  const scopedMeetings = useMemo(
    () =>
      hasText(urlTicker)
        ? meetings.filter((m) => upperTicker(m) === urlTicker)
        : meetings,
    [meetings, urlTicker]
  );
  const currentMeeting = resolveCurrentMeeting({
    activeMeeting,
    meetingIdFromUrl,
    scopedMeetings,
    urlTicker,
  });
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // (Optimization) Memoize current phase parsing
  const currentPhase = useMemo(
    () => parsePhaseNumber(currentMeeting?.currentPhase),
    [currentMeeting?.currentPhase]
  );

  // Memoize navigation tabs with current phase, filtered by client feature flags
  const navigationTabs = useMemo(
    () =>
      getNavigationTabs(currentPhase).filter(
        (tab) => tab.featureGate === null || isEnabled(tab.featureGate)
      ),
    [currentPhase, isEnabled]
  );

  // Preload routes for the current meeting
  useRoutePreload(currentMeeting?.id);

  const currentMeetingId = currentMeeting?.id;
  const currentClientTicker = currentClient?.ticker;

  // (Optimization) Debounced prefetch to reduce immediate burst on mount/meeting change
  // Only prefetch when not currently loading to avoid excessive API calls
  useEffect(() => {
    if (
      !hasText(currentMeetingId) ||
      !hasText(currentClientTicker) ||
      isLoading ||
      clientLoading
    ) {
      return () => {
        // Nothing scheduled, so nothing to tear down.
      };
    }
    const timeout = setTimeout(() => {
      for (const tab of navigationTabs) {
        router.prefetch(
          `/${currentClientTicker}/meeting/${currentMeetingId}${tab.route}`
        );
      }
    }, prefetchDelayMs);
    return () => {
      clearTimeout(timeout);
    };
  }, [
    currentMeetingId,
    currentClientTicker,
    router,
    navigationTabs,
    isLoading,
    clientLoading,
  ]);

  // Get active tab from current pathname (memoized to prevent re-renders)
  const currentRoute = useMemo(
    () => pathname.replace(meetingRoutePrefixPattern, ""),
    [pathname]
  );
  const activeTab = useMemo(
    () =>
      navigationTabs.find((tab) => tab.route === currentRoute)?.label ??
      "Meeting Dashboard",
    [navigationTabs, currentRoute]
  );

  // Helper: map API/Context meeting to simplified tab data
  const mapToMeetingTab = useCallback(
    (m: ApiMeeting): MeetingTab => ({
      client: currentClient?.company_name ?? "",
      currentPhase: m.currentPhase ?? "Phase 1",
      cusip: m.cusip ?? "",
      id: m.id ?? "",
      mailingDate: formatDateWithYear(m.mailingDate ?? ""),
      meetingDate: formatDateWithYear(m.meetingDate ?? ""),
      overallCompletion: m.overallCompletion ?? 0,
      recordDate: formatDateWithYear(m.recordDate ?? ""),
      status: m.status ?? "ACTIVE",
      ticker: m.ticker ?? "",
      title: m.title ?? "Meeting",
    }),
    [currentClient?.company_name]
  );

  // Show only active meetings OR the currently selected past meeting
  const transformedMeetings: {
    tab: MeetingTab;
    src: ApiMeeting;
  }[] = useMemo(() => {
    const completedMeeting =
      currentMeeting?.status === "COMPLETE" ? currentMeeting : null;
    if (completedMeeting) {
      return [
        {
          src: completedMeeting,
          tab: mapToMeetingTab(completedMeeting),
        },
      ];
    }
    const activeMeetings = scopedMeetings.filter((m) => m.status === "ACTIVE");
    activeMeetings.sort(byMeetingDateThenTitle);
    return activeMeetings.map((m) => ({ src: m, tab: mapToMeetingTab(m) }));
  }, [scopedMeetings, currentMeeting, mapToMeetingTab]);

  return {
    activeTab,
    clientError,
    currentClientTicker,
    currentMeeting,
    displayMode,
    isCSM,
    isClientResolving,
    isMobile,
    isPending,
    navigationTabs,
    pathname,
    setDisplayMode,
    transformedMeetings,
  };
};
