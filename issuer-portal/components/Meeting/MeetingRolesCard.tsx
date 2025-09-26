'use client'

import React, { useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'
import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'

import { useDocuments } from '@/contexts/DocumentContext'

interface MeetingAccessItem {
  label: string
  type: 'toggle' | 'contact' | 'upload'
  value?: boolean
  contact?: {
    name: string
    email: string
  }
  fileFormat?: string
  fileDescription?: string
}

interface MeetingRolesCardProps {
  className?: string
  meetingId?: string
}

const MeetingRolesCard: React.FC<MeetingRolesCardProps> = ({ className, meetingId }) => {
  const [dsm, setDsm] = useState(true)
  const [ioe, setIoe] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadType, setUploadType] = useState<string>('')
  const { uploadDocument } = useDocuments()

  // Mock data matching the Figma design
  const accessItems: MeetingAccessItem[] = [
    {
      label: 'DSM',
      type: 'toggle',
      value: dsm,
    },
    {
      label: 'DSM Producer',
      type: 'contact',
      contact: {
        name: 'Tim Burton',
        email: 'tim.burton@betanxt.com',
      },
    },
    {
      label: 'IOE',
      type: 'toggle',
      value: ioe,
    },
    {
      label: 'Inspector',
      type: 'contact',
      contact: {
        name: 'Marsha Waters',
        email: 'marsh.waters@betanxt.com',
      },
    },
    {
      label: 'Speaker List',
      type: 'upload',
      fileFormat: '.xls',
      fileDescription: '(First name, last name, email)',
    },
    {
      label: 'Guest Link Registration',
      type: 'upload',
      fileFormat: '.xls',
      fileDescription: '(First name, last name, email)',
    },
  ]

  const handleToggle = (label: string, newValue: boolean) => {
    if (label === 'DSM') {
      setDsm(newValue)
    } else if (label === 'IOE') {
      setIoe(newValue)
    }
  }

  const handleUpload = (label: string) => {
    setUploadType(label)
    setUploadDialogOpen(true)
  }

  const handleUploadComplete = async (
    files: File[],
    associations?: { [fileId: string]: string }
  ) => {
    if (!meetingId) return
    try {
      // Create associations based on upload type to link to DSM placeholders
      const typeAssociations: { [fileId: string]: string } = {}

      files.forEach((file, index) => {
        const fileId = `file_${index}`
        if (uploadType === 'Speaker List') {
          typeAssociations[fileId] = 'placeholder-speaker-list'
        } else if (uploadType === 'Guest Link Registration') {
          typeAssociations[fileId] = 'placeholder-guest-registration'
        }
      })

      // Merge with any existing associations
      const finalAssociations = { ...associations, ...typeAssociations }

      await uploadDocument(meetingId, files, 'dsm-document', finalAssociations)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  return (
    <Card className={className}>
      <CardHeader title="Meeting Roles, Contacts & Access" />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Table>
          <SROnlyTableCaption>
            Meeting roles, contacts, and file uploads for access management.
          </SROnlyTableCaption>
          <TableHead aria-hidden="false" sx={{ visibility: 'hidden', display: 'none' }}>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Value/Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accessItems.map((item, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:not(:last-child)': {
                    borderBottom: '1px solid rgba(31,30,28,0.12)',
                  },
                }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body2">{item.label}</Typography>
                    {item.fileDescription && (
                      <Typography variant="caption" color="text.secondary">
                        {item.fileFormat} {item.fileDescription}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {item.type === 'toggle' && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 1,
                      }}
                    >
                      <Switch
                        checked={item.value || false}
                        onChange={(e) => handleToggle(item.label, e.target.checked)}
                        size="small"
                      />
                      <Typography variant="body2">Yes</Typography>
                    </Box>
                  )}

                  {item.type === 'contact' && item.contact && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {item.contact.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="primary"
                        sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        {item.contact.email}
                      </Typography>
                    </Box>
                  )}

                  {item.type === 'upload' && (
                    <Button variant="text" onClick={() => handleUpload(item.label)}>
                      Upload
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUploadComplete}
        meetingId={meetingId}
        documentType={uploadType}
      />
    </Card>
  )
}

export default MeetingRolesCard
