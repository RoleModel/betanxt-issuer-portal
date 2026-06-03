"use client";

import { EditOutlined as EditOutlinedIcon } from "@mui/icons-material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  Box,
  Container,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { BNTypographyPair } from "@rolemodel/betanxt-design-system/components/BNTypographyPair";
import { useSession } from "next-auth/react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import type { components } from "@/domain-models/generated-schema";

import { useClient } from "@/contexts/ClientContext";
import { useMeeting } from "@/contexts/MeetingContext";
import { useClientFeatures } from "@/hooks/useClientFeatures";
import { useRoutePreload } from "@/hooks/useRoutePreload";
import { formatDateWithYear } from "@/lib/formats";
import { getCusipLabel, normalizeCusips } from "@/utils/cusipDisplay";

interface MeetingTab {
  id: string;
  title: string;
  ticker: string;
  cusip: string;
  recordDate: string;
  mailingDate: string;
  meetingDate: string;
  status: "ACTIVE" | "COMPLETE" | "ADJOURNED";
  currentPhase: string;
  overallCompletion: number;
  client: string;
}

type FeatureGate = "agenda" | "mailing" | "tabulation" | "reports" | null;

const ALL_NAVIGATION_TABS = (currentPhase: number) => [
  {
    label: "Meeting Dashboard",
    route: `/dashboard/${currentPhase}`,
    featureGate: null as FeatureGate,
  },
  { label: "Agenda", route: "/agenda", featureGate: "agenda" as FeatureGate },
  { label: "Mailing", route: "/mailing", featureGate: "mailing" as FeatureGate },
  { label: "Tabulation", route: "/tabulation", featureGate: "tabulation" as FeatureGate },
  { label: "Reports", route: "/reports", featureGate: "reports" as FeatureGate },
];

const getNavigationTabs = (currentPhase: number) => ALL_NAVIGATION_TABS(currentPhase);

const ScrollButton = styled(IconButton, {
  shouldForwardProp: (prop) => !["direction"].includes(prop as string),
})<{ direction: "left" | "right" }>(({ theme, direction }) => ({
  position: "absolute",
  [direction]: 0,
  top: 0,
  bottom: 0,
  height: "100%",
  width: theme.spacing(2.5),
  borderRadius: 0,
  backgroundColor: theme.vars.palette.primary.main,
  border: "1px solid",
  borderColor: theme.vars.palette.divider,
  borderWidth: direction === "left" ? "0 1px 0 0" : "0 0 0 1px",
  zIndex: 1,
  "&:hover": {
    backgroundColor: theme.vars.palette.primary.dark,
  },
  "& .MuiSvgIcon-root": {
    transform: `rotate(${direction === "left" ? "90deg" : "-90deg"})`,
    color: theme.vars.palette.common.white,
    fontSize: "16px",
  },
}));

const parsePhaseNumber = (phase: string | number | null | undefined): number => {
  if (typeof phase === "number" && Number.isFinite(phase)) {
    return Math.max(1, phase);
  }

  if (typeof phase === "string") {
    const match = /(\d+)/.exec(phase);
    if (match?.[1]) {
      const value = Number.parseInt(match[1], 10);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  }

  return 1;
};

const getCusipDisplayValue = (value: string): string => {
  const cusips = normalizeCusips(value);

  if (cusips.length <= 1) {
    return cusips[0] ?? value;
  }

  return `${cusips[0]} +${cusips.length - 1}`;
};

export function EventTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending] = useTransition();
  const [activeMeetingTab, setActiveMeetingTab] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const userType = session?.user?.type ?? "PARENT_CLIENT";
  const isCSM = userType === "CSM";

  // Try to get meeting context, but handle pages without MeetingProvider
  let meetingContextValue = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    meetingContextValue = useMeeting();
  } catch {
    // No MeetingProvider available (e.g., on past-meetings page)
  }

  const meetings = useMemo(
    () => meetingContextValue?.meetings ?? [],
    [meetingContextValue?.meetings],
  );
  const loading = meetingContextValue?.isLoading ?? false;
  const activeMeeting = meetingContextValue?.currentMeeting ?? null;

  const { currentClient, loading: clientLoading, error: clientError } = useClient();
  const { isEnabled } = useClientFeatures();
  const theme = useTheme();
  const meetingIdFromUrl = /\/(?:past-)?meeting\/([^/]+)/.exec(pathname)?.[1];
  const currentMeeting = activeMeeting || meetings.find((m) => m.id === meetingIdFromUrl);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // (Optimization) Memoize current phase parsing
  const currentPhase = useMemo(
    () => parsePhaseNumber(currentMeeting?.currentPhase),
    [currentMeeting?.currentPhase],
  );

  // Memoize navigation tabs with current phase, filtered by client feature flags
  const navigationTabs = useMemo(
    () =>
      getNavigationTabs(currentPhase).filter(
        (tab) => tab.featureGate === null || isEnabled(tab.featureGate),
      ),
    [currentPhase, isEnabled],
  );

  // Preload routes for the current meeting
  useRoutePreload(currentMeeting?.id);

  // (Optimization) Debounced prefetch to reduce immediate burst on mount/meeting change
  // Only prefetch when not currently loading to avoid excessive API calls
  useEffect(() => {
    if (currentMeeting?.id && currentClient?.ticker && !loading && !clientLoading) {
      const timeout = setTimeout(() => {
        navigationTabs.forEach((tab) => {
          const route = `/${currentClient.ticker}/meeting/${currentMeeting.id}${tab.route}`;
          router.prefetch(route);
        });
      }, 120);
      return () => clearTimeout(timeout);
    }
  }, [currentMeeting?.id, currentClient?.ticker, router, navigationTabs, loading, clientLoading]);

  // Get active tab from current pathname (memoized to prevent re-renders)
  const currentRoute = useMemo(
    () => pathname.replace(/^\/[^/]+\/(?:past-)?meeting\/[^/]+/, ""),
    [pathname],
  );
  const activeTab = useMemo(
    () => navigationTabs.find((tab) => tab.route === currentRoute)?.label ?? "Meeting Dashboard",
    [navigationTabs, currentRoute],
  );

  // Handle URL-based meeting selection for past meetings
  useEffect(() => {
    const handleMeetingFromURL = () => {
      const pathMatch = /^\/[^/]+\/(?:past-)?meeting\/([^/]+)/.exec(pathname);
      if (pathMatch) {
        const meetingIdFromURL = pathMatch[1];

        // Check if the current active meeting matches the URL
        if (activeMeeting?.id !== meetingIdFromURL) {
          // If we have meetings loaded and none match the URL ID, it might be a past meeting
          const meetingsArray = meetings || [];
          const existingMeeting = meetingsArray.find((m) => m.id === meetingIdFromURL);
          if (!existingMeeting && meetingsArray.length > 0) {
            // This could be a past meeting - let the MeetingContext handle it
            // The context will fetch the meeting from the database
          }
        }
      }
    };

    handleMeetingFromURL();
  }, [pathname, activeMeeting, meetings, currentMeeting]);

  // Helper: map API/Context meeting to simplified tab data
  const mapToMeetingTab = useCallback(
    (m: components["schemas"]["Meeting"]): MeetingTab => ({
      id: m.id ?? "",
      title: m.title ?? "Meeting",
      ticker: m.ticker ?? "",
      cusip: m.cusip ?? "",
      recordDate: formatDateWithYear(m.recordDate ?? ""),
      mailingDate: formatDateWithYear(m.mailingDate ?? ""),
      meetingDate: formatDateWithYear(m.meetingDate ?? ""),
      status: m.status! ?? "ACTIVE",
      currentPhase: m.currentPhase ?? "Phase 1",
      overallCompletion: m.overallCompletion ?? 0,
      client: currentClient?.company_name ?? "",
    }),
    [currentClient?.company_name],
  );

  // Show only active meetings OR the currently selected past meeting
  const transformedMeetings: {
    tab: MeetingTab;
    src: components["schemas"]["Meeting"];
  }[] = useMemo(() => {
    const meetingsArray = meetings || [];
    const completedMeeting = currentMeeting?.status === "COMPLETE" ? currentMeeting : null;
    if (completedMeeting) {
      return [
        {
          tab: mapToMeetingTab(completedMeeting),
          src: completedMeeting,
        },
      ];
    }
    const activeMeetings = meetingsArray.filter((m) => m.status === "ACTIVE");
    activeMeetings.sort((a, b) => {
      const dateA = a.meetingDate ? new Date(a.meetingDate).getTime() : 0;
      const dateB = b.meetingDate ? new Date(b.meetingDate).getTime() : 0;
      if (dateA === dateB) {
        return (a.title ?? "").localeCompare(b.title ?? "");
      }
      return dateA - dateB;
    });
    return activeMeetings.map((m) => ({ tab: mapToMeetingTab(m), src: m }));
  }, [meetings, currentMeeting, mapToMeetingTab]);

  // Sync activeMeetingTab with current meeting
  useEffect(() => {
    if (currentMeeting && transformedMeetings.length > 0) {
      const meetingIndex = transformedMeetings.findIndex((m) => m.src.id === currentMeeting.id);
      if (meetingIndex !== -1 && meetingIndex !== activeMeetingTab) {
        setActiveMeetingTab(meetingIndex);
      }
    }
  }, [currentMeeting, transformedMeetings, activeMeetingTab]);

  // Check scroll position and update button visibility (memoized)
  const checkScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 1); // Small tolerance for floating point precision
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  // Helper function to scroll to active tab
  const scrollToActiveTab = useCallback(() => {
    if (scrollContainerRef.current && activeMeetingTab !== -1) {
      const container = scrollContainerRef.current;
      const activeTabEl = container.querySelector(`[data-tab-index="${activeMeetingTab}"]`);
      if (activeTabEl instanceof HTMLElement) {
        const tabLeft = activeTabEl.offsetLeft;
        const targetScroll = activeMeetingTab === 0 ? 0 : Math.max(0, tabLeft - 12);
        container.scrollTo({ left: targetScroll, behavior: "smooth" });
        checkScrollButtons();
      }
    }
  }, [activeMeetingTab, checkScrollButtons]);

  // Scroll to active tab when it changes
  useEffect(() => {
    scrollToActiveTab();
  }, [activeMeetingTab, scrollToActiveTab]);

  // Initial check and setup
  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkScrollButtons]);

  // Scroll functions (memoized)
  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tabs = container.querySelectorAll("[data-tab-index]");

      if (tabs.length === 0) return;

      const currentScrollLeft = container.scrollLeft;

      if (currentScrollLeft <= 1) return;

      // Find the current leftmost visible tab
      let currentTabIndex = tabs.length - 1; // Default to last tab
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i] as HTMLElement;
        if (tab.offsetLeft >= currentScrollLeft - 5) {
          // Small tolerance
          currentTabIndex = i;
          break;
        }
      }

      // Go to previous tab
      const targetIndex = Math.max(0, currentTabIndex - 1);
      const targetTab = tabs[targetIndex] as HTMLElement;

      // If target is the first tab, scroll to 0
      const targetScrollLeft = targetIndex === 0 ? 0 : targetTab.offsetLeft;

      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });

      // Recheck buttons after scroll animation
      setTimeout(() => {
        checkScrollButtons();
      }, 300);
    }
  }, [checkScrollButtons]);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tabs = container.querySelectorAll("[data-tab-index]");

      if (tabs.length === 0) return;

      const currentScrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      // If already at max scroll, don't scroll
      if (currentScrollLeft >= maxScrollLeft - 1) return;

      // Find the first tab that's completely hidden on the right
      let targetIndex = -1;

      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i] as HTMLElement;
        const tabLeft = tab.offsetLeft;

        // If this tab starts beyond the current visible area
        if (tabLeft >= currentScrollLeft + containerWidth) {
          targetIndex = i;
          break;
        }
      }

      // If no completely hidden tab found, find the first partially hidden one
      if (targetIndex === -1) {
        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i] as HTMLElement;
          const tabRight = tab.offsetLeft + tab.offsetWidth;

          // If this tab extends beyond the current view
          if (tabRight > currentScrollLeft + containerWidth) {
            targetIndex = i;
            break;
          }
        }
      }

      // If still no target found, scroll to the last tab
      if (targetIndex === -1) {
        targetIndex = tabs.length - 1;
      }

      const targetTab = tabs[targetIndex] as HTMLElement;

      // Calculate scroll position to fit the target tab in the visible area
      // We want to scroll just enough to show this tab, not necessarily position it at the left
      const targetTabRight = targetTab.offsetLeft + targetTab.offsetWidth;
      const neededScroll = targetTabRight - (currentScrollLeft + containerWidth);

      let targetScrollLeft;
      if (neededScroll > 0) {
        // Scroll just enough to show the tab
        targetScrollLeft = Math.min(currentScrollLeft + neededScroll, maxScrollLeft);
      } else {
        // Tab is already visible, scroll to its left position
        targetScrollLeft = Math.min(targetTab.offsetLeft, maxScrollLeft);
      }

      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });

      // Recheck buttons after scroll animation
      setTimeout(() => {
        checkScrollButtons();
      }, 300);
    }
  }, [checkScrollButtons]);

  // Subcomponents for active/inactive meeting detail sections
  const ActiveMeetingDetails = ({ meeting }: { meeting: MeetingTab }) => {
    return (
      <Box sx={{ display: "flex", color: "text.primary" }}>
        <Stack direction="row" spacing={2} alignItems="start">
          <BNTypographyPair
            sx={{ whiteSpace: "nowrap" }}
            primary={{
              color: "text.secondary",
              variant: "caption",
              fontWeight: 500,
              text: getCusipLabel(meeting.cusip),
            }}
            secondary={{
              variant: "body3",
              fontWeight: 500,
              text: getCusipDisplayValue(meeting.cusip),
            }}
          />
          <BNTypographyPair
            sx={{ whiteSpace: "nowrap" }}
            primary={{
              color: "text.secondary",
              variant: "caption",
              fontWeight: 500,
              text: "Record Date",
            }}
            secondary={{
              variant: "body3",
              fontWeight: 500,
              text: meeting.recordDate,
            }}
          />
          <BNTypographyPair
            sx={{ whiteSpace: "nowrap" }}
            primary={{
              color: "text.secondary",
              variant: "caption",
              fontWeight: 500,
              text: "Mailing Date",
            }}
            secondary={{
              variant: "body3",
              fontWeight: 500,
              text: meeting.mailingDate,
            }}
          />
          <BNTypographyPair
            sx={{ whiteSpace: "nowrap" }}
            primary={{
              color: "text.secondary",
              variant: "caption",
              fontWeight: 500,
              text: "Meeting Date",
            }}
            secondary={{
              variant: "body3",
              fontWeight: 500,
              text: `${meeting.meetingDate} 11:00 AM Local Time`,
            }}
          />
        </Stack>
      </Box>
    );
  };

  const InactiveMeetingDetails = ({ meeting }: { meeting: MeetingTab }) => {
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
        <Stack sx={{ alignItems: "flex-end" }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              lineHeight: 1.5,
              color: "inherit",
            }}
          >
            Meeting Date
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              lineHeight: 1.286,
              color: "inherit",
            }}
          >
            {meeting.meetingDate}
          </Typography>
        </Stack>
      </Box>
    );
  };

  const MeetingTab = React.memo(function MeetingTab({
    meeting,
    src,
    index,
  }: {
    meeting: MeetingTab;
    src: components["schemas"]["Meeting"];
    index: number;
  }) {
    const isActive = currentMeeting?.id === meeting.id;
    const ticker = currentClient?.ticker;
    const meetingId = meeting.id;
    const isPastMeeting = src.status === "COMPLETE";
    const meetingType = isPastMeeting ? "past-meeting" : "meeting";

    // Remove both /meeting/ and /past-meeting/ from current path
    const currentPath = pathname.replace(/\/[^/]+\/(?:past-)?meeting\/[^/]+/, "");

    // If on dashboard with phase, navigate to the target meeting's phase
    const targetPath = useMemo(() => {
      if (/^\/dashboard(\/\d+)?$/.exec(currentPath)) {
        const targetPhase = parsePhaseNumber(meeting.currentPhase);
        return `/${ticker}/${meetingType}/${meetingId}/dashboard/${targetPhase}`;
      } else if (currentPath === "") {
        return `/${ticker}/${meetingType}/${meetingId}`;
      } else {
        return `/${ticker}/${meetingType}/${meetingId}${currentPath}`;
      }
    }, [currentPath, ticker, meetingId, meetingType, meeting.currentPhase]);

    return (
      <Stack
        sx={{
          position: "relative",
          "&:hover .edit-tab-button": { opacity: 1 },
        }}
      >
        <NextLink
          href={targetPath}
          key={meeting.id || index}
          passHref
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Box
            data-tab-index={index}
            tabIndex={0}
            role="tab"
            aria-selected={isActive}
            sx={(theme) => ({
              display: "flex",
              flexDirection: "column",
              cursor: isActive ? "default" : "pointer",
              overflowX: "hidden",
              backgroundColor: isActive
                ? theme.vars.palette.background.default
                : theme.vars.palette.common.white,
              ...theme.applyStyles("dark", {
                backgroundColor: isActive
                  ? theme.vars.palette.background.default
                  : theme.vars.palette.common.black,
              }),
              color: isActive ? theme.vars.palette.primary.main : theme.vars.palette.text.secondary,
              position: "relative",
              borderRight: `1px solid ${theme.vars.palette.divider}`,
              minWidth: "fit-content",
              transition: theme.transitions.create(["color"]),
              "&:hover": { color: theme.vars.palette.primary.main },
            })}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Stack>
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: "var(--font-roboto-condensed), Roboto Condensed, sans-serif",
                    fontWeight: 500,
                    fontSize: "2rem",
                    lineHeight: 1.125,
                    letterSpacing: "0.47%",
                    textDecoration: "none",
                    color: "inherit",
                    mb: 1,
                    fontDisplay: "swap",
                  }}
                >
                  {meeting.title}
                </Typography>

                {isActive && !isMobile ? (
                  <ActiveMeetingDetails meeting={meeting} />
                ) : (
                  !isActive && !isMobile && <InactiveMeetingDetails meeting={meeting} />
                )}
              </Stack>
            </Box>
          </Box>
        </NextLink>

        {isCSM && (
          <IconButton
            className="edit-tab-button"
            component={NextLink}
            href={`/edit/${meetingId}?returnUrl=${encodeURIComponent(pathname)}`}
            size="small"
            aria-label={`Edit ${meeting.title}`}
            sx={(theme) => ({
              position: "absolute",
              top: 6,
              right: 6,
              zIndex: 2,
              opacity: 0,
              transition: theme.transitions.create("opacity"),
              backgroundColor: theme.vars.palette.background.paper,
              "&:hover": {
                backgroundColor: theme.vars.palette.action.hover,
              },
            })}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    );
  });

  // Show error state if there's a client error
  if (clientError) {
    return (
      <Box>
        <Paper
          square
          sx={{
            borderBottom: "1px solid",
            borderColor: "var(--mui-palette-divider)",
            boxShadow: "none",
            backgroundColor: "var(--mui-palette-appBarSecondary-defaultFill)",
            p: 2,
          }}
        >
          <Typography color="error" variant="body3">
            Error loading client data: {clientError}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box component="nav">
      {/* Meeting Tabs Section */}
      <Paper
        sx={{
          borderBottom: "1px solid",
          borderColor: (theme) => theme.vars.palette.divider,
          borderRadius: 0,
          boxShadow: "none",
          background: (theme) => theme.vars.palette.tableCellRow.fill,
          position: "relative", // Add relative positioning
          "& .MuiPaper-root": {
            borderRadius: 0,
          },
        }}
      >
        <Container maxWidth="xl" sx={{ position: "relative" }}>
          {/* Left Scroll Button - Only show for active meetings with multiple tabs */}
          {canScrollLeft && transformedMeetings.length > 1 && (
            <ScrollButton direction="left" onClick={scrollLeft} aria-label="Scroll meetings left">
              <ArrowDropDownIcon />
            </ScrollButton>
          )}

          {/* Right Scroll Button - Only show for active meetings with multiple tabs */}
          {canScrollRight && transformedMeetings.length > 1 && (
            <ScrollButton
              direction="right"
              onClick={scrollRight}
              aria-label="Scroll meetings right"
            >
              <ArrowDropDownIcon />
            </ScrollButton>
          )}

          <Box
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            sx={{
              py: 0,
              px: { xs: 1, sm: 0 },
              maxWidth: "100%",
              overflowX: "auto",
              overflowY: "visible", // Allow vertical overflow for the covering line
              scrollBehavior: "smooth",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            <Stack
              direction="row"
              sx={{
                borderLeft: "1px solid",
                borderColor: (theme) => theme.vars.palette.divider,
              }}
            >
              {transformedMeetings.map(({ tab, src }, index) => (
                <MeetingTab key={tab.id || index} meeting={tab} src={src} index={index} />
              ))}
            </Stack>
          </Box>
        </Container>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          boxShadow: "none",
          backgroundColor: "var(--mui-palette-background-default)",
          borderBottom: "1px solid",
          borderColor: (theme) => theme.vars.palette.divider,
          borderRadius: 0,
          position: "relative",
        }}
      >
        {/* Loading indicator when navigation is pending */}
        {isPending && (
          <LinearProgress
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1,
              height: 2,
            }}
          />
        )}
        <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 0, md: 3 }, py: 0 }}>
          <Tabs
            value={activeTab}
            variant="scrollable"
            allowScrollButtonsMobile
            scrollButtons="auto"
            aria-label="Meeting Navigation"
            sx={{
              position: "relative",
              pointerEvents: "auto",
              opacity: isPending ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {navigationTabs.map((tab) => {
              const isActive = activeTab === tab.label;
              // Use ticker from currentMeeting if available, fallback to currentClient
              const ticker = currentMeeting?.ticker || currentClient?.ticker;
              // Detect if we're on a past-meeting route from the current pathname
              const isPastMeetingRoute = pathname.includes("/past-meeting/");
              const meetingType = isPastMeetingRoute ? "past-meeting" : "meeting";
              const tabHref =
                currentMeeting && ticker
                  ? `/${ticker}/${meetingType}/${currentMeeting.id}${tab.route}`
                  : "#";

              return (
                <Tab
                  key={tab.label}
                  value={tab.label}
                  label={tab.label}
                  component={NextLink}
                  href={tabHref}
                  sx={(theme) => ({
                    color: isActive
                      ? "var(--mui-palette-primary-main)"
                      : "var(--mui-palette-text-secondary)",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    textTransform: "none",
                    textDecoration: "none",
                    px: 2,
                    py: 1.125,
                    minWidth: "fit-content",
                    borderRadius: 0,
                    cursor: "pointer",
                    pointerEvents: "auto",
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: theme.vars?.palette.primary.main,
                    },
                  })}
                />
              );
            })}
          </Tabs>
        </Container>
      </Paper>
    </Box>
  );
}

EventTabs.displayName = "EventTabs";
