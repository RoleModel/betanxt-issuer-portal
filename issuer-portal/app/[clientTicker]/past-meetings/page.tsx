'use client'

import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { Box, Container, LinearProgress } from '@mui/material'

import Layout from '@/components/Layout/Layout'
import PastMeetingsTable, {
  type Order,
  type PastMeetingData,
} from '@/components/Meeting/PastMeetingsTable'

import buildApiClient, { type ApiClientReturnType } from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { asRecord, asString } from '@/utils/typeUtils'

type Meeting = components['schemas']['Meeting']
type OrderBy = keyof PastMeetingData

type ParticipationMetrics = Pick<
  PastMeetingData,
  'participationPercent' | 'totalVotes' | 'votingShares'
>

// Minimal shape of the tabulation report we rely on (extend if OpenAPI adds more fields)
interface TabulationReportPositionsVoted {
  totalShares?: number
  votedShares?: number
  voted?: number
}

interface TabulationReport {
  positionsVoted?: TabulationReportPositionsVoted
}

const DEFAULT_METRICS: ParticipationMetrics = {
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

const extractPositions = (data: unknown): components['schemas']['Position'][] => {
  if (Array.isArray(data)) {
    return data as components['schemas']['Position'][]
  }

  const record = asRecord(data)
  if (record?.positions && Array.isArray(record.positions)) {
    return record.positions as components['schemas']['Position'][]
  }

  return []
}

const getMeetingId = (meeting: Meeting): string => {
  if (meeting.id) return meeting.id

  const meetingRecord = asRecord(meeting as unknown)
  if (!meetingRecord) return ''

  return (
    asString(meetingRecord.meetingId) ??
    asString(meetingRecord.meeting_id) ??
    asString(meetingRecord.id) ??
    ''
  )
}

const getTotalSharesOutstanding = (meeting: Meeting): number => {
  const directValue = parseNumericValue(meeting.totalSharesOutstanding)
  if (directValue > 0) return directValue

  const meetingRecord = asRecord(meeting as unknown)
  if (!meetingRecord) return 0

  const camelCaseValue = parseNumericValue(meetingRecord.totalSharesOutstanding)
  if (camelCaseValue > 0) return camelCaseValue

  return parseNumericValue(meetingRecord.total_shares_outstanding)
}

const computeParticipationMetrics = (
  meeting: Meeting,
  positions: components['schemas']['Position'][]
): ParticipationMetrics => {
  if (positions.length === 0) {
    return { ...DEFAULT_METRICS }
  }

  const totalSharesOutstanding = getTotalSharesOutstanding(meeting)
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
      (asRecord(position as unknown)?.shares_voted as unknown) ??
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

export default function PastMeetingsPage() {
  const pathname = usePathname()
  const clientTicker = pathname.split('/')[1]
  const [meetings, setMeetings] = useState<PastMeetingData[]>([])
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order>('desc')
  const [orderBy, setOrderBy] = useState<OrderBy>('meetingDate')

  const fetchPastMeetings = useCallback(async () => {
    try {
      setLoading(true)

      if (!clientTicker) {
        setMeetings([])
        setLoading(false)
        return
      }

      // Use openapi-fetch to fetch meetings
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
        throw new Error(meetingsResponse.error.message || 'Failed to fetch meetings')
      }

      // Get meetings array from the paginated response - already filtered by API
      type MeetingsApiResponse = {
        meetings?: Meeting[]
        pagination?: components['schemas']['Pagination']
      }
      const typedData = meetingsResponse.data as MeetingsApiResponse | undefined
      const completedMeetings: Meeting[] = Array.isArray(typedData?.meetings)
        ? typedData!.meetings!
        : []

      // Calculate participation data from tabulation reports
      const meetingsWithParticipation: PastMeetingData[] = await Promise.all(
        completedMeetings.map(async (meeting: Meeting): Promise<PastMeetingData> => {
          const meetingId = getMeetingId(meeting)
          if (!meetingId) {
            return {
              ...meeting,
              ...DEFAULT_METRICS,
            }
          }

          try {
            // Fetch tabulation report which contains pre-calculated participation data
            const tabulationResult = (await apiClient.GET(
              '/meetings/{meetingId}/tabulation-report',
              {
                params: { path: { meetingId } },
              }
            )) as ApiClientReturnType<unknown>

            if (tabulationResult.error) {
              // Fallback: compute from positions
              const positionsResult = (await apiClient.GET('/positions', {
                params: { query: { select: '*', limit: 100000 } },
              })) as ApiClientReturnType<unknown>

              if (positionsResult.error) {
                throw new Error(
                  positionsResult.error.message || 'Failed to fetch positions'
                )
              }

              const positions = extractPositions(positionsResult.data)
              const metrics = computeParticipationMetrics(meeting, positions)

              return {
                ...meeting,
                ...metrics,
              }
            }

            // Extract participation data from tabulation report
            const report = tabulationResult.data as TabulationReport | undefined
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

            // Fallback if positionsVoted missing
            return {
              ...meeting,
              ...DEFAULT_METRICS,
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
    } catch (error) {
      console.error('Error fetching past meetings:', error)
      setMeetings([])
    } finally {
      setLoading(false)
    }
  }, [clientTicker])

  useEffect(() => {
    fetchPastMeetings()
  }, [fetchPastMeetings])

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      // Parse as local date to avoid timezone issues
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

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortedMeetings = React.useMemo(() => {
    return [...meetings].sort((a, b) => {
      let compareA: string | number = a[orderBy as keyof typeof a] as string
      let compareB: string | number = b[orderBy as keyof typeof b] as string

      // Handle date sorting
      if (orderBy === 'meetingDate') {
        compareA = new Date(compareA).getTime()
        compareB = new Date(compareB).getTime()
      }

      // Handle numeric sorting
      if (typeof compareA === 'number' && typeof compareB === 'number') {
        return order === 'asc' ? compareA - compareB : compareB - compareA
      }

      // Handle string sorting
      if (typeof compareA === 'string' && typeof compareB === 'string') {
        return order === 'asc'
          ? compareA.localeCompare(compareB)
          : compareB.localeCompare(compareA)
      }

      return 0
    })
  }, [meetings, order, orderBy])

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Layout navBar={true}>
      <Box sx={{ p: { xs: 1, sm: 3 }, flexGrow: 1, flex: 1 }}>
        <Container maxWidth="xl">
          <PastMeetingsTable
            clientTicker={clientTicker}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            meetings={sortedMeetings}
            rawMeetingsCount={meetings.length}
            loading={loading}
            formatDate={formatDate}
          />
        </Container>
      </Box>
    </Layout>
  )
}
