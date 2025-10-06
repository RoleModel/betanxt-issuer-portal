'use client'

import React, { useCallback, useEffect, useState } from 'react'

import buildApiClient, { type ApiClientReturnType } from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { useClient } from '@/contexts/ClientContext'
import { asRecord, asString } from '@/utils/typeUtils'

import PastMeetingsTable, { type PastMeetingData } from './PastMeetingsTable'

interface PastMeetingsCardProps {
  maxHeight?: number | string
  limit?: number
}

type Meeting = components['schemas']['Meeting']

const DEFAULT_METRICS = {
  participationPercent: 0,
  totalVotes: 0,
  votingShares: 0,
}

const parseNumericValue = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const getVoteStatus = (position: components['schemas']['Position']): string => {
  if (position.voteStatus) {
    return position.voteStatus
  }

  const record = asRecord(position as unknown)
  if (!record) return ''

  return asString(record.vote_status) ?? asString(record.status) ?? ''
}

const isPositionVoted = (position: components['schemas']['Position']): boolean => {
  const status = getVoteStatus(position).toLowerCase()
  return status === 'voted'
}

const computeParticipationMetrics = (
  meeting: Meeting,
  positions: components['schemas']['Position'][]
) => {
  if (positions.length === 0) {
    return { ...DEFAULT_METRICS }
  }

  const totalSharesOutstanding = parseNumericValue(meeting.totalSharesOutstanding)
  const totalSharesFromPositions = positions.reduce(
    (sum, position) => sum + parseNumericValue(position.shares),
    0
  )

  const totalShares =
    totalSharesOutstanding > 0 ? totalSharesOutstanding : totalSharesFromPositions

  const votedShares = positions.reduce((sum, position) => {
    if (!isPositionVoted(position)) return sum
    const sharesValue =
      position.sharesVoted ??
      (asRecord(position as unknown)?.shares_voted) ??
      position.shares ??
      0
    return sum + parseNumericValue(sharesValue)
  }, 0)

  const totalVotes = positions.reduce(
    (count, position) => (isPositionVoted(position) ? count + 1 : count),
    0
  )

  const participationPercent =
    totalShares > 0 ? Math.round((votedShares / totalShares) * 100 * 10) / 10 : 0

  return {
    participationPercent,
    totalVotes,
    votingShares: votedShares,
  }
}

export default function PastMeetingsCard({
  maxHeight = 400,
  limit = 6,
}: PastMeetingsCardProps) {
  const { currentClient } = useClient()
  const clientTicker = currentClient?.ticker || ''

  const [meetings, setMeetings] = useState<PastMeetingData[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const dateParts = dateString.split('-')
      if (dateParts.length !== 3) return 'Invalid Date'
      const [year, month, day] = dateParts.map((part) => parseInt(part))
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      console.warn('Error parsing date:', dateString, error)
      return 'Invalid Date'
    }
  }

  const fetchData = useCallback(async () => {
    if (!clientTicker) return

    try {
      setLoading(true)
      setError(null)

      const apiClient = await buildApiClient()
      const meetingsResponse = (await apiClient.GET('/meetings', {
        params: {
          query: {
            ticker: clientTicker.toUpperCase(),
            status: 'COMPLETE',
          },
        },
      })) as ApiClientReturnType<unknown>

      if (meetingsResponse.error) {
        throw new Error(meetingsResponse.error.message || 'Failed to load meetings')
      }

      interface MeetingsApiResponse {
        meetings?: Meeting[]
        pagination?: components['schemas']['Pagination']
      }
      const typedData = meetingsResponse.data as MeetingsApiResponse | undefined
      const completedMeetings: Meeting[] = Array.isArray(typedData?.meetings)
        ? typedData.meetings.slice(0, limit)
        : []

      const meetingsWithParticipation: PastMeetingData[] = await Promise.all(
        completedMeetings.map(async (meeting: Meeting): Promise<PastMeetingData> => {
          const meetingId = meeting.id
          if (!meetingId) {
            return {
              ...meeting,
              ...DEFAULT_METRICS,
            }
          }

          try {
            // Try tabulation report first
            const tabulationResult = (await apiClient.GET(
              '/meetings/{meetingId}/tabulation-report',
              {
                params: { path: { meetingId } },
              }
            )) as ApiClientReturnType<unknown>

            if (!tabulationResult.error) {
              interface TabulationReport {
                positionsVoted?: {
                  totalShares?: number
                  votedShares?: number
                  voted?: number
                }
              }
              const report = tabulationResult.data as TabulationReport
              const positionsVoted = report?.positionsVoted

              if (positionsVoted) {
                const participationPercent =
                  positionsVoted.totalShares && positionsVoted.totalShares > 0
                    ? Math.round(
                        (parseNumericValue(positionsVoted.votedShares) /
                          parseNumericValue(positionsVoted.totalShares)) *
                          100 *
                          10
                      ) / 10
                    : 0

                return {
                  ...meeting,
                  participationPercent,
                  totalVotes: parseNumericValue(positionsVoted.voted),
                  votingShares: parseNumericValue(positionsVoted.votedShares),
                }
              }
            }

            // Fallback to positions
            const positionsResult = (await apiClient.GET('/positions', {
              params: { query: { meetingId, limit: 100000 } },
            })) as ApiClientReturnType<unknown>

            if (positionsResult.error) {
              return {
                ...meeting,
                ...DEFAULT_METRICS,
              }
            }

            const positionsData = positionsResult.data as
              | { positions?: components['schemas']['Position'][] }
              | undefined
            const positions = positionsData?.positions || []
            const metrics = computeParticipationMetrics(meeting, positions)

            return {
              ...meeting,
              ...metrics,
            }
          } catch (posError) {
            console.error(`Error fetching data for meeting ${meetingId}:`, posError)
            return {
              ...meeting,
              ...DEFAULT_METRICS,
            }
          }
        })
      )

      setMeetings(meetingsWithParticipation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load past meetings')
    } finally {
      setLoading(false)
    }
  }, [clientTicker, limit])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return (
    <PastMeetingsTable
      clientTicker={clientTicker}
      meetings={meetings}
      loading={loading}
      formatDate={formatDate}
      error={error}
      onRetry={fetchData}
      showSorting={false}
      maxHeight={maxHeight}
    />
  )
}
