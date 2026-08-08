/* eslint-disable import-x/order */
"use client";

import type { User } from "next-auth";
import type {
  ImgHTMLAttributes,
  MouseEvent as ReactMouseEvent,
  SyntheticEvent,
} from "react";

import { useColorScheme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useDevMode } from "@/components/DevOverlay/useDevMode";
import { useClient } from "@/contexts/ClientContext";
import MeetingContext from "@/contexts/MeetingContext";
import { useNotificationsSafe } from "@/contexts/NotificationContext";
import { buildApiClient } from "@/domain-models/apiClient";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { countTabulationApprovals } from "@/utils/eventData";
import { getBrandConfigByTicker, getBrandLogoPath } from "@/utils/brandConfig";
import { computeClientLogoSrc } from "@/utils/client-branding";
import { isDevOverlayEnabled } from "@/utils/developmentOverlay";
import { formatMeetingDate } from "@/utils/meetingUtils";

// --- Hoisted regex constants ---
const tickerPrefixRegex = /^\/(?<ticker>[A-Z]{2,5})\//u;
const pastMeetingsRegex = /^\/[A-Z]+\/past-meetings$/u;
const pastMeetingRegex = /^\/[A-Z]+\/past-meeting\//u;
const meetingReportsRegex = /^\/[A-Z]+\/meeting\/[^/]+\/reports$/u;
const reportingRegex = /^\/[A-Z]+\/reporting$/u;
const secureFileTransferRegex = /^\/[A-Z]+\/secure-file-transfer$/u;
const meetingPrefixRegex = /^\/[A-Z]+\/meeting\//u;
const editEventRegex = /^\/edit\/[^/]+$/u;
const meetingIdFromPathRegex = /\/(?:past-)?meeting\/(?<meetingId>[^/]+)/u;

// Safely use meeting context when it might not be available
const useMeetingSafe = () => {
  const context = useContext(MeetingContext);
  return useMemo(
    () =>
      context ?? {
        currentMeeting: null,
        meetings: [] as {
          id?: string;
          meetingDate?: string;
          status?: string;
        }[],
      },
    [context]
  );
};

// Static mapping — no need for useMemo
const userTypeBrandTicker = new Map<string, string>([
  ["PARENT_CLIENT", "DFIN"],
  ["SOLICITOR", "MRSO"],
]);

// User types that see the multi-client (Events-first) navigation.
const multiClientUserTypes: ReadonlySet<string> = new Set([
  "PARENT_CLIENT",
  "SOLICITOR",
  "CSM",
]);

// Shared tab value so the string is defined once across the tab list and the
// route-to-tab resolution.
const pastMeetingsTabValue = "past-meetings";

// The meeting statuses the app recognises; the type is derived so the union is
// never spelled out twice.
const meetingStatusValues = ["ACTIVE", "COMPLETE", "ADJOURNED"] as const;
type MeetingStatus = (typeof meetingStatusValues)[number];
const isMeetingStatus = (value: string): value is MeetingStatus =>
  (meetingStatusValues as readonly string[]).includes(value);

interface MeetingApiRecord {
  meetingDate?: string;
  status?: string;
}

const isMeetingApiRecord = (value: unknown): value is MeetingApiRecord =>
  typeof value === "object" && value !== null;

// Resolves a route meeting's status/date. Extracted so the effect that calls it
// stays a thin wrapper (and keeps its try block simple).
const fetchRouteMeetingStatus = async (
  meetingId: string,
  meetingList: readonly { id?: string; status?: string }[]
): Promise<{ date: string | null; status: string | null }> => {
  const isInActiveList = meetingList.some((entry) => entry.id === meetingId);
  if (!isInActiveList && meetingList.length > 0) {
    return { date: null, status: "COMPLETE" };
  }

  const api = await buildApiClient();
  const { data } = await api.GET("/meetings/{meetingId}", {
    params: { path: { meetingId } },
  });
  const record: MeetingApiRecord = isMeetingApiRecord(data) ? data : {};
  return {
    date: record.meetingDate ?? null,
    status: record.status ?? null,
  };
};

interface StoredClient {
  ticker?: string;
}

// localStorage read + parse for the last-selected client. Extracted so its
// caller's try block stays trivial and the parse is validated, not asserted.
const readStoredClient = (): StoredClient | null => {
  const stored = localStorage.getItem("betanxt-selected-client");
  if (stored === null || stored === "") {
    return null;
  }
  const parsed: unknown = JSON.parse(stored);
  if (typeof parsed !== "object" || parsed === null || !("ticker" in parsed)) {
    return {};
  }
  const { ticker } = parsed;
  return { ticker: typeof ticker === "string" ? ticker : undefined };
};

// Posts the CSRF-guarded sign-out. Kept out of the callback so its try block
// only awaits this and pushes the route (keeps the try trivial).
const hasCsrfToken = (value: unknown): value is { csrfToken: string } =>
  typeof value === "object" &&
  value !== null &&
  "csrfToken" in value &&
  typeof value.csrfToken === "string";

const requestSignOut = async (): Promise<void> => {
  // eslint-disable-next-line compat/compat -- Opera Mini is not a target; fetch is available in every browser this app supports.
  const csrfResponse = await fetch("/api/auth/csrf");
  if (!csrfResponse.ok) {
    throw new Error(`Request failed: ${csrfResponse.status}`);
  }
  const payload: unknown = await csrfResponse.json();
  const csrfToken = hasCsrfToken(payload) ? payload.csrfToken : "";
  /* eslint-disable compat/compat -- Opera Mini is not a target; fetch/URLSearchParams are available in every supported browser. */
  await fetch("/api/auth/signout", {
    body: new URLSearchParams({ csrfToken }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
  /* eslint-enable compat/compat */
};

// The internal developer account (bypass/test login). The dev overlay toggle is
// scoped to this user so it never surfaces for real clients, CSMs, or admins.
//
// Detection is keyed off `username` rather than `email`: every custom session
// field (username, type, ...) is explicitly threaded through the NextAuth
// jwt/session callbacks, but `email` is not, so `session.user.email` is not
// reliably populated. The dev account signs in as `devuser` (bypass/legacy) or
// `dev.user` (test login); `dev@example.com` is kept as a defensive fallback.
const developmentUserUsernames = new Set(["devuser", "dev.user"]);
const developmentUserEmail = "dev@example.com";

interface UseAppBarParameters {
  logoSrc?: string;
  user?: User;
}

interface UseAppBarResult {
  // Logo
  logoSlotProps:
    | {
        logoImg: ImgHTMLAttributes<HTMLImageElement>;
      }
    | undefined;
  isCSM: boolean;
  isInClientContext: boolean;

  // Navigation
  tabs: { label: string; value: string; href: string }[];
  /**
   * Events waiting on a CSM to release their tabulation, for the Events tab's
   * badge. Zero for anyone who cannot release, so nothing is shown to a user
   * who could not act on it.
   */
  tabulationApprovalCount: number;
  selectedTabValue: string | false;
  shouldHideTabs: boolean;
  handleTabChange: (event: SyntheticEvent, newValue: string) => void;
  handleWrapperClick: (event: ReactMouseEvent<HTMLDivElement>) => void;

  // Meeting
  currentMeetingId: string | null;
  meetingStatus: MeetingStatus | null;
  meetingDateLabel: string | null;

  // User
  avatar: { src?: string; alt: string; children?: string };
  menuItems: { label: string; onClick: () => void }[];

  // Notifications
  unreadCount: number;
  notificationsOpen: boolean;
  notificationAnchor: HTMLButtonElement | null;
  handleNotificationClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  handleNotificationClose: () => void;

  // SSR
  isReady: boolean;
}

export const useAppBar = (parameters: UseAppBarParameters): UseAppBarResult => {
  const pathname = usePathname();
  const router = useRouter();

  // --- Context ---
  const { currentClient, availableClients } = useClient();
  const { clients } = useClients();
  const { data: session, status: sessionStatus } = useSession();
  const { mode, setMode } = useColorScheme();
  const {
    enabled: developmentOverlayEnabled,
    toggle: toggleDevelopmentOverlay,
  } = useDevMode();
  const meetingContext = useMeetingSafe();
  const meetings = useMemo(
    () => meetingContext.meetings,
    [meetingContext.meetings]
  );

  // Notification context (may not be available outside a NotificationProvider)
  const unreadCount = useNotificationsSafe()?.unreadCount ?? 0;

  // --- User type derivation ---
  const userType = session?.user.type;
  const isMultiClientUser =
    userType !== undefined && multiClientUserTypes.has(userType);
  const isCSM = userType === "CSM";
  // Only the internal Dev User sees the overlay toggle, regardless of env flag.
  const sessionUsername = session?.user.username;
  const isDevelopmentUser =
    (sessionUsername !== undefined &&
      developmentUserUsernames.has(sessionUsername)) ||
    session?.user.email === developmentUserEmail;

  // --- Notification state ---
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] =
    useState<HTMLButtonElement | null>(null);

  const handleNotificationClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setNotificationAnchor(event.currentTarget);
      setNotificationsOpen((previous) => !previous);
    },
    []
  );

  const handleNotificationClose = useCallback(() => {
    setNotificationsOpen(false);
  }, []);

  // --- Meeting status ---
  const [routeMeetingStatus, setRouteMeetingStatus] = useState<string | null>(
    null
  );
  const [routeMeetingDate, setRouteMeetingDate] = useState<string | null>(null);

  const currentMeetingId = useMemo(() => {
    const match = meetingIdFromPathRegex.exec(pathname);
    return match?.groups?.meetingId ?? null;
  }, [pathname]);

  useEffect(() => {
    let isActive = true;
    const applyStatus = (status: string | null, date: string | null): void => {
      if (!isActive) {
        return;
      }

      setRouteMeetingStatus(status);
      setRouteMeetingDate(date);
    };

    if (currentMeetingId === null) {
      setRouteMeetingStatus(null);
    } else {
      const run = async (): Promise<void> => {
        try {
          const result = await fetchRouteMeetingStatus(
            currentMeetingId,
            meetings
          );
          applyStatus(result.status, result.date);
        } catch {
          applyStatus(null, null);
        }
      };

      // Fire-and-forget: `run` handles its own errors, and effects cannot be
      // async. `void` is the idiomatic marker for this in React.

      void run();
    }

    return () => {
      isActive = false;
    };
  }, [currentMeetingId, meetings]);

  const meetingStatus: MeetingStatus | null = useMemo(() => {
    if (currentMeetingId === null) {
      return null;
    }
    if (pastMeetingRegex.test(pathname)) {
      return "COMPLETE";
    }
    const meeting = meetings.find((entry) => entry.id === currentMeetingId);
    const raw = meeting?.status ?? routeMeetingStatus;
    if (raw === null) {
      return null;
    }
    const normalized = raw.toUpperCase();
    return isMeetingStatus(normalized) ? normalized : null;
  }, [currentMeetingId, meetings, routeMeetingStatus, pathname]);

  const meetingDateRaw = useMemo(() => {
    if (currentMeetingId === null) {
      return null;
    }
    const meeting = meetings.find((entry) => entry.id === currentMeetingId);
    return (
      meeting?.meetingDate ??
      meetingContext.currentMeeting?.meetingDate ??
      routeMeetingDate
    );
  }, [
    currentMeetingId,
    meetings,
    meetingContext.currentMeeting?.meetingDate,
    routeMeetingDate,
  ]);

  const meetingDateLabel = useMemo(
    () => (meetingDateRaw === null ? null : formatMeetingDate(meetingDateRaw)),
    [meetingDateRaw]
  );

  // --- Navigation ---
  const { events } = useEvents();

  // Events waiting on this CSM to release their tabulation. Only a CSM can
  // release, so nobody else is shown a count they could not act on.
  const tabulationApprovalCount = useMemo(
    () => (isCSM ? countTabulationApprovals(events, new Date()) : 0),
    [isCSM, events]
  );

  const urlTicker = useMemo(() => {
    const match = tickerPrefixRegex.exec(pathname);
    return match?.groups?.ticker ?? null;
  }, [pathname]);

  // A "real client context" means the URL has a ticker that is NOT the brand's own ticker.
  // e.g. /ETWO/meeting/... → true; /DFIN/secure-file-transfer → false; /events → false
  const brandTicker =
    isMultiClientUser && userType
      ? (userTypeBrandTicker.get(userType) ?? null)
      : null;
  const isInClientContext = Boolean(urlTicker) && urlTicker !== brandTicker;

  // Resolve the meeting dashboard path for the active/viewed client.
  // When on a meeting URL we use that meeting ID directly; otherwise we look up the
  // most recent active meeting from the events list for the current URL ticker.
  const clientMeetingPath = useMemo(() => {
    if (!isInClientContext || !urlTicker) {
      return null;
    }

    if (currentMeetingId) {
      const routePrefix = pastMeetingRegex.test(pathname)
        ? "past-meeting"
        : "meeting";
      return `/${urlTicker}/${routePrefix}/${currentMeetingId}/dashboard`;
    }

    const [clientEvent] = [...events]
      .filter((candidate) => candidate.clientTicker === urlTicker)
      // A fresh copy is sorted in place; `toSorted` needs a newer TS lib target.
      // eslint-disable-next-line unicorn/no-array-sort
      .sort((first, second) => {
        if (
          first.meetingStatus === "ACTIVE" &&
          second.meetingStatus !== "ACTIVE"
        ) {
          return -1;
        }
        if (
          first.meetingStatus !== "ACTIVE" &&
          second.meetingStatus === "ACTIVE"
        ) {
          return 1;
        }
        return second.eventDate.localeCompare(first.eventDate);
      });

    if (clientEvent === undefined) {
      return null;
    }
    const routePrefix =
      clientEvent.meetingStatus === "ACTIVE" ? "meeting" : "past-meeting";
    return `/${urlTicker}/${routePrefix}/${clientEvent.meetingId}/dashboard`;
  }, [isInClientContext, urlTicker, currentMeetingId, pathname, events]);

  const dashboardPath = useMemo(() => {
    if (isMultiClientUser) {
      return isInClientContext && clientMeetingPath !== null
        ? clientMeetingPath
        : "/events";
    }
    const clientTicker = currentClient?.ticker;
    if (clientTicker !== undefined && clientTicker !== "") {
      const activeMeeting = meetings.find(
        (meeting: { status?: string }) => meeting.status !== "COMPLETE"
      );
      if (activeMeeting?.id !== undefined && activeMeeting.id !== "") {
        return `/${clientTicker}/meeting/${activeMeeting.id}/dashboard`;
      }
    }
    return "/";
  }, [
    currentClient,
    meetings,
    isMultiClientUser,
    isInClientContext,
    clientMeetingPath,
  ]);

  const tabs = useMemo(() => {
    const navTicker =
      urlTicker ??
      currentClient?.ticker ??
      availableClients[0]?.ticker ??
      "WEN";
    const tickerPrefix = `/${navTicker}`;

    const brandFileTransferTicker =
      userType === undefined ? undefined : userTypeBrandTicker.get(userType);
    const fileTransferTicker =
      isMultiClientUser && !isInClientContext
        ? (brandFileTransferTicker ?? navTicker)
        : navTicker;
    const fileTransferHref = `/${fileTransferTicker}/secure-file-transfer`;

    const eventsTab = { href: "/events", label: "Events", value: "events" };
    const dashboardTab = {
      href: dashboardPath,
      label: "Dashboard",
      value: "meeting",
    };
    const pastMeetingsTab = {
      href: `${tickerPrefix}/past-meetings`,
      label: "Past Meetings",
      value: pastMeetingsTabValue,
    };
    const reportingTab = {
      href: `${tickerPrefix}/reporting`,
      label: "Reporting",
      value: "reporting",
    };
    const fileTransferTab = {
      href: fileTransferHref,
      label: "File Transfer",
      value: "secure-file-transfer",
    };

    // Multi-client (PARENT_CLIENT / SOLICITOR / CSM) users always see Events tab.
    // Dashboard + client tabs only appear once inside a specific client context.
    if (isMultiClientUser) {
      if (isInClientContext) {
        // CSMs should only see File Transfer inside a client context (not globally)
        return [
          eventsTab,
          dashboardTab,
          pastMeetingsTab,
          reportingTab,
          fileTransferTab,
        ];
      }
      // CSMs: no File Transfer at the global level — they must navigate via a client context
      if (isCSM) {
        return [eventsTab];
      }
      return [eventsTab, fileTransferTab];
    }

    // Single-client users: no Events tab, full client tabs when a ticker is in the URL.
    if (!urlTicker) {
      return [dashboardTab, fileTransferTab];
    }

    return [dashboardTab, pastMeetingsTab, reportingTab, fileTransferTab];
  }, [
    dashboardPath,
    urlTicker,
    currentClient?.ticker,
    availableClients,
    isMultiClientUser,
    isCSM,
    userType,
    isInClientContext,
  ]);

  const currentTab = useMemo(() => {
    if (pathname === "/pdf-preview" || pathname.startsWith("/pdf-preview/")) {
      return null;
    }
    if (pathname === "/profile" || pathname.startsWith("/profile/")) {
      return "";
    }
    if (pathname === "/specs" || pathname.startsWith("/specs/")) {
      return "";
    }
    if (pathname === "/events" || editEventRegex.test(pathname)) {
      return "events";
    }
    if (pastMeetingRegex.test(pathname)) {
      return pastMeetingsTabValue;
    }
    if (pastMeetingsRegex.test(pathname) || pathname === "/past-meetings") {
      return pastMeetingsTabValue;
    }
    if (meetingReportsRegex.test(pathname)) {
      return "meeting";
    }
    if (reportingRegex.test(pathname)) {
      return "reporting";
    }
    if (secureFileTransferRegex.test(pathname)) {
      return "secure-file-transfer";
    }
    if (
      pathname === "/" ||
      pathname === "/meeting" ||
      meetingPrefixRegex.test(pathname) ||
      pathname.startsWith("/meeting/")
    ) {
      return "meeting";
    }
    return null;
  }, [pathname]);

  const shouldHideTabs = currentTab === null;
  // Guard against tab value mismatches during session loading (e.g. multi-client user
  // on /events before session resolves — tabs don't include 'events' yet).
  // Use `false` instead of `undefined` so MUI Tabs treats it as "no selection"
  // rather than switching to uncontrolled mode and logging a console warning.
  const tabValues = useMemo(() => new Set(tabs.map((t) => t.value)), [tabs]);
  const selectedTabValue: string | false =
    currentTab === null || !tabValues.has(currentTab) ? false : currentTab;

  const handleTabChange = useCallback(
    (event: SyntheticEvent, newValue: string) => {
      event.preventDefault();
      const selectedTab = tabs.find((tab) => tab.value === newValue);
      if (selectedTab?.href !== undefined && selectedTab.href !== "") {
        router.push(selectedTab.href);
      }
    },
    [tabs, router]
  );

  const handleWrapperClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const { target } = event;
      if (!(target instanceof Element)) {
        return;
      }
      const href = target.closest("a")?.getAttribute("href");
      if (href?.startsWith("/") === true) {
        event.preventDefault();
        event.stopPropagation();
        router.push(href);
      }
    },
    [router]
  );

  // --- Logo resolution ---
  const getClientLogo = useCallback(
    (clientName?: string, ticker?: string) =>
      computeClientLogoSrc(clientName, ticker, "/images/logo.svg", "-full"),
    []
  );

  const storedClient = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      return readStoredClient();
    } catch {
      return null;
    }
  }, []);

  // Look up the company name for the URL ticker from the clients list
  const urlClientCompanyName = useMemo<string | null>(() => {
    if (urlTicker === null) {
      return null;
    }
    const client = clients.find((candidate) => candidate.ticker === urlTicker);
    return client?.company_name ?? client?.name ?? null;
  }, [urlTicker, clients]);

  const logoTicker = useMemo<string | null>(() => {
    if (isMultiClientUser) {
      // On pages with a client ticker in the URL (e.g. /JPMR/past-meetings), use that client's logo
      if (urlTicker) {
        return urlTicker;
      }
      // Fallback to brand logo only on truly top-level pages like /events or /profile
      return userType ? (userTypeBrandTicker.get(userType) ?? null) : null;
    }
    return urlTicker ?? currentClient?.ticker ?? storedClient?.ticker ?? null;
  }, [
    urlTicker,
    currentClient?.ticker,
    storedClient?.ticker,
    isMultiClientUser,
    userType,
  ]);

  const logoSource = useMemo(() => {
    if (parameters.logoSrc) {
      return parameters.logoSrc;
    }
    if (sessionStatus === "loading") {
      return null;
    }

    // Ticker-based lookup is most reliable — not affected by company name typos/mismatches
    if (logoTicker) {
      const brandLogoPath = getBrandConfigByTicker(logoTicker)?.logoPath;
      if (typeof brandLogoPath === "string" && brandLogoPath !== "") {
        return brandLogoPath;
      }
    }

    // Fall back to company name lookup (for companies not yet in brandConfigsByTicker)
    if (urlClientCompanyName) {
      const brandLogo = getBrandLogoPath(urlClientCompanyName, "");
      if (typeof brandLogo === "string" && brandLogo !== "") {
        return brandLogo;
      }
    }

    // Final fallback for multi-client users: show the brand (DFIN / MRSO) logo rather than
    // generating a ticker-based path that won't exist for most new clients.
    if (isMultiClientUser && userType) {
      const fallbackBrandTicker = userTypeBrandTicker.get(userType);
      if (fallbackBrandTicker !== undefined) {
        return getClientLogo(undefined, fallbackBrandTicker);
      }
    }

    // Single-client ISSUER users: try the ticker-based file (WEN, PAYC, WWD, ELVN have these).
    return logoTicker
      ? getClientLogo(
          currentClient?.company_name ?? currentClient?.short_name,
          logoTicker
        )
      : "/images/logo.svg";
  }, [
    parameters.logoSrc,
    sessionStatus,
    urlClientCompanyName,
    logoTicker,
    getClientLogo,
    currentClient?.company_name,
    currentClient?.short_name,
    isMultiClientUser,
    userType,
  ]);

  const logoSlotProperties = useMemo(
    () =>
      logoSource === null
        ? undefined
        : {
            logoImg: {
              alt: `${urlClientCompanyName ?? logoTicker ?? "BetaNXT"} logo`,
              height: 44,
              src: logoSource,
              style: {
                backgroundColor: "var(--mui-palette-common-white)",
                borderRadius: "4px",
                height: 44,
                padding: "4px 4px",
                width: "auto",
              },
              width: "auto",
            },
          },
    [logoSource, logoTicker, urlClientCompanyName]
  );

  // --- Avatar ---
  const avatar = useMemo(() => {
    const { user } = parameters;
    if (user === undefined) {
      return { alt: "User Avatar", children: "US", src: "/avatars/user.png" };
    }
    const image = user.image ?? undefined;
    const hasImage = image !== undefined && image !== "";
    const trimmedName = user.name ?? "";
    const nameInitials =
      trimmedName === ""
        ? (user.username?.slice(0, 2).toUpperCase() ?? "U")
        : trimmedName
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    return {
      alt: `${user.name ?? user.username ?? ""} Avatar`,
      children: hasImage ? undefined : nameInitials,
      src: hasImage ? image : undefined,
    };
  }, [parameters.user]);

  // --- Auth / Menu ---
  const handleLogout = useCallback(async () => {
    try {
      await requestSignOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/login");
    }
  }, [router]);

  const menuItems = useMemo(() => {
    // Matches where the overlay itself is mounted — the entry cannot appear
    // in a build that has no overlay behind it, and only the Dev User sees it.
    const canToggleDevelopmentOverlay: boolean =
      isDevOverlayEnabled() && isDevelopmentUser;
    const isOverlayIsOn: boolean = developmentOverlayEnabled;
    return [
      {
        label: "Profile",
        onClick: () => {
          router.push("/profile");
        },
      },
      {
        label: `Switch to ${mode === "light" ? "Dark" : "Light"} Mode`,
        onClick: () => {
          setMode(mode === "light" ? "dark" : "light");
        },
      },
      ...(canToggleDevelopmentOverlay
        ? [
            {
              label: isOverlayIsOn
                ? "Turn Off Dev Overlay"
                : "Turn On Dev Overlay",
              onClick: toggleDevelopmentOverlay,
            },
          ]
        : []),
      // Internal requirements pages. Gated on the Dev User alone rather than
      // also on the overlay flag: the specs are readable in any build, and only
      // their source-download button depends on the overlay being on.
      ...(isDevelopmentUser
        ? [
            {
              label: "Specifications",
              onClick: () => {
                router.push("/specs");
              },
            },
          ]
        : []),
      {
        label: "Logout",
        onClick: () => {
          void handleLogout();
        },
      },
    ];
  }, [
    router,
    mode,
    setMode,
    developmentOverlayEnabled,
    toggleDevelopmentOverlay,
    handleLogout,
    isDevelopmentUser,
  ]);

  return {
    avatar,
    currentMeetingId,
    handleNotificationClick,
    handleNotificationClose,
    handleTabChange,
    handleWrapperClick,
    isCSM,
    isInClientContext,
    isReady: mode !== undefined,
    logoSlotProps: logoSlotProperties,
    meetingDateLabel,
    meetingStatus,
    menuItems,
    notificationAnchor,
    notificationsOpen,
    selectedTabValue,
    shouldHideTabs,
    tabs,
    tabulationApprovalCount,
    unreadCount,
  };
};
