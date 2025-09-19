import buildApiClient, { ApiClientReturnType } from '@/domain-models/apiClient'

export async function listUsers(
  accountId?: string,
  type?: 'ADMIN' | 'ISSUER' | 'RELATIONSHIP_MANAGER'
) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/users', {
    params: {
      query: {
        accountId,
        type,
      },
    },
  })
}

export async function createUser(user: {
  username: string
  firstName: string
  lastName: string
  email: string
  password: string
  type: 'ADMIN' | 'ISSUER' | 'RELATIONSHIP_MANAGER'
  accountId: string
}) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/users', {
    body: user,
  })
}

export async function getUserById(id: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/users/{id}', {
    params: {
      path: { id },
    },
  })
}

export async function updateUser(
  id: string,
  updates: {
    username?: string
    firstName?: string
    lastName?: string
    email?: string
    password?: string
    type?: 'ADMIN' | 'ISSUER' | 'RELATIONSHIP_MANAGER'
    accountId?: string
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.PUT('/users/{id}', {
    params: {
      path: { id },
    },
    body: updates,
  })
}

export async function deleteUser(id: string) {
  const apiClient = await buildApiClient()

  return await apiClient.DELETE('/users/{id}', {
    params: {
      path: { id },
    },
  })
}
