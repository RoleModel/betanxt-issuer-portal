import type { components } from '@/types/api'

import { apiClient } from '../apiClient'

// Use generated types from OpenAPI schema
type Account = components['schemas']['Account']
type CreateAccountRequest = components['schemas']['CreateAccountRequest']
type UpdateAccountRequest = components['schemas']['UpdateAccountRequest']
type Pagination = components['schemas']['Pagination']

// Helper type for openapi-fetch response
interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
  response: Response
}

export async function listAccounts(
  page?: number,
  limit?: number
): Promise<ApiResponse<{ accounts?: Account[]; pagination?: Pagination }>> {
  const { data, error, response } = await apiClient.GET('/accounts', {
    params: {
      query: {
        page,
        limit,
      },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? 'Failed to fetch accounts',
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

export async function createAccount(
  accountData: CreateAccountRequest
): Promise<ApiResponse<Account>> {
  const { data, error, response } = await apiClient.POST('/accounts', {
    body: accountData,
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? 'Failed to create account',
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

export async function getAccountById(id: string): Promise<ApiResponse<Account>> {
  const { data, error, response } = await apiClient.GET('/accounts/{accountId}', {
    params: {
      path: { accountId: id },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? 'Failed to fetch account',
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

export async function updateAccount(
  id: string,
  accountData: UpdateAccountRequest
): Promise<ApiResponse<Account>> {
  const { data, error, response } = await apiClient.PUT('/accounts/{accountId}', {
    params: {
      path: { accountId: id },
    },
    body: accountData,
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? 'Failed to update account',
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

export async function deleteAccount(id: string): Promise<ApiResponse<void>> {
  const { error, response } = await apiClient.DELETE('/accounts/{accountId}', {
    params: {
      path: { accountId: id },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? 'Failed to delete account',
        statusCode: response.status,
      },
      response,
    }
  }

  return {
    data: undefined,
    error: undefined,
    response,
  }
}

export async function listUserAccounts(
  userId: string
): Promise<ApiResponse<{ accounts?: Account[]; total?: number }>> {
  const { data, error, response } = await apiClient.GET('/users/{id}/accounts', {
    params: {
      path: { id: userId },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? 'Failed to fetch user accounts',
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
