import buildApiClient, { ApiClientReturnType } from '@/domain-models/apiClient'

export async function createProposal(
  meetingId: string,
  proposal: {
    proposalNumber: number
    proposalTitle: string
    proposalType: string
    proposalSubtype?: string
    directorName?: string
    directorTermYears?: number
    directorClass?: string
    termExpirationYear?: number
    frequencyOptions?: any
    recommendation: string
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/meetings/{meetingId}/proposals', {
    params: {
      path: { meetingId },
    },
    body: proposal,
  })
}

export async function getProposalById(id: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/proposals/{id}', {
    params: {
      path: { id },
    },
  })
}

export async function updateProposal(
  id: string,
  updates: {
    proposalTitle?: string
    proposalType?: string
    proposalSubtype?: string
    directorName?: string
    directorTermYears?: number
    directorClass?: string
    termExpirationYear?: number
    frequencyOptions?: any
    recommendation?: string
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.PUT('/proposals/{id}', {
    params: {
      path: { id },
    },
    body: updates,
  })
}

export async function listProposals(meetingId?: string) {
  const apiClient = await buildApiClient()

  if (meetingId) {
    return await apiClient.GET('/meetings/{meetingId}/proposals', {
      params: {
        path: { meetingId },
      },
    })
  }

  return await apiClient.GET('/proposals')
}
