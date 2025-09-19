import buildApiClient from '@/domain-models/apiClient'
import type { paths } from '@/domain-models/generated-schema'

export async function listAccounts(page?: number, limit?: number) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/accounts', {
    params: {
      query: {
        page,
        limit,
      },
    },
  })
}

export async function createAccount(
  account: paths['/accounts']['post']['requestBody']['content']['application/json']
) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/accounts', {
    body: account,
  })
}

export async function getAccountById(id: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/accounts/{accountId}', {
    params: {
      path: { accountId: id },
    },
  })
}

export async function updateAccount(
  id: string,
  updates: {
    account?: string
    name?: string
    primaryContact?: string
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.PUT('/accounts/{accountId}', {
    params: {
      path: { accountId: id },
    },
    body: updates,
  })
}

export async function deleteAccount(id: string) {
  const apiClient = await buildApiClient()

  return await apiClient.DELETE('/accounts/{accountId}', {
    params: {
      path: { accountId: id },
    },
  })
}

export async function listAccountUsers(accountId: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/accounts/{accountId}/users', {
    params: {
      path: { accountId },
    },
  })
}

export async function createAccountUser(
  accountId: string,
  user: paths['/accounts/{accountId}/users']['post']['requestBody']['content']['application/json']
) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/accounts/{accountId}/users', {
    params: {
      path: { accountId },
    },
    body: user,
  })
}

export async function listUserAccounts(userId: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/users/{id}/accounts', {
    params: {
      path: { id: userId },
    },
  })
}
