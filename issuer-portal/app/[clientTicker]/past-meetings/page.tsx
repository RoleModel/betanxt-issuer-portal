'use client'

import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { Box, Container, LinearProgress } from '@mui/material'

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

// Generate consistent participation rate between 58% and 74% using meeting id as seed
// This matches the seeded random in useReporting.ts
const generateSeededParticipation = (meetingId: string): number => {
  const meetingIdHash = (meetingId ?? '')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const seededRandom = ((meetingIdHash * 9301 + 49297) % 233280) / 233280
  return Math.round((58 + seededRandom * 16) * 10) / 10
}

const getDefaultMetrics = (meetingId: string): ParticipationMetrics => ({
  participationPercent: generateSeededParticipation(meetingId),
  totalVotes: 0,
  votingShares: 0,
})

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
  const meetingId = getMeetingId(meeting)
  if (positions.length === 0) {
    return getDefaultMetrics(meetingId)
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
      asRecord(position as unknown)?.shares_voted ??
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
        const errBody = meetingsResponse.error as Record<string, unknown>
        const msg =
          (typeof errBody.message === 'string' ? errBody.message : null) ??
          (typeof errBody.error === 'string' ? errBody.error : null) ??
          'Failed to fetch meetings'
        throw new Error(msg)
      }

      // Get meetings array from the paginated response - already filtered by API
      interface MeetingsApiResponse {
        meetings?: Meeting[]
        pagination?: components['schemas']['Pagination']
      }
      const typedData = meetingsResponse.data as MeetingsApiResponse | undefined
      const completedMeetings: Meeting[] = Array.isArray(typedData?.meetings)
        ? typedData.meetings
        : []

      // Use consistent seeded mock participation data to match Reporting page
      const meetingsWithParticipation: PastMeetingData[] = completedMeetings.map(
        (meeting: Meeting): PastMeetingData => {
          const meetingId = getMeetingId(meeting)
          return {
            ...meeting,
            ...getDefaultMetrics(meetingId),
          }
        }
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
    void fetchPastMeetings()
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
      let compareA: string | number = a[orderBy] as string
      let compareB: string | number = b[orderBy] as string

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
  )
}
