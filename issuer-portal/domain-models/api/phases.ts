import buildApiClient, { ApiClientReturnType } from '@/domain-models/apiClient'

export async function listPhasesByMeetingId(meetingId: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/meetings/{meetingId}/phases', {
    params: {
      path: { meetingId },
    },
  })
}

export async function createPhase(
  meetingId: string,
  phase: {
    name: string
    orderIndex: number
    status: 'COMPLETE' | 'IN_PROGRESS'
    keyDates?: any
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/meetings/{meetingId}/phases', {
    params: {
      path: { meetingId },
    },
    body: phase,
  })
}

export async function getPhaseById(id: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/phases/{id}', {
    params: {
      path: { id },
    },
  })
}

export async function updatePhase(
  id: string,
  updates: {
    name?: string
    orderIndex?: number
    status?: 'COMPLETE' | 'IN_PROGRESS'
    keyDates?: any
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.PUT('/phases/{id}', {
    params: {
      path: { id },
    },
    body: updates,
  })
}
