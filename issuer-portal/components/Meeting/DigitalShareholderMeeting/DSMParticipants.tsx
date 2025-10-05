'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

import { ExportButton } from './ExportButton'
import { AddDocumentDialog } from './AddDocumentDialog'
import type { components } from '@/domain-models/generated-schema'

type DigitalShareholderMeeting = components['schemas']['DigitalShareholderMeeting']

interface DSMParticipantsProps {
  meetingId: string
}

interface ParticipantWithRole extends DigitalShareholderMeeting {
  role: string
  documentName?: string
  documentStatus?: 'uploaded' | 'pending' | 'approved' | 'rejected'
  documentUrl?: string
}



export function DSMParticipants({ meetingId }: DSMParticipantsProps) {
  const [participants, setParticipants] = useState<ParticipantWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithRole | null>(null)
  const [addDocumentDialogOpen, setAddDocumentDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchParticipants() {
      try {
        setIsLoading(true)
        setError(null)

        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
        const response = await fetch(`${API_URL}/meetings/${meetingId}/digital-shareholder-meeting`)
        if (!response.ok) {
          throw new Error('Failed to fetch participants')
        }

        const data: DigitalShareholderMeeting[] = await response.json()

        // Transform data to include role information (no documents initially)
        const participantsWithRoles: ParticipantWithRole[] = data.map((participant) => {
          const role = participant.registrantType || 'Shareholder'

          return {
            ...participant,
            role,
            // Documents start empty - will be added via the add document functionality
            documentName: undefined,
            documentStatus: undefined,
            documentUrl: undefined,
          }
        })

        setParticipants(participantsWithRoles)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load participants')
      } finally {
        setIsLoading(false)
      }
    }

    fetchParticipants()
  }, [meetingId])

  const handleAddDocument = (participant: ParticipantWithRole) => {
    setSelectedParticipant(participant)
    setAddDocumentDialogOpen(true)
  }

  const handleDocumentAdded = (documentName: string, documentStatus: string) => {
    if (selectedParticipant) {
      setParticipants(prev => prev.map(p =>
        p.id === selectedParticipant.id
          ? {
            ...p,
            documentName,
            documentStatus: documentStatus as 'uploaded' | 'pending' | 'approved' | 'rejected',
            documentUrl: `/documents/dsm/${p.id}.pdf`
          }
          : p
      ))
    }
  }

  const handleCloseDialog = () => {
    setAddDocumentDialogOpen(false)
    setSelectedParticipant(null)
  }



  const getDocumentStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'uploaded':
        return 'info'
      case 'pending':
        return 'warning'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  const getAttendanceStatus = (participant: ParticipantWithRole) => {
    const minutesAttended = participant.minutesAttendedMeeting || 0
    if (minutesAttended > 0) {
      return { label: `${minutesAttended} min`, color: 'success' as const }
    }
    return { label: 'Registered', color: 'default' as const }
  }

  const actualAttendees = participants.filter(p => (p.minutesAttendedMeeting || 0) > 0).length

  if (isLoading) {
    return (
      <LinearProgress />
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Meeting Participants" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Meeting Participants"
        subheader={`${participants.length} registered • ${actualAttendees} attended`}
        action={
          <ExportButton
            attendees={participants}
            sectionName="DSM Participants"
            disabled={participants.length === 0}
          />
        }
      />
      <CardContent>
        {/* Participants Table */}
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Registration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((participant) => {
                const attendanceStatus = getAttendanceStatus(participant)

                return (
                  <TableRow key={participant.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {participant.firstName} {participant.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {participant.emailAddress}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {participant.documentName ? (
                        <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {participant.documentName}
                        </Typography>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddDocument(participant)}
                          sx={{ textTransform: 'none' }}
                        >
                          Add Document
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {participant.documentStatus ? (
                        <Chip
                          label={participant.documentStatus}
                          color={getDocumentStatusColor(participant.documentStatus)}
                          size="small"
                        />
                      ) : (
                        <Chip
                          label={attendanceStatus.label}
                          color={attendanceStatus.color}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {participant.createdAt
                          ? new Date(participant.createdAt).toLocaleDateString()
                          : 'Unknown'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {participants.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No participants registered yet
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Add Document Dialog */}
      <AddDocumentDialog
        open={addDocumentDialogOpen}
        onClose={handleCloseDialog}
        participantName={selectedParticipant ? `${selectedParticipant.firstName} ${selectedParticipant.lastName}` : ''}
        meetingId={meetingId}
        onDocumentAdded={handleDocumentAdded}
      />
    </Card>
  )
}
