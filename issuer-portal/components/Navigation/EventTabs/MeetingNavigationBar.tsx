"use client";

import {
  Box,
  Container,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import NextLink from "next/link";

import type { MeetingNavigationBarProperties } from "./types";

import { DisplayToggleButton } from "./styled";

export const MeetingNavigationBar = ({
  isPending,
  activeTab,
  navigationTabs,
  currentMeeting,
  currentClientTicker,
  pathname,
  displayMode,
  setDisplayMode,
}: MeetingNavigationBarProperties) => {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        boxShadow: "none",
        backgroundColor: "var(--mui-palette-background-default)",
        borderBottom: "1px solid",
        borderColor: theme.vars.palette.divider,
        borderRadius: 0,
        position: "relative",
      })}
    >
      {/* Loading indicator when navigation is pending */}
      {isPending ? (
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
      ) : null}
      <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 0, md: 3 }, py: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
              flex: 1,
              minWidth: 0,
            }}
          >
            {navigationTabs.map((tab) => {
              const isActive = activeTab === tab.label;
              // Use ticker from currentMeeting if available, fallback to currentClient
              const ticker = currentMeeting?.ticker ?? currentClientTicker;
              // Detect if we're on a past-meeting route from the current pathname
              const isPastMeetingRoute = pathname.includes("/past-meeting/");
              const meetingType = isPastMeetingRoute
                ? "past-meeting"
                : "meeting";
              const tabHref =
                currentMeeting && ticker != null
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
                      color: theme.vars.palette.primary.main,
                    },
                  })}
                />
              );
            })}
          </Tabs>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", flexShrink: 0 }}
          >
            Display as:
          </Typography>
          <ToggleButtonGroup
            exclusive
            aria-label="Tabulation display format"
            size="small"
            value={displayMode}
            onChange={(event, nextDisplayMode: string | null) => {
              void event;
              if (
                nextDisplayMode === "numbers" ||
                nextDisplayMode === "percentages"
              ) {
                setDisplayMode(nextDisplayMode);
              }
            }}
            sx={{ flexShrink: 0 }}
          >
            <DisplayToggleButton
              value="percentages"
              aria-label="View as Percentages"
            >
              Percentage
            </DisplayToggleButton>
            <DisplayToggleButton value="numbers" aria-label="View as Numbers">
              Count
            </DisplayToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Container>
    </Paper>
  );
};
