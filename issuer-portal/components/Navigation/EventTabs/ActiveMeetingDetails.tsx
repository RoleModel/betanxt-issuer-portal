"use client";

import { Box, Stack } from "@mui/material";
import { BNTypographyPair } from "@rolemodel/betanxt-design-system/components/BNTypographyPair";

import GlossaryText from "@/components/ui/GlossaryText";
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
            text: <GlossaryText>{getCusipLabel(meeting.cusip)}</GlossaryText>,
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
            text: <GlossaryText>Record Date</GlossaryText>,
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
            text: <GlossaryText>Mailing Date</GlossaryText>,
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
            text: <GlossaryText>Meeting Date</GlossaryText>,
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
