'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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

import StatusChip from '@/components/ui/StatusChip'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

type Meeting = components['schemas']['Meeting']

interface MeetingData extends Meeting {
  daysUntilMeeting: number
}

type Order = 'asc' | 'desc'
type OrderBy = keyof MeetingData

export default function MeetingsPage() {
  const params = useParams()
  const clientTicker = params.clientTicker as string
  const [meetings, setMeetings] = useState<MeetingData[]>([])
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<OrderBy>('meetingDate')

  useEffect(() => {
    fetchMeetings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchMeetings = async () => {
    try {
      // Fetch active and upcoming meetings using openapi-fetch
      const apiClient = await buildApiClient()
      const result = await apiClient.GET('/meetings', {
        params: {
          query: {
            ticker: clientTicker,
            status: 'ACTIVE',
          },
        },
      })

      const { data, error } = result

      if (!data) {
        if (error) {
          throw new Error('Failed to fetch meetings')
        }
        throw new Error('No data returned from API')
      }

      const meetingsData = data as Meeting[]

      // Calculate days until meeting
      const meetingsWithData: MeetingData[] = meetingsData.map((meeting: Meeting) => {
        const meetingDate = new Date(meeting.meetingDate || '')
        const today = new Date()
        const daysUntilMeeting = Math.ceil(
          (meetingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        return {
          ...meeting,
          daysUntilMeeting,
        }
      })

      setMeetings(meetingsWithData)
    } catch (error) {
      console.error('Error fetching meetings:', error)
      setMeetings([])
    }
  }

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

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Card>
        <CardHeader title="Active Meetings" />
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
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
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
                      {meeting.daysUntilMeeting > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {meeting.daysUntilMeeting} days
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={meeting.status || 'ACTIVE'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          component={NextLink}
                          href={`/${clientTicker}/meeting/${meeting.id}`}
                        >
                          Manage
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          component={NextLink}
                          href={`/${clientTicker}/meeting/${meeting.id}/calendar`}
                        >
                          Calendar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {meetings.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No active meetings found.</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
