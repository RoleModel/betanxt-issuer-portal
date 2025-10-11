import type { components } from '@/types/api'

import { apiClient } from '../apiClient'

// Use generated types from OpenAPI schema
type Client = components['schemas']['Clients']
type CreateClientRequest = components['schemas']['CreateClientRequest']
type UpdateClientRequest = components['schemas']['UpdateClientRequest']

// Helper type for openapi-fetch response
interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
  response: Response
}

export async function listClients(
  page?: number,
  limit?: number,
  ticker?: string
): Promise<
  ApiResponse<{ clients?: Client[]; pagination?: components['schemas']['Pagination'] }>
> {
  const { data, error, response } = await apiClient.GET('/clients', {
    params: {
      query: {
        page,
        limit,
        ticker,
      },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? 'Failed to fetch clients',
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

export async function createClient(clientData: unknown): Promise<ApiResponse<Client>> {
  const { data, error, response } = await apiClient.POST('/clients', {
    body: clientData as CreateClientRequest,
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? 'Failed to create client',
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

export async function getClientByTicker(ticker: string): Promise<ApiResponse<Client>> {
  const { data, error, response } = await apiClient.GET('/clients/{ticker}', {
    params: {
      path: { ticker },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? 'Failed to fetch client',
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

export async function updateClient(
  ticker: string,
  clientData: unknown
): Promise<ApiResponse<Client>> {
  const { data, error, response } = await apiClient.PUT('/clients/{ticker}', {
    params: {
      path: { ticker },
    },
    body: clientData as UpdateClientRequest,
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? 'Failed to update client',
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

export async function deleteClient(ticker: string): Promise<ApiResponse<void>> {
  const { data, error, response } = await apiClient.DELETE('/clients/{ticker}', {
    params: {
      path: { ticker },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? 'Failed to delete client',
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
