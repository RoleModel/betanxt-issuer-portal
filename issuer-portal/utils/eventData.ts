/**
 * Event data types and URL helpers.
 * Event rows are fetched dynamically via the useEvents hook.
 */

export interface EventRow {
  id: string;
  event: string;
  cusip: string;
  setKey: string | null;
  eventDate: string;
  mailingDate?: string | null;
  brokerSearchDate?: string | null;
  recordDate?: string | null;
  eventType: "Annual Meeting" | "Special Meeting";
  meetingId: string;
  clientTicker: string;
  meetingStatus: "ACTIVE" | "COMPLETE";
  /** Internal CSM tabulation QC state; null when no review record exists yet */
  reportStatus: "PENDING_REVIEW" | "VERIFIED" | null;
  mailingStatus: string | null;
  exchange: string | null;
  quorumRequirement: number | null;
}

/** Build a meeting URL for an event row */
export function getMeetingUrl(row: EventRow): string {
  const routePrefix = row.meetingStatus === "ACTIVE" ? "meeting" : "past-meeting";
  return `/${row.clientTicker}/${routePrefix}/${row.meetingId}`;
}
