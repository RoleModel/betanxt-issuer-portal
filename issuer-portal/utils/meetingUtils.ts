// Meeting utility functions

export interface MeetingPhase {
  id: string
  name: string
  status: 'upcoming' | 'active' | 'completed'
  startDate?: string
  endDate?: string
}

export interface Meeting {
  id: string
  title?: string
  ticker?: string
  status?: 'ACTIVE' | 'COMPLETE' | 'ADJOURNED'
  meetingDate?: string
  phases?: MeetingPhase[]
}

/**
 * Get the current active phase for a meeting
 */
export function getCurrentPhase(meeting: Meeting): MeetingPhase | null {
  if (!meeting.phases) return null

  return meeting.phases.find((phase) => phase.status === 'active') ?? null
}

/**
 * Get the next upcoming phase for a meeting
 */
export function getNextPhase(meeting: Meeting): MeetingPhase | null {
  if (!meeting.phases) return null

  const upcomingPhases = meeting.phases.filter((phase) => phase.status === 'upcoming')
  return upcomingPhases[0] ?? null
}

/**
 * Check if a meeting is currently active
 */
export function isMeetingActive(meeting: Meeting): boolean {
  return meeting.status === 'ACTIVE'
}

/**
 * Check if a meeting is completed
 */
export function isMeetingCompleted(meeting: Meeting): boolean {
  return meeting.status === 'COMPLETE'
}

/**
 * Get meeting progress percentage
 */
export function getMeetingProgress(meeting: Meeting): number {
  if (!meeting.phases || meeting.phases.length === 0) return 0

  const completedPhases = meeting.phases.filter(
    (phase) => phase.status === 'completed'
  ).length
  return Math.round((completedPhases / meeting.phases.length) * 100)
}

/**
 * Format meeting date for display
 */
export function formatMeetingDate(dateString?: string): string {
  if (!dateString) return 'Date TBD'

  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return 'Invalid Date'
  }
}

/**
 * Get meeting status color for UI
 */
export function getMeetingStatusColor(
  status?: string
): 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'COMPLETE':
      return 'info'
    case 'ADJOURNED':
      return 'warning'
    default:
      return 'info'
  }
}
