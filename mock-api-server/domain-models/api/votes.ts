import type { components, paths } from '@/types/api'

import { apiClient } from '../apiClient'

// Use generated types from OpenAPI schema
type PositionVote = components['schemas']['PositionVote']
type CastVoteRequest = components['schemas']['CastVoteRequest']

// Helper type for openapi-fetch response
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
  response: Response
}

export async function listPositionVotes(opts?: {
  positionId?: string
  proposalId?: string
  vote?: string
}): Promise<ApiResponse<PositionVote[] | undefined>> {
  const { data, error, response } = await apiClient.GET('/position_votes', {
    params: {
      query: {
        positionId: opts?.positionId,
        proposalId: opts?.proposalId,
        vote: opts?.vote,
      },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to fetch position votes',
        statusCode: response.status,
      },
      response,
    }
  }

  return {
    data: data || [],
    error: undefined,
    response,
  }
}

export async function createPositionVote(
  body: CastVoteRequest
): Promise<ApiResponse<PositionVote>> {
  const { data, error, response } = await apiClient.POST('/position_votes', {
    body,
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to create position vote',
        statusCode: response.status,
      },
      response,
    }
  }

  return {
    data,
    error: undefined,
    response,
  }
}
