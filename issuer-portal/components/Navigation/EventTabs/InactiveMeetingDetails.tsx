"use client";

import { Box, Stack, Typography } from "@mui/material";

import type { MeetingTab } from "./types";

import GlossaryText from "@/components/ui/GlossaryText";

export const InactiveMeetingDetails = ({
  meeting,
}: {
  readonly meeting: MeetingTab;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      <Stack sx={{ alignItems: "flex-end" }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            lineHeight: 1.5,
            color: "inherit",
          }}
        >
          <GlossaryText>Meeting Date</GlossaryText>
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
