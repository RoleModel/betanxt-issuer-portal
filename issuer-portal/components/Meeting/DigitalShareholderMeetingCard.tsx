'use client'

import React, { useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'

import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'
import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'

import { useDocuments } from '@/contexts/DocumentContext'

interface DigitalShareholderMeetingCardProps {
  className?: string
  meetingId?: string
}

const DigitalShareholderMeetingCard: React.FC<DigitalShareholderMeetingCardProps> = ({
  className,
  meetingId,
}) => {
  const [liveQA, setLiveQA] = useState(true)
  const [audioOnly, setAudioOnly] = useState(true)
  const [meetingRecording, setMeetingRecording] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadType, setUploadType] = useState<string>('')
  const { uploadDocument } = useDocuments()

  const handleUpload = (type: string) => {
    setUploadType(type)
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
        if (uploadType === 'Static Slide or Presentation') {
          typeAssociations[fileId] = 'placeholder-static-slide'
        } else if (uploadType === 'Documents to Display') {
          typeAssociations[fileId] = 'placeholder-documents-display'
        }
      })

      // Merge with any existing associations
      const finalAssociations = { ...associations, ...typeAssociations }

      await uploadDocument(meetingId, files, 'dsm-document', finalAssociations)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const configOptions = [
    {
      label: 'Live Written Q&A during the Meeting?',
      value: liveQA,
      onChange: setLiveQA,
      action: 'View Last Year',
    },
    {
      label: 'Audio only (no video)?',
      value: audioOnly,
      onChange: setAudioOnly,
      action: 'View Last Year',
    },
    {
      label: 'Static Slide or Presentation?',
      action: 'View Last Year',
      rightAction: 'Upload',
      onUpload: () => handleUpload('Static Slide or Presentation'),
    },
    {
      label: 'Documents to Display?',
      action: 'View Last Year',
      rightAction: 'Upload',
      onUpload: () => handleUpload('Documents to Display'),
    },
    {
      label: 'Meeting Recording?',
      value: meetingRecording,
      onChange: setMeetingRecording,
      action: 'View Last Year',
    },
  ]

  return (
    <Card className={className}>
      <CardHeader title="Digital Shareholder Meeting Information" />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Table>
          <SROnlyTableCaption>
            Digital meeting configuration options and settings.
          </SROnlyTableCaption>
          <TableHead aria-hidden="false" sx={{ visibility: 'hidden', display: 'none' }}>
            <TableRow>
              <TableCell>Option</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configOptions.map((option, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:not(:last-child)': {
                    borderBottom: '1px solid rgba(31,30,28,0.12)',
                  },
                }}
              >
                <TableCell>{option.label}</TableCell>
                {option.action && (
                  <TableCell align="right">
                    <Button variant="text" sx={{ textTransform: 'none' }}>
                      {option.action}
                    </Button>
                  </TableCell>
                )}
                <TableCell align="right">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 1,
                    }}
                  >
                    {option.rightAction && (
                      <Button
                        variant="text"
                        sx={{ textTransform: 'none' }}
                        onClick={option.onUpload}
                      >
                        {option.rightAction}
                      </Button>
                    )}
                    {option.value !== undefined && option.onChange && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={option.value}
                          onChange={(e) => option.onChange!(e.target.checked)}
                        />
                        <span>Yes</span>
                      </Box>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button variant="outlined" sx={{ textTransform: 'none' }}>
          Confirm
        </Button>
      </CardActions>

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

export default DigitalShareholderMeetingCard
