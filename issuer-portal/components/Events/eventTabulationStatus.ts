import type { ChipProps } from "@mui/material";

import type { EventRow, TabulationReleaseState } from "@/utils/eventData";

import {
  tabulationReleaseOpensAt,
  tabulationReleaseState,
} from "@/utils/eventData";

export const TABULATION_RELEASED_LABEL = "Released";
export const TABULATION_READY_LABEL = "Ready to Release";

export const TABULATION_TOO_EARLY_LABEL = "Not Available";

/** The three values the tabulation column filters and sorts on. */
export const TABULATION_STATUS_OPTIONS = [
  TABULATION_RELEASED_LABEL,
  TABULATION_READY_LABEL,
  TABULATION_TOO_EARLY_LABEL,
] as const;

/** The label a row shows, which is also what the column filters on. */
export const getTabulationStatusLabel = (event: EventRow, now: Date): string =>
  TABULATION_STATE_PRESENTATION[tabulationReleaseState(event, now)].label;

export const isTabulationReleasedLabel = (label: string): boolean =>
  label === TABULATION_RELEASED_LABEL;

/**
 * How each release state presents in the grid.
 *
 * @remarks
 * `awaiting` carries the warning colour because it is the state that wants a
 * decision — it is exactly what the Events tab badge counts. `tooEarly` is
 * greyed and inert: there is nothing wrong with it, there is simply nothing to
 * do yet, and colouring it would compete with the rows that do need attention.
 */
export const TABULATION_STATE_PRESENTATION: Record<
  TabulationReleaseState,
  { readonly label: string; readonly color: ChipProps["color"] }
> = {
  released: { label: TABULATION_RELEASED_LABEL, color: "success" },
  awaiting: { label: TABULATION_READY_LABEL, color: "warning" },
  tooEarly: { label: TABULATION_TOO_EARLY_LABEL, color: "default" },
};

/** Why a too-early event cannot be released yet, for the chip's tooltip. */
export const tabulationTooEarlyReason = (event: EventRow): string => {
  const opensAt = tabulationReleaseOpensAt(event);
  if (opensAt === null) {
    return "Tabulation is not available to release yet.";
  }

  return `Tabulation can be released from ${opensAt.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  )}, 15 days before the meeting.`;
};
