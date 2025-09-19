import buildApiClient from '@/domain-models/apiClient'
import type { paths } from '@/domain-models/generated-schema'

export async function listClients(page?: number, limit?: number) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/clients', {
    params: {
      query: {
        page,
        limit,
      },
    },
  })
}

export async function createClient(
  client: paths['/clients']['post']['requestBody']['content']['application/json']
) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/clients', {
    body: client,
  })
}

export async function getClientByTicker(ticker: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/clients/{ticker}', {
    params: {
      path: { ticker },
    },
  })
}

export async function updateClient(
  ticker: string,
  updates: {
    companyName?: string
    shortName?: string
    industry?: string
    description?: string
    website?: string
    primaryContact?: string
    primaryContactEmail?: string
    isActive?: boolean
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.PUT('/clients/{ticker}', {
    params: {
      path: { ticker },
    },
    body: updates,
  })
}
