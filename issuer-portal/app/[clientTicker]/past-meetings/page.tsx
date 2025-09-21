'use client'

import NextLink from 'next/link'
import React, { useEffect, useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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

import { listMeetings as _listMeetings } from '@/domain-models/api/meetings'
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
  const [meetings, setMeetings] = useState<PastMeetingData[]>([])
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order>('desc')
  const [orderBy, setOrderBy] = useState<OrderBy>('meetingDate')

  useEffect(() => {
    fetchPastMeetings()
  }, [])

  const fetchPastMeetings = async () => {
    try {
      setLoading(true)

      // Fetch completed meetings with their voting data
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .eq('status', 'completed')
        .order('meeting_date', { ascending: false })

      if (meetingsError) throw meetingsError

      // Fetch voting data for these meetings
      const { data: votingData, error: votingError } = await supabase.rpc(
        'get_meeting_participation_data'
      )

      if (votingError) {
        // If the RPC doesn't exist, let's query the data manually
        const meetingIds = meetingsData?.map((m) => m.id) || []
        const { data: manualVotingData, error: manualError } = await supabase
          .from('positions')
          .select(
            `
            meeting_id,
            position_votes(shares_voting)
          `
          )
          .in('meeting_id', meetingIds)

        if (manualError) throw manualError

        // Group by meeting_id and sum shares
        const votingByMeeting: Record<
          string,
          { totalVotes: number; votingShares: number }
        > = {}
        interface VotingPosition {
          meeting_id: string
          position_votes?: Array<{ shares_voting: string }>
        }

        manualVotingData?.forEach((position: VotingPosition) => {
          const meetingId = position.meeting_id
          if (!votingByMeeting[meetingId]) {
            votingByMeeting[meetingId] = { totalVotes: 0, votingShares: 0 }
          }
          position.position_votes?.forEach((vote) => {
            votingByMeeting[meetingId].totalVotes += 1
            votingByMeeting[meetingId].votingShares += parseInt(vote.shares_voting) || 0
          })
        })

        // Combine meeting data with voting data
        const meetingsWithParticipation: PastMeetingData[] = (meetingsData || []).map(
          (meeting) => {
            const votingInfo = votingByMeeting[meeting.id] || {
              totalVotes: 0,
              votingShares: 0,
            }
            const outstandingShares = meeting.total_shares_outstanding || 0
            const participationPercent =
              outstandingShares > 0
                ? Math.round((votingInfo.votingShares / outstandingShares) * 100)
                : 0

            return {
              ...meeting,
              participationPercent,
              totalVotes: votingInfo.totalVotes,
              votingShares: votingInfo.votingShares,
            }
          }
        )

        setMeetings(meetingsWithParticipation)
      } else {
        // Use RPC data if available
        setMeetings(votingData || [])
      }
    } catch (error) {
      console.error('Error fetching past meetings:', error)
      setMeetings([])
    } finally {
      setLoading(false)
    }
  }

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
      if (orderBy === 'meeting_date') {
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
                      active={orderBy === 'meeting_date'}
                      direction={orderBy === 'meeting_date' ? order : 'asc'}
                      onClick={() => handleRequestSort('meeting_date')}
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
                        href={`/meeting/${meeting.id}`}
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
                        {meeting.meeting_date ? formatDate(meeting.meeting_date) : 'TBD'}
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
                        href={`/meeting/${meeting.id}/reports`}
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
  )
}
