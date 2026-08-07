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
}

/** Build a meeting URL for an event row */
export function getMeetingUrl(row: EventRow): string {
  const routePrefix =
    row.meetingStatus === "ACTIVE" ? "meeting" : "past-meeting";
  return `/${row.clientTicker}/${routePrefix}/${row.meetingId}`;
}
