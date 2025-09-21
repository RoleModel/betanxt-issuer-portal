import buildApiClient from '@/domain-models/apiClient'
import type { paths } from '@/domain-models/generated-schema'

// Meeting CRUD operations
export async function listMeetings(params?: {
  ticker?: string
  accountId?: string
  status?: 'ACTIVE' | 'COMPLETE' | 'ADJOURNED'
  meetingYear?: number
  page?: number
  limit?: number
}) {
  const apiClient = await buildApiClient()

  try {
    const result = await apiClient.GET('/meetings', {
      params: {
        query: params,
      },
    })

    return result
  } catch (error) {
    throw error
  }
}

export async function createMeeting(
  meeting: paths['/meetings']['post']['requestBody']['content']['application/json']
) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/meetings', {
    body: meeting,
  })
}

export async function getMeetingById(id: string) {
  const apiClient = await buildApiClient()

  try {
    const result = await apiClient.GET('/meetings/{meetingId}', {
      params: {
        path: { meetingId: id },
      },
    })
    return result
  } catch (error) {
    throw error
  }
}

export async function updateMeeting(
  id: string,
  updates: paths['/meetings/{meetingId}']['put']['requestBody']['content']['application/json']
) {
  const apiClient = await buildApiClient()

  return await apiClient.PUT('/meetings/{meetingId}', {
    params: {
      path: { meetingId: id },
    },
    body: updates,
  })
}

export async function deleteMeeting(id: string) {
  const apiClient = await buildApiClient()

  return await apiClient.DELETE('/meetings/{meetingId}', {
    params: {
      path: { meetingId: id },
    },
  })
}

// Helper function for backwards compatibility
export async function getMeetings() {
  const currentYear = new Date().getFullYear()
  return listMeetings({ status: 'ACTIVE', meetingYear: currentYear })
}

// Helper function for backwards compatibility
export async function getMeeting(meetingId: string) {
  return getMeetingById(meetingId)
}

// Meeting related resources
export async function getMeetingPhases(meetingId: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/meetings/{meetingId}/phases', {
    params: {
      path: { meetingId },
    },
  })
}

export async function getMeetingTasks(
  meetingId: string,
  params?: {
    phaseId?: string
    status?: 'COMPLETE' | 'INCOMPLETE' | 'CANCELLED'
    owner?: string
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/meetings/{meetingId}/tasks', {
    params: {
      path: { meetingId },
      query: params,
    },
  })
}

export async function getMeetingDocuments(
  meetingId: string,
  params?: {
    type?: string
    status?: 'IN_PROGRESS' | 'DRAFT' | 'UPLOADED' | 'SIGNED' | 'AUTHORIZED' | 'COMPLETED'
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/meetings/{meetingId}/documents', {
    params: {
      path: { meetingId },
      query: params,
    },
  })
}

export async function getMeetingProposals(meetingId: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/meetings/{meetingId}/proposals', {
    params: {
      path: { meetingId },
    },
  })
}

// Get positions for a specific meeting using the standard positions endpoint
export async function getMeetingPositions(meetingId: string) {
  const apiClient = await buildApiClient()

  try {
    const result = await apiClient.GET('/positions', {
      params: {
        query: { meetingId },
      },
    })

    return result
  } catch (error) {
    throw error
  }
}

// Get meeting data for tabulation calculations
export async function getMeetingTabulation(meetingId: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/meetings/{meetingId}', {
    params: {
      path: { meetingId },
    },
  })
}

// Get vote statistics for a meeting
export async function getMeetingVoteStats(meetingId: string) {
  const apiClient = await buildApiClient()

  try {
    // Get total positions for the meeting
    const totalPositionsResult = await apiClient.GET('/positions', {
      params: {
        query: { meetingId, select: 'count' },
      },
    })

    // Get voted positions for the meeting
    const votedPositionsResult = await apiClient.GET('/positions', {
      params: {
        query: { meetingId, voteStatus: 'eq.Voted', select: 'count' },
      },
    })

    return {
      totalPositions: totalPositionsResult.data?.length || 0,
      votedPositions: votedPositionsResult.data?.length || 0,
    }
  } catch (error) {
    throw error
  }
}
