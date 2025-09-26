'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { Box, Container, LinearProgress } from '@mui/material'

import Layout from '@/components/Layout/Layout'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

type Meeting = components['schemas']['Meeting']

interface PastMeetingData extends Meeting {
  participationPercent: number
  totalVotes: number
  votingShares: number
}

type Order = 'asc' | 'desc'
type OrderBy = keyof PastMeetingData

// Define the props for PastMeetingsTable to satisfy TypeScript
interface PastMeetingsTableProps {
  clientTicker: string
  order: Order
  orderBy: OrderBy
  onRequestSort: (property: OrderBy) => void
  meetings: PastMeetingData[]
  rawMeetingsCount: number
  loading: boolean
  formatDate: (dateString: string) => string
  formatNumber: (num: number) => string
}

// Separate heavy table section into dynamic child to defer large MUI table bundle
const PastMeetingsTable = dynamic<PastMeetingsTableProps>(
  () => import('./pastMeetingsTableSection'),
  {
    ssr: false,
  }
)

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

      // Use openapi-fetch to fetch meetings
      const apiClient = await buildApiClient()
      const { data, error } = await apiClient.GET('/meetings', {
        params: {
          query: {
            ticker: clientTicker.toUpperCase(),
            status: 'COMPLETE',
          },
        },
      })

      if (error) {
        throw new Error('Failed to fetch meetings')
      }

      // Get meetings array from the paginated response - already filtered by API
      const completedMeetings = data?.meetings || []

      // Calculate participation data from actual voting data
      const meetingsWithParticipation: PastMeetingData[] = await Promise.all(
        completedMeetings.map(async (meeting) => {
          try {
            // Fetch positions for this meeting to calculate participation
            const positionsResult = await apiClient.GET('/positions', {
              params: { query: { meetingId: meeting.id } },
            })

            // Extract positions array from API response
            // Handle different possible response formats
            const responseData = positionsResult.data
            const positions = Array.isArray(responseData)
              ? (responseData as components['schemas']['Position'][])
              : ((
                  responseData as unknown as {
                    positions?: components['schemas']['Position'][]
                  }
                )?.positions ?? [])

            // Use totalSharesOutstanding from meeting for participation calculation
            const totalSharesOutstanding = parseInt(
              meeting.totalSharesOutstanding || '0',
              10
            )

            // Calculate voted shares using sharesVoted field
            const votedShares = positions.reduce((sum, p) => {
              // Use sharesVoted if available, otherwise 0
              const shares = p.sharesVoted || 0
              return sum + shares
            }, 0)

            const totalVotes = positions.filter((p) => p.voteStatus === 'Voted').length

            const participationPercent =
              totalSharesOutstanding > 0
                ? (votedShares / totalSharesOutstanding) * 100
                : 0

            return {
              ...meeting,
              participationPercent: Math.round(participationPercent * 10) / 10, // Round to 1 decimal
              totalVotes,
              votingShares: votedShares,
            }
          } catch (posError) {
            console.error(`Error fetching positions for meeting ${meeting.id}:`, posError)
            return {
              ...meeting,
              participationPercent: 0,
              totalVotes: 0,
              votingShares: 0,
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

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B'
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
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
      <Container maxWidth="xl" component="main">
        <Box sx={{ p: 3 }}>
          <PastMeetingsTable
            clientTicker={clientTicker}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            meetings={sortedMeetings}
            rawMeetingsCount={meetings.length}
            loading={loading}
            formatDate={formatDate}
            formatNumber={formatNumber}
          />
        </Box>
      </Container>
    </Layout>
  )
}
