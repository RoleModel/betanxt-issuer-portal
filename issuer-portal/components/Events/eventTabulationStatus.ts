import type { EventRow } from "@/utils/eventData";

export const TABULATION_RELEASED_LABEL = "Released";
export const TABULATION_NOT_RELEASED_LABEL = "Not Released";

/** The two values the tabulation column filters and sorts on. */
export const TABULATION_STATUS_OPTIONS = [
  TABULATION_RELEASED_LABEL,
  TABULATION_NOT_RELEASED_LABEL,
] as const;

export const getTabulationStatusLabel = (event: EventRow): string =>
  event.tabulationReleased
    ? TABULATION_RELEASED_LABEL
    : TABULATION_NOT_RELEASED_LABEL;

export const isTabulationReleasedLabel = (label: string): boolean =>
  label === TABULATION_RELEASED_LABEL;
