import type { components, paths } from '@/types/api'

import { apiClient } from '../apiClient'

// Use generated types from OpenAPI schema
type Meeting = components['schemas']['Meeting']
type Phase = components['schemas']['Phase']

// Helper type for openapi-fetch response
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
  response: Response
}

export type KeyDate = {
  id: string
  title: string
  date: string | null
  phaseNumber: number
}

export async function listKeyDatesForMeeting(
  meetingId: string
): Promise<ApiResponse<KeyDate[] | undefined>> {
  // Fetch meeting for top-level dates
  const {
    data: meeting,
    error: meetingError,
    response: meetingResponse,
  } = await apiClient.GET('/meetings/{meetingId}', {
    params: {
      path: { meetingId },
    },
  })

  if (meetingError) {
    return {
      data: undefined,
      error: {
        message: meetingError.message || 'Failed to fetch meeting',
        statusCode: meetingResponse.status,
      },
      response: meetingResponse,
    }
  }

  // Fetch phases for phase-level key dates
  const {
    data: phases,
    error: phasesError,
    response: phasesResponse,
  } = await apiClient.GET('/meetings/{meetingId}/phases', {
    params: {
      path: { meetingId },
    },
  })

  if (phasesError) {
    return {
      data: undefined,
      error: {
        message: phasesError.message || 'Failed to fetch phases',
        statusCode: phasesResponse.status,
      },
      response: phasesResponse,
    }
  }

  const result: KeyDate[] = []

  // Include meeting-level dates with correct phase assignments
  if (meeting.preFilingDate) {
    result.push({
      id: `${meeting.id}-prefiling`,
      title: 'Pre-Filing Date',
      date: meeting.preFilingDate,
      phaseNumber: 1,
    })
  }
  if (meeting.filingDate) {
    result.push({
      id: `${meeting.id}-filing`,
      title: 'Filing Date',
      date: meeting.filingDate,
      phaseNumber: 1,
    })
  }
  if (meeting.brokerSearchDate) {
    result.push({
      id: `${meeting.id}-brokersearch`,
      title: 'Broker Search Date',
      date: meeting.brokerSearchDate,
      phaseNumber: 3,
    })
  }
  if (meeting.recordDate) {
    result.push({
      id: `${meeting.id}-record`,
      title: 'Record Date',
      date: meeting.recordDate,
      phaseNumber: 4,
    })
  }
  if (meeting.mailingDate) {
    result.push({
      id: `${meeting.id}-mailing`,
      title: 'Mailing Date',
      date: meeting.mailingDate,
      phaseNumber: 6,
    })
  }
  if (meeting.meetingDate) {
    result.push({
      id: `${meeting.id}-meeting`,
      title: 'Meeting Date',
      date: meeting.meetingDate,
      phaseNumber: 8,
    })
  }

  // Phase-level key dates
  for (const phase of phases || []) {
    const pn = phase.orderIndex ?? 0
    const kd = phase.keyDates || {}
    if (kd.startDate) {
      result.push({
        id: `${phase.id}-start`,
        title: 'Start Date',
        date: kd.startDate,
        phaseNumber: pn,
      })
    }
    if (kd.endDate) {
      result.push({
        id: `${phase.id}-end`,
        title: 'End Date',
        date: kd.endDate,
        phaseNumber: pn,
      })
    }
    if (kd.dueDate) {
      result.push({
        id: `${phase.id}-due`,
        title: 'Due Date',
        date: kd.dueDate,
        phaseNumber: pn,
      })
    }
    if (kd.completionDate) {
      result.push({
        id: `${phase.id}-completion`,
        title: 'Completion Date',
        date: kd.completionDate,
        phaseNumber: pn,
      })
    }
  }

  // Filter out null dates
  const filtered = result.filter((d) => !!d.date)
  return { data: filtered, error: undefined, response: meetingResponse }
}
