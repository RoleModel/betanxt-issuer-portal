'use client'

import React, { Suspense, lazy, useCallback, useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  LinearProgress,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'

import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'
import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'

import buildApiClient from '@/domain-models/apiClient'
import { components } from '@/domain-models/generated-schema'

import { useDocuments } from '@/contexts/DocumentContext'

const DocumentViewer = lazy(() => import('@/components/Documents/DocumentViewer'))

type Document = components['schemas']['Document']

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
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const { uploadDocument } = useDocuments()

  // Extract year from meeting ID to find previous year's meeting
  const getPreviousYearMeetingId = useCallback(
    (currentMeetingId: string | undefined): string | null => {
      if (!currentMeetingId) return null

      // Parse meeting ID format: "ticker-meeting-type-year"
      const parts = currentMeetingId.split('-')
      if (parts.length < 3) return null

      const yearStr = parts[parts.length - 1]
      const year = parseInt(yearStr, 10)

      if (isNaN(year)) return null

      // Construct previous year meeting ID
      const previousYear = year - 1
      parts[parts.length - 1] = previousYear.toString()
      return parts.join('-')
    },
    []
  )

  const handleViewLastYear = useCallback(
    async (docType: string) => {
      const previousMeetingId = getPreviousYearMeetingId(meetingId)
      if (!previousMeetingId) {
        console.warn('No previous year meeting found')
        return
      }

      try {
        const apiClient = await buildApiClient()
        const { data } = await apiClient.GET('/meetings/{meetingId}/documents', {
          params: { path: { meetingId: previousMeetingId } },
        })

        if (!data) {
          console.warn('No documents found for previous year')
          return
        }

        const documents = data as Document[]
        if (Array.isArray(documents)) {
          // Filter for DSM documents based on type
          const dsmDocs = documents.filter((doc) => {
            const docTypeNorm = doc.type?.toLowerCase() || ''
            const titleNorm = doc.title?.toLowerCase() || ''

            if (docType === 'Live Written Q&A') {
              return (
                docTypeNorm.includes('q&a') ||
                titleNorm.includes('q&a') ||
                titleNorm.includes('questions')
              )
            } else if (docType === 'Audio only') {
              return docTypeNorm.includes('audio') || titleNorm.includes('audio')
            } else if (docType === 'Static Slide or Presentation') {
              return (
                docTypeNorm.includes('slide') ||
                docTypeNorm.includes('presentation') ||
                titleNorm.includes('slide') ||
                titleNorm.includes('presentation')
              )
            } else if (docType === 'Documents to Display') {
              return doc.displayCategory === 'dsm' || docTypeNorm.includes('display')
            } else if (docType === 'Meeting Recording') {
              return (
                docTypeNorm.includes('recording') ||
                docTypeNorm.includes('archive') ||
                titleNorm.includes('recording') ||
                titleNorm.includes('archive')
              )
            }
            return false
          })

          if (dsmDocs.length > 0 && dsmDocs[0]?.filePath) {
            // Open the document in DocumentViewer
            setSelectedDocument(dsmDocs[0])
            setDocumentViewerOpen(true)
          } else {
            console.warn(`No ${docType} documents found for previous year`)
          }
        }
      } catch (error) {
        console.error('Failed to fetch previous year documents:', error)
      }
    },
    [meetingId, getPreviousYearMeetingId]
  )

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
      onViewLastYear: () => handleViewLastYear('Live Written Q&A'),
    },
    {
      label: 'Audio only (no video)?',
      value: audioOnly,
      onChange: setAudioOnly,
      action: 'View Last Year',
      onViewLastYear: () => handleViewLastYear('Audio only'),
    },
    {
      label: 'Static Slide or Presentation?',
      action: 'View Last Year',
      rightAction: 'Upload',
      onUpload: () => handleUpload('Static Slide or Presentation'),
      onViewLastYear: () => handleViewLastYear('Static Slide or Presentation'),
    },
    {
      label: 'Documents to Display?',
      action: 'View Last Year',
      rightAction: 'Upload',
      onUpload: () => handleUpload('Documents to Display'),
      onViewLastYear: () => handleViewLastYear('Documents to Display'),
    },
    {
      label: 'Meeting Recording?',
      value: meetingRecording,
      onChange: setMeetingRecording,
      action: 'View Last Year',
      onViewLastYear: () => handleViewLastYear('Meeting Recording'),
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
                    <Button
                      variant="text"
                      sx={{ textTransform: 'none' }}
                      onClick={option.onViewLastYear}
                    >
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

      {selectedDocument && selectedDocument.filePath && (
        <Suspense fallback={<LinearProgress />}>
          <DocumentViewer
            open={documentViewerOpen}
            onClose={() => {
              setDocumentViewerOpen(false)
              setSelectedDocument(null)
            }}
            fileUrl={selectedDocument.filePath}
            title={selectedDocument.title}
            documentId={selectedDocument.id}
          />
        </Suspense>
      )}
    </Card>
  )
}

export default DigitalShareholderMeetingCard
