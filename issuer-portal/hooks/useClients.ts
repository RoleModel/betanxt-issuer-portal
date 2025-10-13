'use client'

import { useSession } from 'next-auth/react'
import useSWR from 'swr'

import buildApiClient from '@/domain-models/apiClient'

import { clientsSWRConfig } from '@/lib/swr-config'
import { asArray, asRecord, asString } from '@/utils/typeUtils'

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
  phase?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 // Event phase for routing logic
  meeting_id?: string // Default meeting ID for the client
  // Added: accounts returned by /clients API (used for filtering meetings by accountId)
  accounts?: {
    id: string
    name?: string
    primary_contact?: string
  }[]
}

export interface UseClientsResult {
  clients: Client[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const pickNumber = (
  source: Record<string, unknown>,
  keys: string[]
): number | undefined => {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

const normalizeClient = (raw: unknown): Client | null => {
  const record = asRecord(raw)
  if (!record) return null

  const id = asString(record.id)
  const ticker = asString(record.ticker)
  const companyName =
    asString(record.companyName) ??
    asString(record.company_name) ??
    asString(record.shortName) ??
    asString(record.short_name)

  if (!id || !ticker || !companyName) {
    return null
  }

  const accountsRaw = record.accounts
  const accounts = Array.isArray(accountsRaw)
    ? accountsRaw
      .map((account) => asRecord(account))
      .filter((account): account is Record<string, unknown> => Boolean(account))
      .map((account) => ({
        id: asString(account.id) ?? '',
        name: asString(account.name) ?? undefined,
        primary_contact: asString(account.primary_contact) ?? undefined,
      }))
      .filter((account) => account.id)
    : undefined

  const phaseValue = pickNumber(record, ['phase']) ?? 2
  const phase = (phaseValue >= 1 && phaseValue <= 8 ? phaseValue : 2) as
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8

  return {
    id,
    name: companyName,
    ticker,
    company_name: companyName,
    short_name: asString(record.shortName) ?? asString(record.short_name) ?? companyName,
    industry: asString(record.industry) ?? undefined,
    description: asString(record.description) ?? undefined,
    website: asString(record.website) ?? undefined,
    primary_contact:
      asString(record.primaryContact) ?? asString(record.primary_contact) ?? undefined,
    primary_contact_email:
      asString(record.primaryContactEmail) ??
      asString(record.primary_contact_email) ??
      undefined,
    is_active:
      typeof record.isActive === 'boolean'
        ? record.isActive
        : typeof record.is_active === 'boolean'
          ? record.is_active
          : undefined,
    branding_id: pickNumber(record, ['brandingId', 'branding_id']),
    created_at: asString(record.createdAt) ?? asString(record.created_at) ?? undefined,
    updated_at: asString(record.updatedAt) ?? asString(record.updated_at) ?? undefined,
    phase,
    meeting_id: asString(record.meetingId) ?? asString(record.meeting_id) ?? undefined,
    accounts,
  }
}

export const transformApiClients = (apiClients: unknown[]): Client[] => {
  return apiClients.reduce<Client[]>((acc, rawClient) => {
    const client = normalizeClient(rawClient)
    if (client) {
      acc.push(client)
    }
    return acc
  }, [])
}

const extractClientPayload = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload
  }

  const record = asRecord(payload)
  if (!record) {
    return []
  }

  return asArray(record.clients)
}

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!err) return fallback
  if (typeof err === 'string') return err
  if (typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }
  return fallback
}

export const useClients = (): UseClientsResult => {
  const { data: session } = useSession()
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  // Custom fetcher for clients
  const clientsFetcher = async () => {
    // Only fetch if we have a session (non-bypass mode) or bypass is enabled
    if (!bypassAuth && !session) {
      return []
    }

    const apiClient = await buildApiClient()
    const { data, error} = await apiClient.GET('/clients')

    if (error) {
      throw new Error(
        `API Error: ${getApiErrorMessage(error, 'Failed to fetch clients')}`
      )
    }

    // Transform the API response to match our Client interface
    const apiClients = extractClientPayload(data)
    return transformApiClients(apiClients)
  }

  // Use SWR for data fetching with deduplication
  const { data, error, isLoading, mutate } = useSWR(
    // Key includes session info to refetch when user changes
    session || bypassAuth ? ['/clients', session?.user?.id, bypassAuth] : null,
    clientsFetcher,
    clientsSWRConfig
  )

  // Transform error for consistent interface
  let errorMessage: string | null = null
  if (error) {
    errorMessage = error instanceof Error ? error.message : 'Failed to fetch clients'
    // Add helpful context for common issues
    if (errorMessage.includes('fetch')) {
      errorMessage += ' (The server is restarting)'
    }
  }

  return {
    clients: data || [],
    loading: isLoading,
    error: errorMessage,
    refetch: async () => {
      await mutate()
    },
  }
}
