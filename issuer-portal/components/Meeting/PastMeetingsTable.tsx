'use client'

import NextLink from 'next/link'
import React from 'react'

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'

import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'
import SkeletonTable from '@/components/ui/SkeletonTable'

import type { components } from '@/domain-models/generated-schema'

import { truncateNumber } from '@/utils/numberUtils'

type Meeting = components['schemas']['Meeting']

export interface PastMeetingData extends Meeting {
  participationPercent: number
  totalVotes: number
  votingShares: number
}

type Order = 'asc' | 'desc'

interface PastMeetingsTableProps {
  clientTicker: string
  order?: Order
  orderBy?: keyof PastMeetingData
  onRequestSort?: (property: keyof PastMeetingData) => void
  meetings: PastMeetingData[]
  rawMeetingsCount?: number
  loading: boolean
  formatDate: (dateString: string) => string
  error?: string | null
  onRetry?: () => void
  // Display options
  showSorting?: boolean
  showHeader?: boolean
  maxHeight?: number | string
}

export default function PastMeetingsTable({
  clientTicker,
  order = 'desc',
  orderBy = 'meetingDate',
  onRequestSort,
  meetings,
  rawMeetingsCount: _rawMeetingsCount = meetings.length,
  loading,
  formatDate,
  error,
  onRetry,
  showSorting = true,
  showHeader = true,
  maxHeight,
}: PastMeetingsTableProps) {
  const handleSort = (property: keyof PastMeetingData) => {
    if (onRequestSort) {
      onRequestSort(property)
    }
  }

  const renderHeaderCell = (
    label: string,
    property: keyof PastMeetingData,
    sortable = true
  ) => {
    if (!showSorting || !sortable) {
      return <TableCell sx={{ fontWeight: 600, py: 2 }}>{label}</TableCell>
    }

    return (
      <TableCell sx={{ fontWeight: 600, py: 2 }}>
        <TableSortLabel
          active={orderBy === property}
          direction={orderBy === property ? order : 'asc'}
          onClick={() => handleSort(property)}
        >
          {label}
        </TableSortLabel>
      </TableCell>
    )
  }

  if (loading) {
    return (
      <Card>
        {showHeader && <CardHeader title="Past Meetings" />}
        <CardContent sx={{ p: 0 }}>
          <SkeletonTable columns={5} rows={6} />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        {showHeader && <CardHeader title="Past Meetings" />}
        <CardContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          {onRetry && (
            <Button onClick={onRetry} variant="outlined">
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && <CardHeader title="Past Meetings" />}
      <CardContent sx={{ p: 0 }}>
        <TableContainer sx={{ maxHeight }}>
          <Table stickyHeader>
            <SROnlyTableCaption>Past meetings</SROnlyTableCaption>
            <TableHead>
              <TableRow>
                {renderHeaderCell('Meeting', 'title')}
                {renderHeaderCell('CUSIP', 'cusip')}
                {renderHeaderCell('Date', 'meetingDate')}
                {renderHeaderCell('Participation', 'participationPercent')}
                <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>
                  Reports
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No past meetings found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                meetings.map((meeting) => (
                  <TableRow key={meeting.id} hover>
                    <TableCell size="small">
                      <Button
                        variant="text"
                        color="info"
                        component={NextLink}
                        href={`/${clientTicker}/past-meeting/${meeting.id}/tabulation`}
                      >
                        {meeting.title}
                      </Button>
                    </TableCell>
                    <TableCell size="small">
                      <Typography variant="body3" color="text.secondary">
                        {meeting.cusip ?? 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell size="small">
                      <Typography variant="body3">
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
                            <Typography variant="body3" sx={{ fontWeight: 600 }}>
                              {meeting.participationPercent}%
                            </Typography>
                            <Typography variant="body3" color="text.secondary">
                              {truncateNumber(meeting.votingShares)}
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
                                    return theme.vars.palette.warning.main
                                  return theme.vars.palette.primary.main
                                },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right" size="small">
                      <Button
                        variant="text"
                        color="info"
                        component={NextLink}
                        href={`/${clientTicker}/past-meeting/${meeting.id}/reports`}
                      >
                        View Reports
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

// Export types for external use
export type { Order }
