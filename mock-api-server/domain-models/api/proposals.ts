import type { components, paths } from '@/types/api'

import { apiClient } from '../apiClient'

// Use generated types from OpenAPI schema
type Proposal = components['schemas']['Proposal']
type CreateProposalRequest = components['schemas']['CreateProposalRequest']
type UpdateProposalRequest = components['schemas']['UpdateProposalRequest']

// Helper type for openapi-fetch response
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
  response: Response
}

export async function listProposals(
  meetingId: string,
  proposalType?: string
): Promise<ApiResponse<Proposal[] | undefined>> {
  const { data, error, response } = await apiClient.GET(
    '/meetings/{meetingId}/proposals',
    {
      params: {
        path: { meetingId },
        query: {
          proposalType,
        },
      },
    }
  )

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to fetch proposals',
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

export async function createProposal(
  meetingId: string,
  body: CreateProposalRequest
): Promise<ApiResponse<Proposal>> {
  const { data, error, response } = await apiClient.POST(
    '/meetings/{meetingId}/proposals',
    {
      params: {
        path: { meetingId },
      },
      body,
    }
  )

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to create proposal',
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

export async function getProposalById(id: string): Promise<ApiResponse<Proposal>> {
  const { data, error, response } = await apiClient.GET('/proposals/{id}', {
    params: {
      path: { id },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to fetch proposal',
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

export async function updateProposal(
  id: string,
  body: UpdateProposalRequest
): Promise<ApiResponse<Proposal>> {
  const { data, error, response } = await apiClient.PUT('/proposals/{id}', {
    params: {
      path: { id },
    },
    body,
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to update proposal',
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
