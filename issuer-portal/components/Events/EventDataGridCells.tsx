"use client";

import {
  ArrowDropDownOutlined,
  DashboardOutlined,
  EditOutlined,
} from "@mui/icons-material";
import {
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useId, useState } from "react";

import type { EventRow } from "@/utils/eventData";

import { tabulationReleaseState } from "@/utils/eventData";

import { CustomTooltip } from "@/components/ui/CustomToolTip";
import { getMeetingUrl } from "@/utils/eventData";

import { AT_RISK_LABEL } from "./eventRiskStatus";
import {
  TABULATION_READY_LABEL,
  TABULATION_RELEASED_LABEL,
  TABULATION_STATE_PRESENTATION,
  tabulationTooEarlyReason,
} from "./eventTabulationStatus";

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
export const EventStatusCell = ({
  value,
}: {
  readonly value: string | undefined;
}) => (
  <Chip
    color={value === AT_RISK_LABEL ? "error" : "success"}
    label={value}
    size="small"
    variant="outlined"
  />
);

interface EventTabulationStatusCellProps {
  readonly event: EventRow;
  /** Read-only for anyone who cannot release — the chip renders without a menu. */
  readonly editable: boolean;
  readonly onChange: (event: EventRow, released: boolean) => void;
  readonly pending: boolean;
}

/**
 * Tabulation release chip. Green once released, grey until then.
 *
 * For a CSM the chip is a menu trigger — the same anchored-Menu pattern the
 * client switcher uses — so a single row can be released or pulled back
 * without leaving the index.
 */
export const EventTabulationStatusCell = ({
  event,
  editable,
  onChange,
  pending,
}: EventTabulationStatusCellProps) => {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const open = anchorElement !== null;
  const releaseState = tabulationReleaseState(event, new Date());
  const { label, color } = TABULATION_STATE_PRESENTATION[releaseState];
  // Releasing a meeting that is still weeks out would publish a tabulation of
  // a vote that has barely started, so the control is inert until the window
  // opens rather than merely discouraged.
  const isTooEarly = releaseState === "tooEarly";

  const closeMenu = () => {
    setAnchorElement(null);
  };

  const selectValue = (released: boolean) => {
    closeMenu();
    if (released !== event.tabulationReleased) {
      onChange(event, released);
    }
  };

  if (!editable) {
    return <Chip color={color} label={label} size="small" variant="outlined" />;
  }

  if (isTooEarly) {
    return (
      <CustomTooltip title={tabulationTooEarlyReason(event)}>
        <span>
          <Chip
            color={color}
            disabled
            label={label}
            size="small"
            variant="outlined"
          />
        </span>
      </CustomTooltip>
    );
  }

  return (
    <>
      <Chip
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Tabulation ${label} for ${event.event}. Change`}
        clickable
        color={color}
        disabled={pending || isTooEarly}
        label={
          <Stack alignItems="center" direction="row" spacing={0.25}>
            <span>{label}</span>
            {pending ? (
              <CircularProgress aria-label="Saving" size={12} />
            ) : (
              <ArrowDropDownOutlined fontSize="small" sx={{ mr: -0.5 }} />
            )}
          </Stack>
        }
        onClick={(clickEvent) => {
          setAnchorElement(clickEvent.currentTarget);
        }}
        size="small"
        variant="outlined"
      />
      <Menu
        anchorEl={anchorElement}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        id={menuId}
        onClose={closeMenu}
        open={open}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
      >
        <MenuItem
          onClick={() => {
            selectValue(true);
          }}
          selected={event.tabulationReleased}
        >
          {TABULATION_RELEASED_LABEL}
        </MenuItem>
        <MenuItem
          onClick={() => {
            selectValue(false);
          }}
          selected={!event.tabulationReleased}
        >
          {TABULATION_READY_LABEL}
        </MenuItem>
      </Menu>
    </>
  );
};

/** Row actions: open the dashboard, or edit the event. */
export const EventActionsCell = ({ event }: { readonly event: EventRow }) => (
  <Stack direction="row" spacing={0.25}>
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
