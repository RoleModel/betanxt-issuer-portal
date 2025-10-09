'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
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
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material'
import { Upload } from '@mui/icons-material'

import { ExportButton } from './ExportButton'
import { AddDocumentDialog } from './AddDocumentDialog'
import BNFileUpload from '@/components/FileUpload/BNFileUpload'
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
  const [error, setError] = useState<string | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithRole | null>(null)
  const [addDocumentDialogOpen, setAddDocumentDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const fetchParticipants = useCallback(async () => {
    try {
      setError(null)

      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_URL}/meetings/${meetingId}/digital-shareholder-meeting`)
      if (!response.ok) {
        throw new Error('Failed to fetch participants')
      }

      const data = (await response.json()) as DigitalShareholderMeeting[]

      // Fetch documents for this meeting
      const documentsResponse = await fetch(`${API_URL}/meetings/${meetingId}/documents`)
      let documents: { title?: string; documentType?: string; storagePath?: string }[] = []
      if (documentsResponse.ok) {
        documents = await documentsResponse.json() as { title?: string; documentType?: string; storagePath?: string }[]
      }

      // Filter documents to only DSM-related ones uploaded via the upload buttons
      const dsmDocuments = documents.filter(doc =>
        doc.documentType === 'digital-shareholder-meeting'
      )

      // Transform data to include role information
      // Documents are meeting-level, not participant-specific
      const participantsWithRoles: ParticipantWithRole[] = data.map((participant) => {
        const role = participant.registrantType || 'Shareholder'

        // For meeting-level documents, show the first available DSM document for all participants
        // or indicate that documents are available at the meeting level
        const hasDocuments = dsmDocuments.length > 0
        const firstDocument = dsmDocuments[0]

        return {
          ...participant,
          role,
          documentName: hasDocuments ? `${dsmDocuments.length} meeting document${dsmDocuments.length === 1 ? '' : 's'}` : undefined,
          documentStatus: hasDocuments ? 'uploaded' : undefined,
          documentUrl: firstDocument?.storagePath || undefined,
        }
      })

      setParticipants(participantsWithRoles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load participants')
    }
  }, [meetingId])

  useEffect(() => {
    void fetchParticipants()
  }, [fetchParticipants])

  const handleAddDocument = (participant: ParticipantWithRole) => {
    setSelectedParticipant(participant)
    setAddDocumentDialogOpen(true)
  }

  const handleDocumentAdded = (documentName: string, documentStatus: string) => {
    if (selectedParticipant) {
      // Update local state - this should persist until the next manual refresh
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

      // Don't auto-refresh since the server might not have the association yet
      // The user can manually refresh if needed
    }
  }

  const handleCloseDialog = () => {
    setAddDocumentDialogOpen(false)
    setSelectedParticipant(null)
  }

  const handleUploadClick = () => {
    setUploadDialogOpen(true)
  }

  const handleUploadClose = () => {
    setUploadDialogOpen(false)
  }

  const handleFileUpload = async (files: File[]) => {
    try {
      for (const file of files) {
        // Create unique filename to avoid duplicates
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split('.').pop()
        const uniqueFileName = `${file.name.split('.')[0]}_${timestamp}_${randomId}.${fileExtension}`

        const renamedFile = new File([file], uniqueFileName, { type: file.type })

        const formData = new FormData()
        formData.append('file', renamedFile)
        formData.append('meetingId', meetingId)
        formData.append('documentType', 'digital-shareholder-meeting')

        const response = await fetch('/api/documents/types/digital-shareholder-meeting/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${await response.text()}`)
        }
      }

      // Refresh participants data after upload
      setUploadDialogOpen(false)
      // Trigger a re-fetch by calling the fetch function again
      void fetchParticipants()
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={handleUploadClick}
            >
              Upload
            </Button>
            <ExportButton
              attendees={participants}
              sectionName="DSM Participants"
              disabled={participants.length === 0}
            />
          </Stack>
        }
      />
      <CardContent>
        {/* Participants Table */}
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Attendance</TableCell>
                <TableCell>Document Status</TableCell>
                <TableCell align="right">Document</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((participant) => {
                const attendanceStatus = getAttendanceStatus(participant)

                return (
                  <TableRow key={participant.id} hover>
                    <TableCell>
                      <Typography variant="body3" fontWeight="medium">
                        {participant.firstName} {participant.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Link href={`mailto:${participant.emailAddress}`}>
                        {participant.emailAddress}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={attendanceStatus.label}
                        color={attendanceStatus.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {participant.documentStatus ? (
                        <Chip
                          label={participant.documentStatus.charAt(0).toUpperCase() + participant.documentStatus.slice(1)}
                          color={getDocumentStatusColor(participant.documentStatus)}
                          size="small"
                        />
                      ) : (

                        "Not Uploaded"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {participant.documentName ? (
                        <Typography variant="dataCell">
                          {participant.documentName}
                        </Typography>
                      ) : (
                        <Button
                          variant="text"
                          onClick={() => handleAddDocument(participant)}
                          sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
                        >
                          Add Document
                        </Button>
                      )}
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
        participantId={selectedParticipant?.id || ''}
        onDocumentAdded={handleDocumentAdded}
      />

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleUploadClose} maxWidth="md" fullWidth>
        <DialogTitle>Upload Participant Documents</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <BNFileUpload
              maxFiles={10}
              acceptedFileTypes={['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv']}
              onUpload={handleFileUpload}
              multiple={true}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
