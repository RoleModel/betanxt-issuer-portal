/**
 * Event data types and URL helpers.
 * Event rows are fetched dynamically via the useEvents hook.
 */

export interface EventRow {
  id: string
  event: string
  cusip: string
  eventDate: string
  eventType: 'Annual Meeting' | 'Special Meeting'
  meetingId: string
  clientTicker: string
  meetingStatus: 'ACTIVE' | 'COMPLETE'
  mailingStatus: string | null
}

/** Build a meeting URL for an event row */
export function getMeetingUrl(row: EventRow): string {
  const routePrefix = row.meetingStatus === 'ACTIVE' ? 'meeting' : 'past-meeting'
  return `/${row.clientTicker}/${routePrefix}/${row.meetingId}`
}
