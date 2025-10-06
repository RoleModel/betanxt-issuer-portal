'use client'

import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react'

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
  Tooltip,
  Typography,
} from '@mui/material'

import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'
import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { useDocuments } from '@/contexts/DocumentContext'

const DocumentViewer = lazy(() => import('@/components/Documents/DocumentViewer'))

type Document = components['schemas']['Document']

interface DSMConfig {
  meetingId: string
  liveQa: boolean
  audioOnly: boolean
  meetingRecording: boolean
  staticSlideDocId?: string
  displayDocsDocId?: string
  isConfirmed: boolean
}

interface DigitalShareholderMeetingCardProps {
  className?: string
  meetingId?: string
}

const DigitalShareholderMeetingCard: React.FC<DigitalShareholderMeetingCardProps> = ({
  className,
  meetingId,
}) => {
  const [liveQA, setLiveQA] = useState(false)
  const [audioOnly, setAudioOnly] = useState(false)
  const [meetingRecording, setMeetingRecording] = useState(false)
  const [_isConfirmed, setIsConfirmed] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadType, setUploadType] = useState<string>('')
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [previousYearAvailability, setPreviousYearAvailability] = useState<
    Record<string, boolean>
  >({})
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

  // Fetch existing DSM config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      if (!meetingId) return

      try {
        setIsLoading(true)
        const _apiClient = await buildApiClient()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/meetings/${meetingId}/dsm-config`
        )

        if (response.ok) {
          const data = (await response.json()) as DSMConfig
          setLiveQA(data.liveQa || false)
          setAudioOnly(data.audioOnly || false)
          setMeetingRecording(data.meetingRecording || false)
          setIsConfirmed(data.isConfirmed || false)

          // If already confirmed, start in view mode
          if (data.isConfirmed) {
            setIsEditMode(false)
          } else {
            setIsEditMode(true)
          }
        }
      } catch (error) {
        console.error('Failed to fetch DSM config:', error)
        // Start in edit mode if fetch fails
        setIsEditMode(true)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchConfig()
  }, [meetingId])

  // Check availability of previous year documents
  useEffect(() => {
    const checkPreviousYearDocs = async () => {
      const previousMeetingId = getPreviousYearMeetingId(meetingId)
      if (!previousMeetingId) {
        setPreviousYearAvailability({})
        return
      }

      try {
        const apiClient = await buildApiClient()
        const { data } = await apiClient.GET('/meetings/{meetingId}/documents', {
          params: { path: { meetingId: previousMeetingId } },
        })

        if (!data) {
          setPreviousYearAvailability({})
          return
        }

        const documents = data as Document[]
        const availability: Record<string, boolean> = {}

        const docTypes = [
          'Live Written Q&A',
          'Audio only',
          'Static Slide or Presentation',
          'Documents to Display',
          'Meeting Recording',
        ]

        docTypes.forEach((docType) => {
          const hasDoc = documents.some((doc) => {
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

          availability[docType] = hasDoc
        })

        setPreviousYearAvailability(availability)
      } catch (error) {
        console.error('Failed to check previous year documents:', error)
        setPreviousYearAvailability({})
      }
    }

    void checkPreviousYearDocs()
  }, [meetingId, getPreviousYearMeetingId])

  // Save DSM config to database
  const saveConfig = async () => {
    if (!meetingId) return

    try {
      setIsLoading(true)
      const config: DSMConfig = {
        meetingId,
        liveQa: liveQA,
        audioOnly,
        meetingRecording,
        isConfirmed: true,
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/meetings/${meetingId}/dsm-config`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        }
      )

      if (response.ok) {
        setIsConfirmed(true)
        setIsEditMode(false)
      } else {
        const errorText = await response.text()
        console.error('Failed to save DSM config:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error saving DSM config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle edit button click
  const handleEdit = () => {
    setIsEditMode(true)
  }

  // Handle cancel edit
  const handleCancel = async () => {
    // Reload original values
    if (!meetingId) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/meetings/${meetingId}/dsm-config`
      )

      if (response.ok) {
        const data = (await response.json()) as DSMConfig
        setLiveQA(data.liveQa || false)
        setAudioOnly(data.audioOnly || false)
        setMeetingRecording(data.meetingRecording || false)
        setIsConfirmed(data.isConfirmed || false)
      }
    } catch (error) {
      console.error('Failed to reload DSM config:', error)
    }

    setIsEditMode(false)
  }

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
    associations?: Record<string, string>
  ) => {
    if (!meetingId) return
    try {
      // Create associations based on upload type to link to DSM placeholders
      // Use the actual placeholder title (not ID) so documents match for replacement
      const typeAssociations: Record<string, string> = {}

      files.forEach((file, index) => {
        const fileId = `file_${index}`
        if (uploadType === 'Static Slide or Presentation') {
          typeAssociations[fileId] = 'Static Slide or Presentation'
        } else if (uploadType === 'Documents to Display') {
          typeAssociations[fileId] = 'Documents to Display'
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
      docType: 'Live Written Q&A',
      value: liveQA,
      onChange: setLiveQA,
      action: 'View Last Year',
      onViewLastYear: () => handleViewLastYear('Live Written Q&A'),
    },
    {
      label: 'Audio only (no video)?',
      docType: 'Audio only',
      value: audioOnly,
      onChange: setAudioOnly,
      action: 'View Last Year',
      onViewLastYear: () => handleViewLastYear('Audio only'),
    },
    {
      label: 'Static Slide or Presentation?',
      docType: 'Static Slide or Presentation',
      action: 'View Last Year',
      rightAction: 'Upload',
      onUpload: () => handleUpload('Static Slide or Presentation'),
      onViewLastYear: () => handleViewLastYear('Static Slide or Presentation'),
    },
    {
      label: 'Documents to Display?',
      docType: 'Documents to Display',
      action: 'View Last Year',
      rightAction: 'Upload',
      onUpload: () => handleUpload('Documents to Display'),
      onViewLastYear: () => handleViewLastYear('Documents to Display'),
    },
    {
      label: 'Meeting Recording?',
      docType: 'Meeting Recording',
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
                <TableCell align="right">
                  {option.action && (
                    <Tooltip
                      title={
                        !previousYearAvailability[option.docType]
                          ? 'No previous year document available'
                          : ''
                      }
                      arrow
                    >
                      <span>
                        <Button
                          variant="text"
                          sx={{ textTransform: 'none' }}
                          onClick={option.onViewLastYear}
                          disabled={!previousYearAvailability[option.docType]}
                        >
                          {option.action}
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
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
                        disabled={!isEditMode}
                      >
                        {option.rightAction}
                      </Button>
                    )}
                    {option.value !== undefined && option.onChange && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isEditMode ? (
                          <>
                            <Switch
                              size="small"
                              checked={option.value}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                option.onChange(e.target.checked)
                              }
                              slotProps={{
                                input: { 'aria-label': 'Yes or No' },
                              }}
                            />
                            <Typography variant="body3">No</Typography>
                          </>
                        ) : (
                          <Typography variant="body3">
                            {option.value ? 'Yes' : 'No'}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', gap: 1 }}>
        {isEditMode ? (
          <>
            {_isConfirmed && (
              <Button
                variant="text"
                sx={{ textTransform: 'none' }}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="outlined"
              sx={{ textTransform: 'none' }}
              onClick={saveConfig}
              disabled={isLoading}
            >
              Confirm
            </Button>
          </>
        ) : (
          <Button variant="outlined" sx={{ textTransform: 'none' }} onClick={handleEdit}>
            Edit
          </Button>
        )}
      </CardActions>

      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUploadComplete}
        meetingId={meetingId}
        documentType={uploadType}
      />

      {selectedDocument?.filePath && (
        <Suspense fallback={<LinearProgress />}>
          <DocumentViewer
            open={documentViewerOpen}
            onClose={() => {
              setDocumentViewerOpen(false)
              setSelectedDocument(null)
            }}
            fileUrl={selectedDocument.filePath}
            documentId={selectedDocument.id}
            title={selectedDocument.title || 'Previous Year Document'}
            hideActivityButtons={true}
          />
        </Suspense>
      )}
    </Card>
  )
}

export default DigitalShareholderMeetingCard
