'use client'

import useSWR from 'swr'

import buildApiClient from '@/domain-models/apiClient'

export interface Phase {
  id: string
  meetingId: string
  name: string
  orderIndex: number
  status: 'COMPLETE' | 'ACTIVE' | 'NOT_STARTED'
  keyDates: {
    startDate?: string | null
    endDate?: string | null
    dueDate?: string | null
    completionDate?: string | null
    recordDate?: string | null
    mailingDate?: string | null
    meetingDate?: string | null
    preFilingDate?: string | null
    filingDate?: string | null
    brokerSearchDate?: string | null
  }
  createdAt?: string | null
  updatedAt?: string | null
}

// Removed unused type definitions to fix linter warnings

const asString = (val: unknown): string | null => (typeof val === 'string' ? val : null)
const asNumber = (val: unknown): number | null =>
  typeof val === 'number' && Number.isFinite(val) ? val : null
const asRecord = (val: unknown): Record<string, unknown> | null =>
  typeof val === 'object' && val !== null ? (val as Record<string, unknown>) : null

const getStr = (obj: Record<string, unknown>, keys: string[]): string | null => {
  for (const k of keys) {
    const v = asString(obj[k])
    if (v !== null) return v
  }
  return null
}

const getNum = (obj: Record<string, unknown>, keys: string[]): number | null => {
  for (const k of keys) {
    const v = asNumber(obj[k])
    if (v !== null) return v
  }
  return null
}

const normalizePhase = (raw: unknown): Phase | null => {
  const rec = asRecord(raw)
  if (!rec) return null

  const id = getStr(rec, ['id'])
  const name = getStr(rec, ['name', 'phase_name'])
  if (!id || !name) return null

  const meetingId = getStr(rec, ['meetingId', 'meeting_id']) || ''
  const orderIndex = getNum(rec, ['orderIndex', 'order_index']) ?? 0
  const rawStatus = getStr(rec, ['status']) || ''
  const status: Phase['status'] =
    rawStatus === 'COMPLETE'
      ? 'COMPLETE'
      : rawStatus === 'ACTIVE' || rawStatus === 'IN_PROGRESS'
        ? 'ACTIVE'
        : 'NOT_STARTED'

  const kdRec = (asRecord(rec.keyDates) || asRecord(rec.key_dates) || {})
  const keyDates: Phase['keyDates'] = {
    startDate: getStr(kdRec, ['startDate', 'start_date']),
    endDate: getStr(kdRec, ['endDate', 'end_date']),
    dueDate: getStr(kdRec, ['dueDate', 'due_date']),
    completionDate: getStr(kdRec, ['completionDate', 'completion_date']),
    recordDate: getStr(kdRec, ['recordDate', 'record_date']),
    mailingDate: getStr(kdRec, ['mailingDate', 'mailing_date']),
    meetingDate: getStr(kdRec, ['meetingDate', 'meeting_date']),
    preFilingDate: getStr(kdRec, ['preFilingDate', 'pre_filing_date']),
    filingDate: getStr(kdRec, ['filingDate', 'filing_date']),
    brokerSearchDate: getStr(kdRec, ['brokerSearchDate', 'broker_search_date']),
  }

  const createdAt = getStr(rec, ['createdAt', 'created_at'])
  const updatedAt = getStr(rec, ['updatedAt', 'updated_at'])

  return {
    id,
    meetingId,
    name,
    orderIndex,
    status,
    keyDates,
    createdAt: createdAt ?? null,
    updatedAt: updatedAt ?? null,
  }
}

const fetchPhases = async (meetingId: string): Promise<Phase[]> => {
  const apiClient = await buildApiClient()
  const { data, error } = await apiClient.GET('/meetings/{meetingId}/phases', {
    params: { path: { meetingId } },
  })
  if (error) throw new Error('Failed to fetch phases')

  const items: unknown[] = Array.isArray(data) ? (data as unknown[]) : []
  const normalized: Phase[] = []
  for (const item of items) {
    const n = normalizePhase(item)
    if (n) normalized.push(n)
  }
  return normalized
}

export interface UsePhasesResult {
  phases: Phase[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export const usePhases = (meetingId?: string): UsePhasesResult => {
  // Use SWR to cache the phases data and prevent duplicate fetches
  const { data, error, isLoading, mutate } = useSWR(
    meetingId ? `/meetings/${meetingId}/phases` : null,
    () => fetchPhases(meetingId!),
    {
      // Cache for 5 minutes - phases don't change frequently
      refreshInterval: 300000,
      // Revalidate on focus
      revalidateOnFocus: false,
      // Don't revalidate on mount if data exists
      revalidateOnMount: false,
      // Keep previous data while revalidating
      keepPreviousData: true,
      // Dedupe multiple requests in 10 second window
      dedupingInterval: 10000,
    }
  )

  return {
    phases: data || [],
    loading: isLoading,
    error: error ? error.message : null,
    refetch: () => mutate(),
  }
}
