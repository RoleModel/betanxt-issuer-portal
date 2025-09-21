'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'

import { listClients } from '@/domain-models/api/clients'
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

type ApiClient = components['schemas']['Client']

export const transformApiClients = (apiClients: ApiClient[]): Client[] => {
  return apiClients
    .filter(
      (client) => client.id && client.ticker && (client.companyName || client.shortName)
    )
    .map((client) => ({
      id: client.id as string,
      name: (client.companyName || client.shortName) as string,
      ticker: client.ticker as string,
      company_name: client.companyName || undefined,
      short_name: client.shortName || undefined,
      industry: (client.industry ?? undefined) as string | undefined,
      description: (client.description ?? undefined) as string | undefined,
      website: (client.website ?? undefined) as string | undefined,
      primary_contact: (client.primaryContact ?? undefined) as string | undefined,
      primary_contact_email: (client.primaryContactEmail ?? undefined) as
        | string
        | undefined,
      is_active: client.isActive as boolean | undefined,
      created_at: client.createdAt || undefined,
      updated_at: client.updatedAt || undefined,
    }))
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
        const result = await listClients()

        if ('error' in result && result.error) {
          throw new Error(
            `API Error: ${result.error.message || 'Failed to fetch clients'}`
          )
        }

        const apiClients: ApiClient[] = result.data?.clients ?? []
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
      const result = await listClients()

      if ('error' in result && result.error) {
        const errorMsg = `API Error: ${result.error.message || 'Failed to fetch clients'}`
        throw new Error(errorMsg)
      }

      // Transform the API response to match our Client interface
      const apiClients: ApiClient[] = result.data?.clients ?? []
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
