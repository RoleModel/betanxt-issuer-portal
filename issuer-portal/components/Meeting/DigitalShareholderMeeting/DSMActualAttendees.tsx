'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { Search, Email, Person, AccessTime, TrendingUp } from '@mui/icons-material'

import { ExportButton } from './ExportButton'
import type { components } from '@/domain-models/generated-schema'

type DigitalShareholderMeeting = components['schemas']['DigitalShareholderMeeting']

interface DSMActualAttendeesProps {
  meetingId: string
}

type AttendanceFilter = 'all' | 'high' | 'medium' | 'low'

export function DSMActualAttendees({ meetingId }: DSMActualAttendeesProps) {
  const [attendees, setAttendees] = useState<DigitalShareholderMeeting[]>([])
  const [filteredAttendees, setFilteredAttendees] = useState<DigitalShareholderMeeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all')

  useEffect(() => {
    async function fetchAttendees() {
      try {
        setIsLoading(true)
        setError(null)

        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
        const response = await fetch(`${API_URL}/meetings/${meetingId}/digital-shareholder-meeting`)
        if (!response.ok) {
          throw new Error('Failed to fetch actual attendees')
        }

        const data = (await response.json()) as DigitalShareholderMeeting[]

        // Filter for actual attendees (those who attended for some time)
        const actualAttendees = data.filter(
          (participant) => (participant.minutesAttendedMeeting || 0) > 0
        )

        // Sort by attendance time (highest first)
        actualAttendees.sort((a, b) =>
          (b.minutesAttendedMeeting || 0) - (a.minutesAttendedMeeting || 0)
        )

        setAttendees(actualAttendees)
        setFilteredAttendees(actualAttendees)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load actual attendees')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchAttendees()
  }, [meetingId])

  // Filter attendees based on search term and attendance filter
  useEffect(() => {
    let filtered = [...attendees]

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((attendee) => {
        const fullName = `${attendee.firstName || ''} ${attendee.lastName || ''}`.toLowerCase()
        const email = (attendee.emailAddress || '').toLowerCase()
        const type = (attendee.registrantType || '').toLowerCase()

        return (
          fullName.includes(searchLower) ||
          email.includes(searchLower) ||
          type.includes(searchLower)
        )
      })
    }

    // Apply attendance filter
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter((attendee) => {
        const minutes = attendee.minutesAttendedMeeting || 0
        switch (attendanceFilter) {
          case 'high':
            return minutes >= 45 // High engagement: 45+ minutes
          case 'medium':
            return minutes >= 15 && minutes < 45 // Medium: 15-44 minutes
          case 'low':
            return minutes > 0 && minutes < 15 // Low: 1-14 minutes
          default:
            return true
        }
      })
    }

    setFilteredAttendees(filtered)
  }, [attendees, searchTerm, attendanceFilter])

  const getAttendanceLevel = (minutes: number) => {
    if (minutes >= 45) {
      return { level: 'High', color: 'success' as const, icon: <TrendingUp fontSize="small" /> }
    }
    if (minutes >= 15) {
      return { level: 'Medium', color: 'warning' as const, icon: <AccessTime fontSize="small" /> }
    }
    return { level: 'Low', color: 'error' as const, icon: <AccessTime fontSize="small" /> }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Shareholder':
        return 'primary'
      case 'Proxy':
        return 'secondary'
      case 'Guest':
        return 'default'
      default:
        return 'default'
    }
  }

  const totalAttendees = attendees.length
  const highEngagement = attendees.filter(a => (a.minutesAttendedMeeting || 0) >= 45).length
  const mediumEngagement = attendees.filter(a => {
    const minutes = a.minutesAttendedMeeting || 0
    return minutes >= 15 && minutes < 45
  }).length
  const lowEngagement = attendees.filter(a => {
    const minutes = a.minutesAttendedMeeting || 0
    return minutes > 0 && minutes < 15
  }).length
  const avgAttendance = totalAttendees > 0
    ? Math.round(attendees.reduce((sum, a) => sum + (a.minutesAttendedMeeting || 0), 0) / totalAttendees)
    : 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Actual Attendees" />
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading actual attendees...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Actual Attendees" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Actual Attendees"
        subheader={`${totalAttendees} attended • ${avgAttendance} min average attendance`}
        action={
          <ExportButton
            attendees={attendees}
            sectionName="Actual Attendees"
            disabled={attendees.length === 0}
          />
        }
      />
      <CardContent>
        {/* Summary Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {totalAttendees}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Attendees
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {highEngagement}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              High Engagement
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {mediumEngagement}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Medium Engagement
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">
              {lowEngagement}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Low Engagement
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {avgAttendance} min
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Attendance
            </Typography>
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search attendees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Engagement</InputLabel>
            <Select
              value={attendanceFilter}
              label="Engagement"
              onChange={(e) => setAttendanceFilter(e.target.value as AttendanceFilter)}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="high">High (45+ min)</MenuItem>
              <MenuItem value="medium">Medium (15-44 min)</MenuItem>
              <MenuItem value="low">Low (1-14 min)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Attendees Table */}
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Minutes Attended</TableCell>
                <TableCell>Engagement</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttendees.map((attendee) => {
                const minutes = attendee.minutesAttendedMeeting || 0
                const attendance = getAttendanceLevel(minutes)

                return (
                  <TableRow key={attendee.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {attendee.firstName} {attendee.lastName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={attendee.registrantType || 'Unknown'}
                        color={getRoleColor(attendee.registrantType || '')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {attendee.emailAddress}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {minutes} min
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={attendance.level}
                        color={attendance.color}
                        size="small"
                        icon={attendance.icon}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {attendee.emailAddress && (
                        <Tooltip title="Send Follow-up Email">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const subject = encodeURIComponent('Thank You for Attending Our Shareholder Meeting')
                              const body = encodeURIComponent(
                                `Dear ${attendee.firstName} ${attendee.lastName},\n\nThank you for attending our shareholder meeting. We appreciate your ${minutes} minutes of participation.\n\nBest regards`
                              )
                              window.open(`mailto:${attendee.emailAddress}?subject=${subject}&body=${body}`, '_blank')
                            }}
                          >
                            <Email fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredAttendees.length === 0 && attendees.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No attendees match your search criteria
            </Typography>
          </Box>
        )}

        {attendees.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No actual attendees recorded yet
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
