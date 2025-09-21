import buildApiClient from '@/domain-models/apiClient'
import type { paths } from '@/domain-models/generated-schema'

export async function listClients(page?: number, limit?: number): Promise<any> {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/client', {
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
): Promise<any> {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/client', {
    body: client,
  })
}

export async function getClientByTicker(ticker: string): Promise<any> {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/client/{ticker}', {
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
): Promise<any> {
  const apiClient = await buildApiClient()

  return await apiClient.PUT('/client/{ticker}', {
    params: {
      path: { ticker },
    },
    body: updates,
  })
}
