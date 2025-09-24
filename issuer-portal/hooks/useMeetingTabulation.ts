'use client'

import { useCallback, useEffect, useState } from 'react'

import buildApiClient from '@/domain-models/apiClient'

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

      const meeting = meetingResult.data as {
        title?: string
        meetingTitle?: string
        date?: string
        meetingDate?: string
        status?: string
      }
      if (!meeting) {
        throw new Error('Meeting not found')
      }

      // Fetch positions to calculate tabulation
      const positionsResult = await apiClient.GET('/positions', {
        params: { query: { meetingId } },
      })
      // Handle different possible response formats
      const responseData = positionsResult.data
      const positions = (Array.isArray(responseData)
        ? responseData
        : ((responseData as unknown as { positions?: any[] })?.positions ?? [])) as Array<{
        voteStatus?: string
        shares?: number
        votingSource?: string
      }>

      // Calculate tabulation summary from positions
      const totalPositions = positions.length
      const positionsVoted = positions.filter((p) => p.voteStatus === 'Voted').length
      const totalShares = positions.reduce((sum, p) => sum + (p.shares || 0), 0)
      const sharesVoted = positions
        .filter((p) => p.voteStatus === 'Voted')
        .reduce((sum, p) => sum + (p.shares || 0), 0)

      const votePercentage =
        totalShares > 0 ? ((sharesVoted / totalShares) * 100).toFixed(2) : '0.00'

      // Count voting methods
      const webVotes = positions.filter((p) => p.votingSource === 'WEB').length
      const paperVotes = positions.filter((p) => p.votingSource === 'PAPER').length
      const phoneVotes = positions.filter((p) => p.votingSource === 'PHONE').length

      const tabulationData: TabulationData = {
        meeting_id: meetingId,
        meeting_title: meeting.title || meeting.meetingTitle || 'Meeting',
        meeting_date: meeting.date || meeting.meetingDate || '',
        total_positions: totalPositions,
        positions_voted: positionsVoted,
        total_shares: totalShares.toString(),
        shares_voted: sharesVoted.toString(),
        vote_percentage: votePercentage,
        web_votes: webVotes,
        paper_votes: paperVotes,
        phone_votes: phoneVotes,
        status: meeting.status || 'active',
      }

      setData(tabulationData)

      // For active meetings, try to get phase dates
      if (meeting.status !== 'completed') {
        // Fetch phases to find upcoming dates
        const phasesResult = await apiClient.GET('/meetings/{meetingId}/phases', {
          params: { path: { meetingId } },
        })
        const phases = (phasesResult.data || []) as Array<{ targetDate?: string }>

        // Find the next phase date
        const today = new Date().toISOString().split('T')[0]
        const upcomingPhases = phases
          .filter((p) => p.targetDate && p.targetDate > today)
          .sort((a, b) => (a.targetDate || '').localeCompare(b.targetDate || ''))

        if (upcomingPhases.length > 0) {
          setNextPhaseDate(upcomingPhases[0].targetDate || null)
        }

        // Set vote cutoff as meeting date
        if (meeting.date || meeting.meetingDate) {
          setVoteCutoffDate(meeting.date || meeting.meetingDate || null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tabulation data')
    } finally {
      setLoading(false)
    }
  }, [meetingId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    nextPhaseDate,
    voteCutoffDate,
    loading,
    error,
    refetch: fetchData,
  }
}
