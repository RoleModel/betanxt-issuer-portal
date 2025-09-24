'use client'

import useSWR from 'swr'

import buildApiClient from '@/domain-models/apiClient'

import type { Meeting } from '@/types/api'
import type { ProposalVoting, VotingSummary } from '@/types/phases'

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

export interface MeetingData {
  phases: Phase[]
  proposals: ProposalVoting[]
  votingSummary: VotingSummary | null
  meeting?: Meeting
}

export interface UseMeetingDataResult {
  data: MeetingData
  loading: boolean
  error: string | null
  refetch: () => void
}

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

  const kdRec = (asRecord(rec['keyDates']) || asRecord(rec['key_dates']) || {}) as Record<
    string,
    unknown
  >
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

const fetchMeetingData = async (meetingId: string): Promise<MeetingData> => {
  try {
    const apiClient = await buildApiClient()

    // Fetch all data in parallel
    const [phasesResult, proposalsResult, positionsResult] = await Promise.all([
      apiClient.GET('/meetings/{meetingId}/phases', {
        params: { path: { meetingId } },
      }),
      apiClient.GET('/meetings/{meetingId}/proposals', {
        params: { path: { meetingId } },
      }),
      apiClient.GET('/positions', {
        params: { query: { meetingId } },
      }),
    ])

    // Process phases
    const phases: Phase[] = []
    if (!phasesResult.error && phasesResult.data) {
      const items: unknown[] = Array.isArray(phasesResult.data)
        ? (phasesResult.data as unknown[])
        : []
      for (const item of items) {
        const normalized = normalizePhase(item)
        if (normalized) phases.push(normalized)
      }
    }

    // Process proposals and voting data
    let proposals: ProposalVoting[] = []
    let votingSummary: VotingSummary | null = null

    if (!proposalsResult.error && proposalsResult.data) {
      const proposalsData = proposalsResult.data || []
      const positions = positionsResult.data || []

      // Calculate voting summary
      const totalPositions = positions.length
      const positionsVoted = positions.filter((p: any) => p.voteStatus === 'Voted').length
      const totalShares = positions.reduce(
        (sum: number, p: any) => sum + (p.shares || 0),
        0
      )
      const sharesVoted = positions
        .filter((p: any) => p.voteStatus === 'Voted')
        .reduce((sum: number, p: any) => sum + (p.shares || 0), 0)

      const percentageVoted = totalShares > 0 ? (sharesVoted / totalShares) * 100 : 0

      // Count voting methods
      const webVotes = positions.filter((p: any) => p.votingSource === 'WEB').length
      const paperVotes = positions.filter((p: any) => p.votingSource === 'PAPER').length
      const phoneVotes = positions.filter((p: any) => p.votingSource === 'PHONE').length

      votingSummary = {
        totalSharesVoted: sharesVoted,
        totalSharesOutstanding: totalShares,
        percentageVoted: Math.round(percentageVoted),
        positionsVoted,
        totalPositions,
        lastUpdated: new Date().toISOString(),
        votingMethods: {
          web: webVotes,
          paper: paperVotes,
          phone: phoneVotes,
        },
        votingBreakdown: {
          for: { shares: 0, percentage: 0 },
          against: { shares: 0, percentage: 0 },
          abstain: { shares: 0, percentage: 0 },
          withhold: { shares: 0, percentage: 0 },
        },
      }

      // Transform proposals data for voting display
      proposals = proposalsData.map((proposal: any) => {
        // Mock voting results - in real implementation, fetch from voting endpoints
        const mockVotingResults = {
          for: { shares: Math.floor(Math.random() * sharesVoted * 0.7), percentage: 0 },
          against: {
            shares: Math.floor(Math.random() * sharesVoted * 0.2),
            percentage: 0,
          },
          abstain: {
            shares: Math.floor(Math.random() * sharesVoted * 0.1),
            percentage: 0,
          },
        }

        const totalVoted =
          mockVotingResults.for.shares +
          mockVotingResults.against.shares +
          mockVotingResults.abstain.shares

        if (totalVoted > 0) {
          mockVotingResults.for.percentage =
            (mockVotingResults.for.shares / totalVoted) * 100
          mockVotingResults.against.percentage =
            (mockVotingResults.against.shares / totalVoted) * 100
          mockVotingResults.abstain.percentage =
            (mockVotingResults.abstain.shares / totalVoted) * 100
        }

        return {
          proposalId: proposal.id || '',
          proposalNumber: proposal.proposalNumber || proposal.proposal_number || '',
          description:
            proposal.proposalTitle ||
            proposal.proposal_title ||
            proposal.description ||
            proposal.title ||
            '',
          directorName: proposal.directorName || proposal.director_name || undefined,
          votingResults: mockVotingResults,
          totalShares: totalVoted,
          status: 'active' as const,
        }
      })
    }

    return {
      phases,
      proposals,
      votingSummary,
    }
  } catch (error) {
    throw error
  }
}

export const useMeetingData = (
  meetingId?: string,
  meeting?: Meeting
): UseMeetingDataResult => {

  const swrKey = meetingId ? `/meeting-data/${meetingId}` : null

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () => {
      return fetchMeetingData(meetingId!)
    },
    {
      // Disable all caching for debugging
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateOnReconnect: false,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      refreshInterval: 0,
      dedupingInterval: 0,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  )


  return {
    data: data
      ? { ...data, meeting }
      : { phases: [], proposals: [], votingSummary: null, meeting },
    loading: isLoading,
    error: error ? error.message : null,
    refetch: () => mutate(),
  }
}
