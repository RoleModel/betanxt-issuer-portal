import type { components } from '@/types/api'

import { apiClient } from '../apiClient'

// Use generated types from OpenAPI schema
type User = components['schemas']['User']
type CreateUserRequest = components['schemas']['CreateUserRequest']
type UpdateUserRequest = components['schemas']['UpdateUserRequest']
type CreateAccountUserRequest = components['schemas']['CreateAccountUserRequest']
type Account = components['schemas']['Account']

// Helper type for openapi-fetch response
interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
  response: Response
}

export async function listUsers(
  accountId?: string,
  type?: User['type']
): Promise<ApiResponse<User[] | undefined>> {
  const { data, error, response } = await apiClient.GET('/users', {
    params: {
      query: {
        accountId,
        type,
      },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to fetch users',
        statusCode: response.status,
      },
      response,
    }
  }

  return {
    data: data?.users || [],
    error: undefined,
    response,
  }
}

export async function createUser(body: CreateUserRequest): Promise<ApiResponse<User>> {
  const { data, error, response } = await apiClient.POST('/users', {
    body,
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to create user',
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

export async function getUserById(id: string): Promise<ApiResponse<User>> {
  const { data, error, response } = await apiClient.GET('/users/{id}', {
    params: {
      path: { id },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to fetch user',
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

export async function updateUser(
  id: string,
  body: UpdateUserRequest
): Promise<ApiResponse<User>> {
  const { data, error, response } = await apiClient.PUT('/users/{id}', {
    params: {
      path: { id },
    },
    body,
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to update user',
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

export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  const { error, response } = await apiClient.DELETE('/users/{id}', {
    params: {
      path: { id },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to delete user',
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

export async function listAccountUsers(
  accountId: string
): Promise<ApiResponse<User[] | undefined>> {
  const { data, error, response } = await apiClient.GET('/accounts/{accountId}/users', {
    params: {
      path: { accountId },
    },
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to fetch users',
        statusCode: response.status,
      },
      response,
    }
  }

  return {
    data: data?.users || [],
    error: undefined,
    response,
  }
}

export async function createAccountUser(
  accountId: string,
  body: CreateAccountUserRequest
): Promise<ApiResponse<User>> {
  const { data, error, response } = await apiClient.POST('/accounts/{accountId}/users', {
    params: {
      path: { accountId },
    },
    body,
  })

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message || 'Failed to create user',
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
        message: error.message || 'Failed to fetch user accounts',
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
