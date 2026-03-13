'use client'

import useSWR from 'swr'

import buildApiClient from '@/domain-models/apiClient'

import type { Meeting } from '@/types/api-exports'
import type { ProposalVoting, VotingSummary } from '@/types/phases'
import { asArray, asRecord, asString } from '@/utils/typeUtils'

// Type for normalized position with guaranteed fields
export interface NormalizedPosition {
  id: string
  voteStatus: string
  shares: number
  sharesVoted: number
  votingSource?: string
}

// Type for normalized proposal
export interface NormalizedProposal {
  id: string
  proposalNumber: string
  proposalType: string
  recommendation?: string
  directorName?: string
}

// Normalize position data to ensure consistent fields
function normalizePosition(position: unknown): NormalizedPosition | null {
  if (!position) return null

  const record = asRecord(position)
  if (!record) return null

  return {
    id: asString(record.id) || '',
    voteStatus: asString(record.voteStatus) || asString(record.vote_status) || 'unvoted',
    shares: Number(record.shares) || 0,
    sharesVoted: Number(record.sharesVoted) || Number(record.shares_voted) || 0,
    votingSource:
      asString(record.votingSource) ||
      asString(record.voting_source) ||
      asString(record.source) ||
      undefined,
  }
}

// Normalize proposal data to ensure consistent fields
function normalizeProposal(proposal: unknown): NormalizedProposal | null {
  if (!proposal) return null

  const record = asRecord(proposal)
  if (!record) return null

  return {
    id: asString(record.id) || '',
    proposalNumber:
      asString(record.proposalNumber) || asString(record.proposal_number) || '',
    proposalType: asString(record.proposalType) || asString(record.proposal_type) || '',
    recommendation: asString(record.recommendation) || undefined,
    directorName:
      asString(record.directorName) || asString(record.director_name) || undefined,
  }
}

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

const pickString = (obj: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = asString(obj[key])
    if (value !== null && value !== undefined) return value
    const nestedValue = obj[key]
    if (typeof nestedValue === 'string') return nestedValue
  }
  return undefined
}

const pickNumber = (obj: Record<string, unknown>, keys: string[]): number | undefined => {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

const normalizePhase = (raw: unknown): Phase | null => {
  const rec = asRecord(raw)
  if (!rec) return null

  const id = pickString(rec, ['id'])
  const name = pickString(rec, ['name', 'phase_name'])
  if (!id || !name) return null

  const meetingId = pickString(rec, ['meetingId', 'meeting_id']) ?? ''
  const orderIndex = pickNumber(rec, ['orderIndex', 'order_index']) ?? 0
  const rawStatus = pickString(rec, ['status']) ?? ''
  const status: Phase['status'] =
    rawStatus === 'COMPLETE'
      ? 'COMPLETE'
      : rawStatus === 'ACTIVE' || rawStatus === 'IN_PROGRESS'
        ? 'ACTIVE'
        : 'NOT_STARTED'

  const kdRec =
    asRecord(rec.keyDates) || asRecord(rec.key_dates) || ({} as Record<string, unknown>)
  const keyDates: Phase['keyDates'] = {
    startDate: pickString(kdRec, ['startDate', 'start_date']) ?? null,
    endDate: pickString(kdRec, ['endDate', 'end_date']) ?? null,
    dueDate: pickString(kdRec, ['dueDate', 'due_date']) ?? null,
    completionDate: pickString(kdRec, ['completionDate', 'completion_date']) ?? null,
    recordDate: pickString(kdRec, ['recordDate', 'record_date']) ?? null,
    mailingDate: pickString(kdRec, ['mailingDate', 'mailing_date']) ?? null,
    meetingDate: pickString(kdRec, ['meetingDate', 'meeting_date']) ?? null,
    preFilingDate: pickString(kdRec, ['preFilingDate', 'pre_filing_date']) ?? null,
    filingDate: pickString(kdRec, ['filingDate', 'filing_date']) ?? null,
    brokerSearchDate:
      pickString(kdRec, ['brokerSearchDate', 'broker_search_date']) ?? null,
  }

  const createdAt = pickString(rec, ['createdAt', 'created_at']) ?? null
  const updatedAt = pickString(rec, ['updatedAt', 'updated_at']) ?? null

  return {
    id,
    meetingId,
    name,
    orderIndex,
    status,
    keyDates,
    createdAt,
    updatedAt,
  }
}

const fetchMeetingData = async (meetingId: string): Promise<MeetingData> => {
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
  const { data: phasesData, error: phasesError } = phasesResult
  if (!phasesError && phasesData) {
    const items: unknown[] = Array.isArray(phasesData) ? (phasesData as unknown[]) : []
    for (const item of items) {
      const normalized = normalizePhase(item)
      if (normalized) phases.push(normalized)
    }
  }

  // Process proposals and voting data
  let proposals: ProposalVoting[] = []
  let votingSummary: VotingSummary | null = null

  const { data: proposalsData, error: proposalsError } = proposalsResult
  const { data: positionsData, error: _positionsError } = positionsResult

  if (!proposalsError && proposalsData) {
    const proposalsPayload = proposalsData
    const proposalsRaw = Array.isArray(proposalsPayload)
      ? proposalsPayload
      : asArray(asRecord(proposalsPayload)?.proposals)

    const positionsRaw = Array.isArray(positionsData)
      ? positionsData
      : asArray(asRecord(positionsData)?.positions)
    const positions = positionsRaw
      .map((position) => normalizePosition(position))
      .filter((position): position is NormalizedPosition => position !== null)

    // Calculate voting summary
    const totalPositions = positions.length
    const positionsVoted = positions.filter(
      (position) => position.voteStatus === 'VOTED'
    ).length
    const totalShares = positions.reduce((sum, position) => sum + position.shares, 0)
    const sharesVoted = positions
      .filter((position) => position.voteStatus === 'VOTED')
      .reduce((sum, position) => sum + position.sharesVoted, 0)

    const percentageVoted = totalShares > 0 ? (sharesVoted / totalShares) * 100 : 0

    // Count voting methods
    const webVotes = positions.filter(
      (position) => position.votingSource === 'WEB'
    ).length
    const paperVotes = positions.filter(
      (position) => position.votingSource === 'PRINT'
    ).length
    const phoneVotes = positions.filter(
      (position) => position.votingSource === 'IVR'
    ).length

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
    proposals = proposalsRaw
      .map((proposal) => normalizeProposal(proposal))
      .filter((proposal): proposal is NormalizedProposal => proposal !== null)
      .map((proposal) => {
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
          proposalId: proposal.id,
          proposalNumber: parseInt(proposal.proposalNumber, 10) || 0,
          description: proposal.proposalType,
          directorName: proposal.directorName,
          recommendation: proposal.recommendation,
          votingResults: mockVotingResults,
          voteCounts: {
            for: mockVotingResults.for.shares > 0 ? 1 : 0,
            against: mockVotingResults.against.shares > 0 ? 1 : 0,
            abstain: mockVotingResults.abstain.shares > 0 ? 1 : 0,
            total:
              (mockVotingResults.for.shares > 0 ? 1 : 0) +
              (mockVotingResults.against.shares > 0 ? 1 : 0) +
              (mockVotingResults.abstain.shares > 0 ? 1 : 0),
          },
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
    refetch: () => void mutate(),
  }
}
