"use client";

import { EditOutlined as EditOutlinedIcon } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import React, { useMemo } from "react";

import type { MeetingTabItemProperties } from "./types";

import { ActiveMeetingDetails } from "./ActiveMeetingDetails";
import { InactiveMeetingDetails } from "./InactiveMeetingDetails";
import { parsePhaseNumber } from "./utilities";

const MeetingTabItemBase = ({
  meeting,
  src,
  index,
  currentMeetingId,
  ticker,
  pathname,
  isMobile,
  isCSM,
}: MeetingTabItemProperties) => {
  const isActive = currentMeetingId === meeting.id;
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
            color: isActive
              ? theme.vars.palette.primary.main
              : theme.vars.palette.text.secondary,
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
                  fontFamily:
                    "var(--font-roboto-condensed), Roboto Condensed, sans-serif",
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
                !isActive &&
                !isMobile && <InactiveMeetingDetails meeting={meeting} />
              )}
            </Stack>
          </Box>
        </Box>
      </NextLink>

      {isCSM ? (
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
      ) : null}
    </Stack>
  );
};

export const MeetingTabItem = React.memo(MeetingTabItemBase);

MeetingTabItem.displayName = "MeetingTabItem";
