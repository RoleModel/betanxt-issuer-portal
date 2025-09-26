'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

export interface Client {
  id: string
  name: string
  ticker: string
  company_name?: string
  short_name?: string
  industry?: string
  description?: string
  website?: string
  primary_contact?: string
  primary_contact_email?: string
  is_active?: boolean
  branding_id?: number
  created_at?: string
  updated_at?: string
  // Added: accounts returned by /clients API (used for filtering meetings by accountId)
  accounts?: Array<{
    id: string
    name?: string
    primary_contact?: string
  }>
}

export interface UseClientsResult {
  clients: Client[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

type ApiClient = components['schemas']['Clients']

export const transformApiClients = (apiClients: ApiClient[]): Client[] => {
  return apiClients
    .filter(
      (client) => {
        // Handle both camelCase (from schema) and snake_case (from actual API)
        const hasId = client.id
        const hasTicker = client.ticker
        const hasName = client.companyName || client.shortName ||
                       (client as any).company_name || (client as any).short_name
        return hasId && hasTicker && hasName
      }
    )
    .map((client) => {
      // Handle both camelCase and snake_case fields
      const apiClient = client as any
      return {
        id: client.id as string,
        name: (client.companyName || client.shortName ||
               apiClient.company_name || apiClient.short_name) as string,
        ticker: client.ticker as string,
        company_name: client.companyName || apiClient.company_name || undefined,
        short_name: client.shortName || apiClient.short_name || undefined,
        industry: (client.industry ?? apiClient.industry ?? undefined) as string | undefined,
        description: (client.description ?? apiClient.description ?? undefined) as string | undefined,
        website: (client.website ?? apiClient.website ?? undefined) as string | undefined,
        primary_contact: (client.primaryContact ?? apiClient.primary_contact ?? undefined) as string | undefined,
        primary_contact_email: (client.primaryContactEmail ?? apiClient.primary_contact_email ?? undefined) as
          | string
          | undefined,
        is_active: (client.isActive ?? apiClient.is_active ?? undefined) as boolean | undefined,
        branding_id: (client.brandingId ?? apiClient.branding_id ?? undefined) as number | undefined,
        created_at: client.createdAt || apiClient.created_at || undefined,
        updated_at: client.updatedAt || apiClient.updated_at || undefined,
        accounts: apiClient.accounts || client.accounts || undefined,
      }
    })
}

export const useClients = (): UseClientsResult => {
  const { data: session } = useSession()
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // If using auth bypass, just fetch all clients directly
      if (bypassAuth) {
        const apiClient = await buildApiClient()
        const { data, error } = await apiClient.GET('/clients')
        const result = { data, error }

        if ('error' in result && result.error) {
          throw new Error(
            `API Error: ${result.error.message || 'Failed to fetch clients'}`
          )
        }

        const apiClients: ApiClient[] = Array.isArray(result.data)
          ? result.data
          : (result.data && typeof result.data === 'object' && 'clients' in result.data && Array.isArray(result.data.clients))
            ? result.data.clients
            : []
        setClients(transformApiClients(apiClients))
        return
      }

      // Only fetch if we have a session (non-bypass mode)
      if (!session?.user?.id) {
        setClients([])
        setLoading(false)
        return
      }

      // For authenticated users, fetch clients they have access to
      // For now, just fetch all clients (can be refined later for user-specific access)
      const apiClient = await buildApiClient()
      const { data, error } = await apiClient.GET('/clients')
      const result = { data, error }

      if ('error' in result && result.error) {
        const errorMsg = `API Error: ${result.error.message || 'Failed to fetch clients'}`
        throw new Error(errorMsg)
      }

      // Transform the API response to match our Client interface
      // The API returns an array directly, not wrapped in a 'clients' property
      const apiClients: ApiClient[] = Array.isArray(result.data)
        ? result.data
        : (result.data && typeof result.data === 'object' && 'clients' in result.data && Array.isArray(result.data.clients))
          ? result.data.clients
          : []
      setClients(transformApiClients(apiClients))
    } catch (err) {
      let errorMessage = 'Failed to fetch clients'

      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }

      // Add helpful context for common issues
      if (errorMessage.includes('fetch')) {
        errorMessage += ' (Is the mock API server running on http://localhost:3001?)'
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [bypassAuth, session?.user?.id])

  const refetch = async () => {
    await fetchClients()
  }

  useEffect(() => {
    void fetchClients()
  }, [fetchClients])

  return {
    clients,
    loading,
    error,
    refetch,
  }
}
