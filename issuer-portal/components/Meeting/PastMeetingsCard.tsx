'use client'

import Link from 'next/link'
import React from 'react'
import { useEffect, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'

import buildApiClient from '@/domain-models/apiClient'

import { useClient } from '@/contexts/ClientContext'

interface PastMeetingsCardProps {
  sx?: object
}

type PastMeeting = {
  id: string
  title: string
  cusip?: string
  meetingDate?: string
}

export default function PastMeetingsCard({ sx = {} }: PastMeetingsCardProps) {
  const { currentClient } = useClient()
  const clientTicker = currentClient?.ticker || ''

  const [pastMeetings, setPastMeetings] = useState<PastMeeting[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [meetingSharesMap, setMeetingSharesMap] = useState<
    Record<string, { votedShares: number; totalShares: number }>
  >({})

  const formatShares = (num: number) => num.toLocaleString('en-US')

  const calculateParticipation = (meetingId: string) => {
    const entry = meetingSharesMap[meetingId]
    const totalShares = entry?.totalShares || 0
    const votedShares = entry?.votedShares || 0
    const participation = totalShares > 0 ? votedShares / totalShares : 0
    const percentage = participation * 100
    return { percentage, participation, votedShares, totalShares }
  }

  const retry = async () => {
    await fetchData()
  }

  const fetchData = async () => {
    if (!clientTicker) return
    try {
      setLoading(true)
      setError(null)

      const apiClient = await buildApiClient()
      const meetingsResult = await apiClient.GET('/meetings', {
        params: { query: { ticker: clientTicker, page: 1, limit: 100 } },
      })
      const meetings = (meetingsResult.data?.meetings || [])
        .filter((m) => m.meetingDate && new Date(m.meetingDate) < new Date())
        .slice(0, 6)
        .map((m) => {
          const id = m.id || (m as unknown as { meetingId?: string }).meetingId || ''
          const title =
            m.title ||
            (m as unknown as { meetingTitle?: string }).meetingTitle ||
            'Meeting'
          return {
            id,
            title,
            cusip: m.cusip || '',
            meetingDate: m.meetingDate || undefined,
          }
        })

      setPastMeetings(meetings)

      // Preload positions for these meetings to compute participation
      const sharesEntries = await Promise.all(
        meetings.map(async (m) => {
          try {
            const posResult = await apiClient.GET('/positions', {
              params: { query: { meetingId: m.id } },
            })
            const positions = (posResult.data || []) as Array<{
              shares?: number
              sharesVoted?: number
              voteStatus?: 'Voted' | 'Unvoted' | string
            }>
            const totalShares = positions.reduce((sum, p) => sum + (p.shares || 0), 0)
            const votedShares = positions
              .filter((p) => (p.voteStatus || '') === 'Voted')
              .reduce((sum, p) => sum + (p.sharesVoted || p.shares || 0), 0)
            return [m.id, { totalShares, votedShares }] as const
          } catch {
            return [m.id, { totalShares: 0, votedShares: 0 }] as const
          }
        })
      )

      setMeetingSharesMap(Object.fromEntries(sharesEntries))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load past meetings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientTicker])

  return (
    <Card>
      <CardHeader title="Past Meetings" />
      <CardContent sx={{ padding: 0, ...sx }}>
        {loading ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#d6d4d0' }}>
                  <TableCell>Meeting</TableCell>
                  <TableCell>CUSIP</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Participation</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>Reports</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton variant="text" width="60%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="70%" />
                    </TableCell>
                    <TableCell sx={{ minWidth: 250 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0.5,
                          }}
                        >
                          <Skeleton variant="text" width="25%" />
                          <Skeleton variant="text" width="40%" />
                        </Box>
                        <Skeleton variant="rounded" height={4} width="100%" />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton variant="text" width="50%" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button onClick={retry} variant="outlined">
              Retry
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#d6d4d0' }}>
                  <TableCell>Meeting</TableCell>
                  <TableCell>CUSIP</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Participation</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>Reports</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pastMeetings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No past meetings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pastMeetings.map((meeting) => {
                    // Handle different field naming conventions from API
                    const meetingDate = meeting.meetingDate
                    const ticker = clientTicker
                    const cusip = meeting.cusip || ''
                    const title = meeting.title || ''

                    // Calculate vote participation
                    const {
                      percentage: votePercentage,
                      participation,
                      votedShares,
                      totalShares,
                    } = calculateParticipation(meeting.id)

                    return (
                      <TableRow key={meeting.id} sx={{ tableLayout: 'fixed' }}>
                        <TableCell>
                          <Button
                            variant="text"
                            component={Link}
                            href={`/${ticker}/meeting/${meeting.id}`}
                          >
                            {title}
                          </Button>
                        </TableCell>
                        <TableCell>{cusip}</TableCell>
                        <TableCell>
                          {meetingDate
                            ? new Date(meetingDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : ''}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              minWidth: 200,
                              maxWidth: 250,
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 0.5,
                              }}
                            >
                              <span>{votePercentage.toFixed(1)}%</span>
                              <span>
                                {formatShares(votedShares)}/{formatShares(totalShares)}
                              </span>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              color="primary"
                              value={participation * 100}
                              sx={{
                                height: 4,
                                borderRadius: 1,
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            component={Link}
                            variant="text"
                            href={`/${ticker}/meeting/${meeting.id}/reports`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}
