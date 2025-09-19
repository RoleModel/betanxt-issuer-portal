import buildApiClient, { ApiClientReturnType } from '@/domain-models/apiClient'

export async function login(username: string, password: string) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/auth/login', {
    body: {
      username,
      password,
    },
  })
}

export async function logout() {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/auth/logout')
}

export async function getCurrentUser() {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/auth/me')
}
