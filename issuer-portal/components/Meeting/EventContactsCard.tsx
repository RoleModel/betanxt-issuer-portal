'use client'

import React, { useState } from 'react'

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
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'

import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'
import StatusChip from '@/components/ui/StatusChip'

import buildApiClient from '@/domain-models/apiClient'

interface ContactInfo {
  role: string
  contact: string
  email?: string
  isPlaceholder?: boolean
}

interface EventContactsCardProps {
  className?: string
  meeting?: {
    id?: string
    transferAgent?: string
    transferAgentConfirmed?: boolean
    planAdministrator?: string
    planAdministratorContactEmail?: string
    solicitor?: string
    solicitorEmail?: string
  }
  onUpdate?: () => void
}

const EventContactsCard: React.FC<EventContactsCardProps> = ({
  className,
  meeting,
  onUpdate,
}) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [transferAgentConfirmation, setTransferAgentConfirmation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Show "Not yet confirmed" if we have a transfer agent value but it hasn't been confirmed
  const showTransferAgentAsUnconfirmed =
    meeting?.transferAgent && !meeting?.transferAgentConfirmed

  const contacts: ContactInfo[] = meeting
    ? [
        {
          role: 'Transfer Agent',
          contact: meeting.transferAgent ?? '',
          isPlaceholder: Boolean(showTransferAgentAsUnconfirmed), // Only show chip if we have data but it's unconfirmed
        },
        {
          role: 'Plan Administrator',
          contact: meeting.planAdministrator ?? '',
          email: meeting.planAdministratorContactEmail,
        },
        {
          role: 'Solicitor Contact Info',
          contact: meeting.solicitor ?? '',
          email: meeting.solicitorEmail,
        },
      ]
    : []

  const handleConfirmClick = () => {
    setTransferAgentConfirmation(meeting?.transferAgent ?? '')
    setConfirmDialogOpen(true)
  }

  const handleDialogClose = () => {
    setConfirmDialogOpen(false)
    setTransferAgentConfirmation('')
  }

  const handleConfirmSubmit = async () => {
    if (!meeting?.id || !transferAgentConfirmation.trim()) {
      return
    }

    try {
      setIsSubmitting(true)
      const client = await buildApiClient()

      await client.PUT('/meetings/{meetingId}', {
        params: {
          path: { meetingId: meeting.id },
        },
        body: {
          transferAgent: transferAgentConfirmation.trim(),
          transferAgentConfirmed: true,
        },
      })

      // Call onUpdate callback if provided to refresh data
      if (onUpdate) {
        onUpdate()
      }

      handleDialogClose()
    } catch (error) {
      console.error('Failed to update transfer agent', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card
      className={className}
      sx={{
        gridArea: 'event-contacts',
        height: 'auto',
        alignSelf: 'start',
      }}
    >
      <CardHeader title={'Event Contacts'} />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Table>
          <SROnlyTableCaption>
            Transfer Agent and Plan Administrator Information
          </SROnlyTableCaption>
          <TableHead aria-hidden="false" sx={{ visibility: 'hidden', display: 'none' }}>
            <TableRow>
              <TableCell>Role</TableCell>
              <TableCell align="right">Contact</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact, index) => (
              <TableRow key={index}>
                <TableCell>{contact.role}</TableCell>
                <TableCell align="right">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ textAlign: 'right' }}>
                      <Box component="div">
                        {contact.isPlaceholder ? (
                          <StatusChip
                            status="Not yet confirmed"
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              backgroundColor: (theme) => theme.palette.error.dark,
                              color: (theme) => theme.palette.error.contrastText,
                            }}
                          />
                        ) : (
                          (contact.contact ?? '—')
                        )}
                      </Box>
                      {contact.email && (
                        <Link href={`mailto:${contact.email}`}>{contact.email}</Link>
                      )}
                    </Box>
                    {contact.role === 'Transfer Agent' && contact.isPlaceholder && (
                      <Button
                        variant="text"
                        onClick={handleConfirmClick}
                        sx={{ minWidth: 'fit-content', flexShrink: 0 }}
                      >
                        Confirm
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Transfer Agent Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Transfer Agent</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Transfer Agent"
            fullWidth
            variant="outlined"
            value={transferAgentConfirmation}
            onChange={(e) => setTransferAgentConfirmation(e.target.value)}
            helperText="Please confirm or update the transfer agent information"
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleDialogClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            variant="contained"
            disabled={isSubmitting || !transferAgentConfirmation.trim()}
          >
            {isSubmitting ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default EventContactsCard
