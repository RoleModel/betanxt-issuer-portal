import buildApiClient, { ApiClientReturnType } from '@/domain-models/apiClient'

export async function listPositions(params?: {
  meetingId?: string
  cusip?: string
  accountType?: string
  voteStatus?: string
  page?: number
  limit?: number
}) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/positions', {
    params: {
      query: params,
    },
  })
}

export async function createPosition(position: {
  meetingId: string
  cusip: string
  accountType: string
  setKey: string
  name: string
  accountNumber?: string
  voteStatus: 'Voted' | 'Unvoted'
  shares: number
  sharesVoted?: number
  source?: 'WEB' | 'PRINT' | 'IVR'
  dateVoted?: string
}) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/positions', {
    body: position,
  })
}

export async function getPositionById(id: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/positions/{id}', {
    params: {
      path: { id },
    },
  })
}

export async function updatePosition(
  id: string,
  updates: {
    voteStatus?: 'Voted' | 'Unvoted'
    sharesVoted?: number
    source?: 'WEB' | 'PRINT' | 'IVR'
    dateVoted?: string
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.PUT('/positions/{id}', {
    params: {
      path: { id },
    },
    body: updates,
  })
}

export async function getPositionVotes(params: {
  positionId?: string
  proposalId?: string
}) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/position_votes', {
    params: {
      query: params,
    },
  })
}

export async function createPositionVote(vote: {
  positionId: string
  proposalId: string
  vote: 'FOR' | 'AGAINST' | 'ABSTAIN' | 'WITHHOLD'
  sharesVoting: string
}) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/position_votes', {
    body: vote,
  })
}
