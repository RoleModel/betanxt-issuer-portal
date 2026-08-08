/**
 * Event data types and URL helpers.
 * Event rows are fetched dynamically via the useEvents hook.
 */

export interface EventRow {
  id: string;
  event: string;
  cusip: string;
  /**
   * Broadridge set key for the event, e.g. `WENJ2025`.
   *
   * Optional because the API does not serve it yet: `setKey` is on the
   * Position schema but not on Meeting, so every meeting returns none. The
   * column renders blank until it is added to the meeting schema and seeded.
   */
  setKey?: string | null;
  eventDate: string;
  mailingDate?: string | null;
  brokerSearchDate?: string | null;
  recordDate?: string | null;
  eventType: "Annual Meeting" | "Special Meeting";
  meetingId: string;
  clientTicker: string;
  meetingStatus: "ACTIVE" | "COMPLETE";
  mailingStatus: string | null;
  exchange: string | null;
  quorumRequirement: number | null;
  /**
   * Whether a CSM has released this event's tabulation results.
   *
   * Tabulation stays hidden on every surface until this flips to `true`, so
   * the events index treats a missing value from the API as "not released".
   */
  tabulationReleased: boolean;
  /**
   * The meeting date as the API returned it, unformatted.
   *
   * `eventDate` beside it is already localised for display, so deriving a
   * deadline from it would mean parsing a string built for a human.
   */
  meetingDateIso: string;
}

/**
 * How long before a meeting its tabulation is expected to be released.
 *
 * @remarks
 * The same fifteen days the locked empty state quotes. It is a expectation
 * about when a CSM acts, not a rule the app enforces — nothing unlocks on a
 * date, so this only decides when the events tab starts asking.
 */
export const TABULATION_APPROVAL_WINDOW_DAYS = 15;

/**
 * Where an event stands on releasing its tabulation.
 *
 * - `released` — a CSM has released it and the client can see the results.
 * - `awaiting` — inside the window and still withheld. This is the only state
 *   a CSM can act on, and the only one the Events tab counts.
 * - `tooEarly` — the meeting is far enough out that there is nothing to
 *   release yet. Releasing here would publish a tabulation of a vote that has
 *   barely started.
 */
export type TabulationReleaseState = "released" | "awaiting" | "tooEarly";

/** The date from which an event's tabulation may be released. */
export function tabulationReleaseOpensAt(row: EventRow): Date | null {
  const meetingDate = new Date(row.meetingDateIso);
  if (Number.isNaN(meetingDate.getTime())) {
    return null;
  }

  const opensAt = new Date(meetingDate);
  opensAt.setDate(opensAt.getDate() - TABULATION_APPROVAL_WINDOW_DAYS);
  return opensAt;
}

/** Which of the three release states an event is in. */
export function tabulationReleaseState(
  row: EventRow,
  now: Date
): TabulationReleaseState {
  if (row.tabulationReleased) {
    return "released";
  }

  const opensAt = tabulationReleaseOpensAt(row);
  if (opensAt === null || now >= opensAt) {
    return "awaiting";
  }
  return "tooEarly";
}

/**
 * Whether an event is waiting on a CSM to release its tabulation.
 *
 * @remarks
 * Three conditions, and all of them matter. Unreleased alone counts every
 * meeting ever seeded — 554 of them here — which is a badge nobody reads.
 * Active drops the meetings already behind us, matching the events grid,
 * which also lists only active events unless you search. And the window drops
 * the ones whose date is far enough out that there is nothing to decide yet.
 */
export function needsTabulationApproval(row: EventRow, now: Date): boolean {
  return (
    row.meetingStatus === "ACTIVE" &&
    tabulationReleaseState(row, now) === "awaiting"
  );
}

/** How many events are waiting on a release. */
export function countTabulationApprovals(
  rows: readonly EventRow[],
  now: Date
): number {
  return rows.filter((row) => needsTabulationApproval(row, now)).length;
}

/** Build a meeting URL for an event row */
export function getMeetingUrl(row: EventRow): string {
  const routePrefix =
    row.meetingStatus === "ACTIVE" ? "meeting" : "past-meeting";
  return `/${row.clientTicker}/${routePrefix}/${row.meetingId}`;
}
