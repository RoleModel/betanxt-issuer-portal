'use client'

import NextLink from 'next/link'
import React from 'react'

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

import type { components } from '@/domain-models/generated-schema'

type Meeting = components['schemas']['Meeting']

interface PastMeetingData extends Meeting {
  participationPercent: number
  totalVotes: number
  votingShares: number
}

type Order = 'asc' | 'desc'

type Props = {
  clientTicker: string
  order: Order
  orderBy: keyof PastMeetingData
  onRequestSort: (property: keyof PastMeetingData) => void
  meetings: PastMeetingData[]
  rawMeetingsCount: number
  loading: boolean
  formatDate: (dateString: string) => string
  formatNumber: (num: number) => string
}

export default function PastMeetingsTableSection({
  clientTicker,
  order,
  orderBy,
  onRequestSort,
  meetings,
  rawMeetingsCount,
  loading,
  formatDate,
  formatNumber,
}: Props) {
  if (loading) return <LinearProgress />
  return (
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
                    onClick={() => onRequestSort('title')}
                  >
                    Meeting
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>
                  <TableSortLabel
                    active={orderBy === 'cusip'}
                    direction={orderBy === 'cusip' ? order : 'asc'}
                    onClick={() => onRequestSort('cusip')}
                  >
                    CUSIP
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>
                  <TableSortLabel
                    active={orderBy === 'meetingDate'}
                    direction={orderBy === 'meetingDate' ? order : 'asc'}
                    onClick={() => onRequestSort('meetingDate')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>
                  <TableSortLabel
                    active={orderBy === 'participationPercent'}
                    direction={orderBy === 'participationPercent' ? order : 'asc'}
                    onClick={() => onRequestSort('participationPercent')}
                  >
                    Participation
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Reports</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meetings.map((meeting) => (
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

        {rawMeetingsCount === 0 && !loading && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No past meetings found.</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
