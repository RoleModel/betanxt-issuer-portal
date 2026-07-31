"use client";

import { Box, LinearProgress, Paper, Typography } from "@mui/material";

import { MeetingNavigationBar } from "./MeetingNavigationBar";
import { MeetingTabsScroller } from "./MeetingTabsScroller";
import { useMeetingNavigation } from "./use-meeting-navigation";

export const EventTabs = () => {
  const {
    isPending,
    pathname,
    isMobile,
    isCSM,
    clientError,
    isClientResolving,
    navigationTabs,
    activeTab,
    currentMeeting,
    currentClientTicker,
    transformedMeetings,
    displayMode,
    setDisplayMode,
  } = useMeetingNavigation();

  // Show error state if there's a client error
  if (clientError !== null && clientError.length > 0) {
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

  if (isClientResolving) {
    return (
      <Box component="nav" aria-label="Meeting navigation loading">
        <Paper
          square
          sx={{
            borderBottom: "1px solid",
            borderColor: "var(--mui-palette-divider)",
            boxShadow: "none",
            backgroundColor: "var(--mui-palette-appBarSecondary-defaultFill)",
            minHeight: 96,
            position: "relative",
          }}
        >
          <LinearProgress
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 2,
            }}
          />
        </Paper>
      </Box>
    );
  }

  return (
    <Box component="nav">
      {/* Meeting Tabs Section */}
      <MeetingTabsScroller
        transformedMeetings={transformedMeetings}
        currentMeetingId={currentMeeting?.id}
        ticker={currentClientTicker}
        pathname={pathname}
        isMobile={isMobile}
        isCSM={isCSM}
      />

      <MeetingNavigationBar
        isPending={isPending}
        activeTab={activeTab}
        navigationTabs={navigationTabs}
        currentMeeting={currentMeeting}
        currentClientTicker={currentClientTicker}
        pathname={pathname}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
      />
    </Box>
  );
};

EventTabs.displayName = "EventTabs";
