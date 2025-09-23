'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  LinearProgress,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'

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

            const positions = positionsResult.data || []

            const totalShares = positions.reduce((sum, p) => sum + (p.shares || 0), 0)
            const votedShares = positions
              .filter((p) => p.voteStatus === 'Voted')
              .reduce((sum, p) => sum + (p.sharesVoted || p.shares || 0), 0)
            const totalVotes = positions.filter((p) => p.voteStatus === 'Voted').length

            const participationPercent = totalShares > 0 ? (votedShares / totalShares) * 100 : 0

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
      <Container>
        <Box sx={{ p: 3 }}>
          <Card>
            <CardHeader title="Past Meetings" />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>
                        <TableSortLabel
                          active={orderBy === 'title'}
                          direction={orderBy === 'title' ? order : 'asc'}
                          onClick={() => handleRequestSort('title')}
                        >
                          Meeting
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>
                        <TableSortLabel
                          active={orderBy === 'cusip'}
                          direction={orderBy === 'cusip' ? order : 'asc'}
                          onClick={() => handleRequestSort('cusip')}
                        >
                          CUSIP
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>
                        <TableSortLabel
                          active={orderBy === 'meetingDate'}
                          direction={orderBy === 'meetingDate' ? order : 'asc'}
                          onClick={() => handleRequestSort('meetingDate')}
                        >
                          Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>
                        <TableSortLabel
                          active={orderBy === 'participationPercent'}
                          direction={orderBy === 'participationPercent' ? order : 'asc'}
                          onClick={() => handleRequestSort('participationPercent')}
                        >
                          Participation
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Reports</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedMeetings.map((meeting) => (
                      <TableRow key={meeting.id} hover>
                        <TableCell>
                          <Link
                            component={NextLink}
                            href={`/${clientTicker}/meeting/${meeting.id}`}
                            underline="hover"
                            color="primary"
                            sx={{ fontWeight: 500 }}
                          >
                            {meeting.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {meeting.cusip || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {meeting.meetingDate ? formatDate(meeting.meetingDate) : 'TBD'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 200 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  mb: 0.5,
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {meeting.participationPercent}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatNumber(meeting.votingShares)}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(meeting.participationPercent, 100)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: `var(--mui-palette-divider)`,
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    backgroundColor: (theme) => {
                                      if (meeting.participationPercent >= 50)
                                        return theme.vars.palette.success.main
                                      if (meeting.participationPercent < 10)
                                        return theme.vars.palette.error.main
                                      return theme.vars.palette.warning.main
                                    },
                                  },
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="text"
                            color="primary"
                            component={NextLink}
                            href={`/${clientTicker}/meeting/${meeting.id}/reports`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {meetings.length === 0 && !loading && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No past meetings found.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Layout>
  )
}
