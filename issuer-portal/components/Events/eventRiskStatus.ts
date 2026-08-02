import type { EventRow } from "@/utils/eventData";

export const AT_RISK_LABEL = "At Risk";
export const ON_SCHEDULE_LABEL = "On Schedule";

/**
 * An event is at risk when it still has an overdue, unfinished task. Completed
 * events are always on schedule — there is nothing left to fall behind on.
 */
export const getEventRiskLabel = (
  event: EventRow,
  atRiskMeetingIds: ReadonlySet<string>
): string =>
  event.meetingStatus === "ACTIVE" && atRiskMeetingIds.has(event.meetingId)
    ? AT_RISK_LABEL
    : ON_SCHEDULE_LABEL;

/** Parses the `MM/DD/YYYY` strings the event feed returns. */
export const parseEventDate = (date: string): Date | null => {
  const [month, day, year] = date.split("/").map(Number);

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(year)
  ) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};
