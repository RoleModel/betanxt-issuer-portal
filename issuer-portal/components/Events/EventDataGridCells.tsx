"use client";

import type { MouseEvent } from "react";

import { DashboardOutlined, EditOutlined, FactCheckOutlined } from "@mui/icons-material";
import { Chip, IconButton, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type { EventRow } from "@/utils/eventData";

import { CustomTooltip } from "@/components/ui/CustomToolTip";
import { getMeetingUrl } from "@/utils/eventData";

import { AT_RISK_LABEL } from "./eventRiskStatus";

/** Event name over its type, linking through to the meeting dashboard. */
export const EventPrimaryCell = ({ event }: { readonly event: EventRow }) => (
  <Stack direction="column" minWidth={0}>
    <Typography
      color="primary"
      component={Link}
      href={`${getMeetingUrl(event)}/dashboard`}
      noWrap
      variant="body3"
      sx={{ fontWeight: 600 }}
    >
      {event.event}
    </Typography>
    <Typography color="text.secondary" noWrap variant="body3">
      {event.eventType}
    </Typography>
  </Stack>
);

/** Risk chip. Red for at-risk, green otherwise. */
export const EventStatusCell = ({ value }: { readonly value: string | undefined }) => (
  <Chip
    color={value === AT_RISK_LABEL ? "error" : "success"}
    label={value}
    size="small"
    variant="outlined"
  />
);

/** Internal CSM tabulation review status chip. */
export const EventReportStatusCell = ({
  onClick,
  value,
}: {
  readonly onClick: (event: MouseEvent<HTMLElement>) => void;
  readonly value: string | undefined;
}) => (
  <Chip
    color={value === "Verified" ? "success" : "warning"}
    label={value ?? "Needs review"}
    onClick={onClick}
    size="small"
    sx={{ cursor: "pointer" }}
    variant="outlined"
  />
);

/** Row actions: review tabulation, open the dashboard, or edit the event. */
export const EventActionsCell = ({
  event,
  showReviewAction,
}: {
  readonly event: EventRow;
  readonly showReviewAction: boolean;
}) => (
  <Stack direction="row" spacing={0.25}>
    {showReviewAction ? (
      <CustomTooltip title="Review tabulation report">
        <IconButton
          aria-label={`Review tabulation report for ${event.event} ${event.eventType}`}
          component={Link}
          href={`/tabulation-review?meeting=${event.meetingId}`}
          size="small"
        >
          <FactCheckOutlined fontSize="small" />
        </IconButton>
      </CustomTooltip>
    ) : null}
    <CustomTooltip title="Open dashboard">
      <IconButton
        aria-label={`Open dashboard for ${event.event} ${event.eventType}`}
        component={Link}
        href={`${getMeetingUrl(event)}/dashboard`}
        size="small"
      >
        <DashboardOutlined fontSize="small" />
      </IconButton>
    </CustomTooltip>
    <CustomTooltip title="Edit event">
      <IconButton
        aria-label={`Edit ${event.event} ${event.eventType}`}
        component={Link}
        href={`/edit/${event.id}`}
        size="small"
      >
        <EditOutlined fontSize="small" />
      </IconButton>
    </CustomTooltip>
  </Stack>
);
