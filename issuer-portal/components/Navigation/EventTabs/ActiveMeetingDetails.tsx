"use client";

import { Box, Stack } from "@mui/material";
import { BNTypographyPair } from "@rolemodel/betanxt-design-system/components/BNTypographyPair";

import { getCusipLabel } from "@/utils/cusipDisplay";

import type { MeetingTab } from "./types";

import { getCusipDisplayValue } from "./utilities";

export const ActiveMeetingDetails = ({
  meeting,
}: {
  readonly meeting: MeetingTab;
}) => {
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
