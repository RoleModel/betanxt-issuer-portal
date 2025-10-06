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
  IconButton,
  Tooltip,
  LinearProgress,
  TextField,
  InputAdornment,
} from '@mui/material'
import { Search, Email } from '@mui/icons-material'

import { ExportButton } from './ExportButton'
import type { components } from '@/domain-models/generated-schema'

type DigitalShareholderMeeting = components['schemas']['DigitalShareholderMeeting']

interface DSMGuestRegistrantsProps {
  meetingId: string
}

export function DSMGuestRegistrants({ meetingId }: DSMGuestRegistrantsProps) {
  const [guests, setGuests] = useState<DigitalShareholderMeeting[]>([])
  const [filteredGuests, setFilteredGuests] = useState<DigitalShareholderMeeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchGuests() {
      try {
        setIsLoading(true)
        setError(null)

        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
        const response = await fetch(`${API_URL}/meetings/${meetingId}/digital-shareholder-meeting`)
        if (!response.ok) {
          throw new Error('Failed to fetch guest registrants')
        }

        const data = (await response.json()) as DigitalShareholderMeeting[]

        // Filter for guests only
        const guestRegistrants = data.filter(
          (participant) => participant.registrantType === 'Guest'
        )

        setGuests(guestRegistrants)
        setFilteredGuests(guestRegistrants)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guest registrants')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchGuests()
  }, [meetingId])

  // Filter guests based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGuests(guests)
      return
    }

    const filtered = guests.filter((guest) => {
      const searchLower = searchTerm.toLowerCase()
      const fullName = `${guest.firstName || ''} ${guest.lastName || ''}`.toLowerCase()
      const email = (guest.emailAddress || '').toLowerCase()

      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower)
      )
    })

    setFilteredGuests(filtered)
  }, [guests, searchTerm])


  if (isLoading) {
    return (
      <LinearProgress />
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Guest Registrants" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Guest Registrants"
        action={
          <ExportButton
            attendees={guests}
            sectionName="Guest Registrants"
            disabled={guests.length === 0}
          />
        }
      />
      <CardContent>
        {/* Search */}
        <Box sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Search guests"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              },
            }}

          />
        </Box>

        {/* Guests Table */}
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGuests.map((guest) => {
                return (
                  <TableRow key={guest.id} hover>
                    <TableCell>
                      {guest.firstName} {guest.lastName}
                    </TableCell>
                    <TableCell>
                      {guest.emailAddress}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {guest.createdAt
                          ? new Date(guest.createdAt).toLocaleDateString()
                          : 'Unknown'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {guest.emailAddress && (
                        <Tooltip title="Send Email">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const subject = encodeURIComponent('Regarding Your Meeting Registration')
                              const body = encodeURIComponent(
                                `Dear ${guest.firstName} ${guest.lastName},\n\nThank you for registering for our shareholder meeting.\n\nBest regards`
                              )
                              window.open(`mailto:${guest.emailAddress}?subject=${subject}&body=${body}`, '_blank')
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

        {filteredGuests.length === 0 && guests.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No guests match your search criteria
            </Typography>
          </Box>
        )}

        {guests.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No guest registrants yet
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
