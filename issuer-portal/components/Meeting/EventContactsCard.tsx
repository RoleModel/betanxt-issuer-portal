'use client'

import React from 'react'

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'

import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'

interface ContactInfo {
  role: string
  contact: string
  email?: string
  isPlaceholder?: boolean
}

interface EventContactsCardProps {
  className?: string
  meeting?: {
    transferAgent?: string
    planAdministrator?: string
    planAdministratorContactEmail?: string
    solicitor?: string
    solicitorEmail?: string
  }
}

const EventContactsCard: React.FC<EventContactsCardProps> = ({ className, meeting }) => {
  const contacts: ContactInfo[] = meeting
    ? [
        {
          role: 'Transfer Agent',
          contact: meeting.transferAgent || '',
        },
        {
          role: 'Plan Administrator',
          contact: meeting.planAdministrator || '',
          email: meeting.planAdministratorContactEmail,
        },
        {
          role: 'Solicitor Contact Info',
          contact: meeting.solicitor || '',
          email: meeting.solicitorEmail,
        },
      ]
    : []

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
                  <Box>
                    <Box component="div" mb={contact.email ? 0.5 : 0}>
                      {contact.contact || '—'}
                    </Box>
                    {contact.email && <Box component="div">{contact.email}</Box>}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default EventContactsCard
