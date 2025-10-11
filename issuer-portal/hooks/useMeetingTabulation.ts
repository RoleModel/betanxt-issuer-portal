'use client'

import { useCallback, useEffect, useState } from 'react'

import buildApiClient from '@/domain-models/apiClient'

import { asArray, asRecord, asString } from '@/utils/typeUtils'

// Type for normalized position with guaranteed fields
interface NormalizedPosition {
  id: string
  voteStatus: string
  shares: number
  sharesVoted: number
  votingSource?: string
}

// Normalize position data to ensure consistent fields
function normalizePosition(position: unknown): NormalizedPosition | null {
  if (!position) return null

  const record = asRecord(position)
  if (!record) return null

  return {
    id: asString(record.id) || '',
    voteStatus: asString(record.voteStatus) || asString(record.vote_status) || 'UNVOTED',
    shares: Number(record.shares) || 0,
    sharesVoted: Number(record.sharesVoted) || Number(record.shares_voted) || 0,
    votingSource:
      asString(record.votingSource) ||
      asString(record.voting_source) ||
      asString(record.source) ||
      undefined,
  }
}

export interface TabulationData {
  meeting_id: string
  meeting_title: string
  meeting_date: string
  total_positions: number
  positions_voted: number
  total_shares: string
  shares_voted: string
  vote_percentage: string
  web_votes: number
  paper_votes: number
  phone_votes: number
  status: string
}

export interface UseMeetingTabulationResult {
  data: TabulationData | null
  nextPhaseDate: string | null
  voteCutoffDate: string | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useMeetingTabulation = (meetingId?: string): UseMeetingTabulationResult => {
  const [data, setData] = useState<TabulationData | null>(null)
  const [nextPhaseDate, setNextPhaseDate] = useState<string | null>(null)
  const [voteCutoffDate, setVoteCutoffDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!meetingId) return

    setLoading(true)
    setError(null)

    try {
      const apiClient = await buildApiClient()

      // Fetch meeting details
      const meetingResult = await apiClient.GET('/meetings/{meetingId}', {
        params: { path: { meetingId } },
      })
      if (meetingResult.error) {
        throw new Error('Failed to fetch meeting')
      }

      const meetingRecord = asRecord(meetingResult.data)
      if (!meetingRecord) {
        throw new Error('Meeting not found')
      }

      const meetingTitle =
        asString(meetingRecord.title) ?? asString(meetingRecord.meetingTitle) ?? 'Meeting'
      const meetingDate =
        asString(meetingRecord.date) ?? asString(meetingRecord.meetingDate) ?? ''
      const meetingStatus = asString(meetingRecord.status) ?? 'active'

      // Fetch positions to calculate tabulation
      const positionsResult = await apiClient.GET('/positions', {
        params: { query: { meetingId } },
      })
      const positionsRaw = Array.isArray(positionsResult.data)
        ? positionsResult.data
        : asArray(asRecord(positionsResult.data)?.positions)
      const positions = positionsRaw
        .map((position) => normalizePosition(position))
        .filter((position): position is NormalizedPosition => position !== null)

      // Calculate tabulation summary from positions
      const totalPositions = positions.length
      const positionsVoted = positions.filter((p) => p.voteStatus === 'VOTED').length
      const totalShares = positions.reduce((sum, p) => sum + p.shares, 0)
      const sharesVoted = positions
        .filter((p) => p.voteStatus === 'VOTED')
        .reduce((sum, p) => sum + p.sharesVoted, 0)

      const votePercentage =
        totalShares > 0 ? ((sharesVoted / totalShares) * 100).toFixed(2) : '0.00'

      // Count voting methods
      const webVotes = positions.filter((p) => p.votingSource === 'WEB').length
      const paperVotes = positions.filter((p) => p.votingSource === 'PRINT').length
      const phoneVotes = positions.filter((p) => p.votingSource === 'IVR').length

      const tabulationData: TabulationData = {
        meeting_id: meetingId,
        meeting_title: meetingTitle,
        meeting_date: meetingDate,
        total_positions: totalPositions,
        positions_voted: positionsVoted,
        total_shares: totalShares.toString(),
        shares_voted: sharesVoted.toString(),
        vote_percentage: votePercentage,
        web_votes: webVotes,
        paper_votes: paperVotes,
        phone_votes: phoneVotes,
        status: meetingStatus,
      }

      setData(tabulationData)

      // For active meetings, try to get phase dates
      if (meetingStatus.toLowerCase() !== 'completed') {
        // Fetch phases to find upcoming dates
        const phasesResult = await apiClient.GET('/meetings/{meetingId}/phases', {
          params: { path: { meetingId } },
        })
        const phases = asArray(
          asRecord(phasesResult.data)?.phases ?? phasesResult.data
        ).map((phase) => asRecord(phase))

        // Find the next phase date
        const today = new Date().toISOString().split('T')[0]
        const upcomingPhases = phases
          .filter((phase): phase is Record<string, unknown> => Boolean(phase))
          .map((phase) => ({
            targetDate: asString(phase.targetDate) ?? asString(phase.target_date) ?? null,
          }))
          .filter((phase) => phase.targetDate && phase.targetDate > today)
          .sort((a, b) => (a.targetDate ?? '').localeCompare(b.targetDate ?? ''))

        if (upcomingPhases.length > 0) {
          setNextPhaseDate(upcomingPhases[0].targetDate || null)
        }

        // Set vote cutoff as meeting date
        if (meetingDate) {
          setVoteCutoffDate(meetingDate)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tabulation data')
    } finally {
      setLoading(false)
    }
  }, [meetingId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return {
    data,
    nextPhaseDate,
    voteCutoffDate,
    loading,
    error,
    refetch: () => void fetchData(),
  }
}
