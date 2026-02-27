'use client'

import { useMemo } from 'react'

import { useSession } from 'next-auth/react'
import useSWR from 'swr'

import buildApiClient from '@/domain-models/apiClient'

import { clientsSWRConfig } from '@/lib/swr-config'
import type { EventRow } from '@/utils/eventData'
import { asRecord, asString } from '@/utils/typeUtils'
import { getBrandConfigByTicker } from '@/utils/brandConfig'

function extractClientCompanyName(client: unknown): string | null {
  const record = asRecord(client)
  if (!record) return null
  // Supabase join returns snake_case; handle both forms
  return (
    asString(record.companyName) ??
    asString(record.company_name) ??
    asString(record.shortName) ??
    asString(record.short_name) ??
    null
  )
}

function meetingToEventRow(meeting: Record<string, unknown>): EventRow | null {
  const id = asString(meeting.id)
  const ticker = asString(meeting.ticker)
  const meetingDate = asString(meeting.meetingDate)
  const meetingType = asString(meeting.meetingType)
  const status = asString(meeting.status)
  const cusip = asString(meeting.cusip) ?? ''

  if (!id || !ticker || !meetingDate || !meetingType) return null

  // Prefer joined client object → brand config lookup → ticker as last resort
  const companyName =
    extractClientCompanyName(meeting.client) ??
    getBrandConfigByTicker(ticker)?.companyName ??
    ticker

  const eventDate = new Date(meetingDate).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })

  const isAnnual = meetingType.toLowerCase().includes('annual')
  const eventType: 'Annual Meeting' | 'Special Meeting' = isAnnual
    ? 'Annual Meeting'
    : 'Special Meeting'

  const meetingStatus: 'ACTIVE' | 'COMPLETE' =
    status === 'ACTIVE' ? 'ACTIVE' : 'COMPLETE'

  return {
    id,
    event: companyName,
    cusip,
    eventDate,
    eventType,
    meetingId: id,
    clientTicker: ticker,
    meetingStatus,
  }
}

interface UseEventsResult {
  events: EventRow[]
  loading: boolean
  error: string | null
}

export function useEvents(): UseEventsResult {
  const { data: session } = useSession()
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  // Tickers this user is allowed to see (PARENT_CLIENT / SOLICITOR users have an explicit allow-list)
  const allowedTickers = session?.user?.clientTickers

  const eventsFetcher = async (): Promise<EventRow[]> => {
    if (!bypassAuth && !session) return []

    const api = await buildApiClient()
    const allEvents: EventRow[] = []
    let page = 1

    while (true) {
      const { data, error } = await api.GET('/meetings', {
        params: { query: { page, limit: 100 } },
      })

      if (error || !data) break

      const dataRecord = asRecord(data)
      if (!dataRecord) break

      const meetings = Array.isArray(dataRecord.meetings) ? dataRecord.meetings : []

      for (const meeting of meetings) {
        const record = asRecord(meeting)
        if (!record) continue
        const row = meetingToEventRow(record)
        if (!row) continue
        allEvents.push(row)
      }

      const paginationRecord = asRecord(dataRecord.pagination)
      const totalCount = typeof paginationRecord?.total === 'number' ? paginationRecord.total : 0

      if (meetings.length < 100 || allEvents.length >= totalCount) break
      page++
    }

    return allEvents
  }

  const { data: rawData, error, isLoading } = useSWR(
    session || bypassAuth ? ['/events-list', session?.user?.id] : null,
    eventsFetcher,
    {
      ...clientsSWRConfig,
      dedupingInterval: 120000,
    }
  )

  // Filter is applied outside the fetcher so it is always reactive to the current session.
  // This prevents stale cached data (fetched before clientTickers was hydrated) from leaking
  // through to restricted users.
  const events = useMemo(() => {
    if (!rawData) return []
    if (!allowedTickers) return rawData
    return rawData.filter((row) => allowedTickers.includes(row.clientTicker))
  }, [rawData, allowedTickers])

  return {
    events,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
