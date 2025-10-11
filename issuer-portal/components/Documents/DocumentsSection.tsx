/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

'use client'

import dynamic from 'next/dynamic'
import React, { Suspense, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

import { SmartDisplayOutlined } from '@mui/icons-material'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import DSMDocuments from '@/components/Documents/DSMDocuments'
import DocumentSiteCard from '@/components/Documents/DocumentSiteCard'
import DocumentsTable from '@/components/Documents/DocumentsTable'
import EmptyState from '@/components/EmptyState'
import SkeletonTable from '@/components/ui/SkeletonTable'

import type { components } from '@/domain-models/generated-schema'

import { useDocuments } from '@/contexts/DocumentContext'
import { useMeeting } from '@/contexts/MeetingContext'
import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import type {
  ExtendedDocumentStatus} from '@/utils/documentUtils';
import {
  DOCUMENT_STATUS_VALUES,
  getDocumentStatusLabel,
  getStoragePublicUrl,
} from '@/utils/documentUtils'

/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

type Document = Omit<components['schemas']['Document'], 'status'> & {
  status?: ExtendedDocumentStatus
}

// Dynamic imports for heavy document components to enable route-based code splitting
const ApprovalDrawer = dynamic(() => import('@/components/Drawers/ApprovalDrawer'), {
  ssr: false,
})

const DocumentViewer = dynamic(() => import('@/components/Documents/DocumentViewer'), {
  ssr: false,
})

const FileUploadDialog = dynamic(
  () => import('@/components/FileUpload/FileUploadDialog'),
  {
    ssr: false,
  }
)

const VideoPlayerDialog = dynamic(() => import('@/components/Video/VideoPlayerDialog'), {
  ssr: false,
})

interface DocumentsPageProps {
  params: Promise<{
    meetingId: string
  }>
}

interface ParsedProposal {
  proposalNumber: number
  proposalTitle: string
  proposalType: string
  proposalSubtype?: string
  directorName?: string
  recommendation: string
}

type ExcelRow = Record<string, string | number | boolean | Date | undefined>;

export default function DocumentsPage({ params }: DocumentsPageProps) {
  React.use(params) // Consume params but don't store
  const { currentMeeting } = useMeeting()
  const {
    documents: regularDocuments,
    dsmDocuments,
    loading,
    error,
    refreshDocuments,
    uploadDocument,
  } = useDocuments()
  const { uploadProposals } = useVotingTabulation(currentMeeting?.id ?? '')

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dsmPage, setDsmPage] = useState(0)
  const [dsmRowsPerPage, setDsmRowsPerPage] = useState(6)
  const previousMeetingIdRef = React.useRef<string | null>(null)

  // Calculate DSM progress
  const dsmProgress = React.useMemo(() => {
    // Count documents that have been uploaded (have filePath)
    const uploadedDsm = dsmDocuments.filter((doc) => doc.filePath).length
    const totalRequired = 6 // Number of placeholders defined below
    return {
      uploaded: uploadedDsm,
      totalRequired,
      percentage: totalRequired > 0 ? (uploadedDsm / totalRequired) * 100 : 0,
    }
  }, [dsmDocuments])

  // ApprovalDrawer state
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  // FileUploadDialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDsmDocument, setSelectedDsmDocument] = useState<Document | null>(null)
  const [uploadSource, setUploadSource] = useState<'regular' | 'dsm'>('regular')

  // DocumentViewer state for fullscreen view
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)

  // VideoPlayerDialog state
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)

  // Set active meeting based on URL parameter
  // Meeting is set by layout - no need to set it again here

  // Fetch documents from API when meeting changes
  useEffect(() => {
    if (currentMeeting?.id && previousMeetingIdRef.current !== currentMeeting.id) {
      previousMeetingIdRef.current = currentMeeting.id
      void refreshDocuments(currentMeeting.id)
    }
  }, [currentMeeting?.id, refreshDocuments])

  // Refresh documents when page gains focus or becomes visible
  useEffect(() => {
    let isInitialMount = true

    const handleFocus = () => {
      if (isInitialMount) {
        isInitialMount = false
        return
      }
      if (currentMeeting?.id) {
        void refreshDocuments(currentMeeting.id)
      }
    }

    const handleVisibilityChange = () => {
      if (isInitialMount) {
        isInitialMount = false
        return
      }
      if (!document.hidden && currentMeeting?.id) {
        void refreshDocuments(currentMeeting.id)
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentMeeting?.id, refreshDocuments])

  // Helper to normalize raw status values from API / placeholders.
  const normalizeStatus = React.useCallback(
    (raw: unknown): ExtendedDocumentStatus | 'UNKNOWN' => {
      if (!raw || typeof raw !== 'string') return 'NOT_UPLOADED'
      if ((DOCUMENT_STATUS_VALUES as readonly string[]).includes(raw))
        return raw as ExtendedDocumentStatus
      if (raw === 'NOT_UPLOADED') return 'NOT_UPLOADED'
      return 'UNKNOWN'
    },
    []
  )

  // Derive unique normalized statuses present in the dataset.
  const availableStatuses = React.useMemo(() => {
    const set = new Set<string>()
    regularDocuments.forEach((doc) => {
      set.add(normalizeStatus(doc.status))
    })
    // Ensure NOT_UPLOADED present if there are documents with no status
    if (regularDocuments.some((d) => !d.status)) set.add('NOT_UPLOADED')
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [regularDocuments, normalizeStatus])

  // Filter documents based on search and selected (normalized) status
  const filteredDocuments = regularDocuments.filter((doc) => {
    const matchesSearch =
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false
    const normalized = normalizeStatus(doc.status)
    const matchesStatus = statusFilter === 'All' || normalized === statusFilter
    return matchesSearch && matchesStatus
  })

  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredDocuments.length) : 0

  // DSM pagination empty rows
  const dsmEmptyRows =
    dsmPage > 0 ? Math.max(0, (1 + dsmPage) * dsmRowsPerPage - dsmDocuments.length) : 0

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage)
  }
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // DSM Pagination handlers
  const handleDsmChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setDsmPage(newPage)
  }

  const handleDsmChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setDsmRowsPerPage(parseInt(event.target.value, 10))
    setDsmPage(0)
  }

  const handleUpload = () => {
    setUploadSource('regular')
    setUploadDialogOpen(true)
  }

  const handleDsmUpload = () => {
    setUploadSource('dsm')
    setUploadDialogOpen(true)
  }

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false)
    setSelectedDsmDocument(null) // Clear selected document when closing
    setUploadSource('regular') // Reset to default
  }

  // Parse Excel/CSV file for agenda proposals
  const parseAgendaFile = async (file: File): Promise<ParsedProposal[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(firstSheet)

          if (jsonData.length === 0) {
            reject(new Error('The file is empty or has no data rows'))
            return
          }

          // Map the data to our format
          const mappedData = jsonData
            .map((row: ExcelRow) => {
              const proposalNumber = row['Proposal Number'] ?? row.Number ?? ''
              const proposalTitle = row['Proposal Title'] ?? row.Title ?? ''
              const proposalType = row['Proposal Type'] ?? row.Type ?? ''
              const proposalSubtype = row['Proposal Subtype'] ?? row.Subtype ?? ''
              const directorName = row['Director Name'] ?? row.Director ?? ''
              const recommendation = row.Recommendation ?? ''

              // Skip rows without required fields
              if (!proposalNumber || !proposalTitle) {
                return null
              }

              const parsedProposal: ParsedProposal = {
                proposalNumber:
                  typeof proposalNumber === 'number'
                    ? proposalNumber
                    : parseFloat(proposalNumber as string) || 0,
                proposalTitle: String(proposalTitle),
                proposalType: String(proposalType),
                recommendation: String(recommendation),
              }

              if (proposalSubtype) {
                parsedProposal.proposalSubtype = String(proposalSubtype)
              }

              if (directorName) {
                parsedProposal.directorName = String(directorName)
              }

              return parsedProposal
            })
            .filter((item): item is ParsedProposal => item !== null)

          if (mappedData.length === 0) {
            reject(new Error('No valid proposal data found in file'))
            return
          }

          resolve(mappedData)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  const handleFilesUpload = async (
    files: File[],
    associations?: Record<string, string>
  ) => {
    if (!currentMeeting?.id) {
      console.error('No current meeting ID')
      return
    }
    try {
      // Check if this is an Agenda upload with Excel/CSV file
      const isAgendaUpload = selectedDsmDocument?.title === 'Agenda'
      const file = files[0]
      const isExcelOrCsv =
        file &&
        (file.type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'text/csv' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls') ||
          file.name.endsWith('.csv'))

      if (isAgendaUpload && isExcelOrCsv) {
        // Parse and upload as proposals
        const proposals = await parseAgendaFile(file)
        await uploadProposals(proposals)
        setUploadDialogOpen(false)
        setSelectedDsmDocument(null)
      } else {
        // Determine document type based on upload source
        const documentType = uploadSource === 'dsm' ? 'dsm-document' : 'general-document'
        // Upload as document
        await uploadDocument(currentMeeting.id, files, documentType, associations)
      }
      setUploadDialogOpen(false)
      setSelectedDsmDocument(null)
    } catch (error) {
      console.error('Upload error:', error)
      // Error is already handled by the context
    }
  }

  const handleDocumentAction = (doc: Document) => {
    // If this is a placeholder DSM document not yet uploaded, route to upload
    if (doc.status === 'NOT_UPLOADED') {
      setSelectedDsmDocument(doc)
      setUploadDialogOpen(true)
      return
    }
    setSelectedDocument(doc)
    setApprovalDrawerOpen(true)
  }

  const handleApprovalDrawerClose = () => {
    setApprovalDrawerOpen(false)
    setSelectedDocument(null)
  }

  const handleOpenFullscreen = () => {
    // Close approval drawer first, then open document viewer
    setApprovalDrawerOpen(false)
    // Use setTimeout to ensure approval drawer closes before document viewer opens
    setTimeout(() => {
      setDocumentViewerOpen(true)
    }, 50)
  }

  const handleDocumentViewerClose = () => {
    setDocumentViewerOpen(false)
  }

  const handleApproveDocument = async () => {
    if (!selectedDocument) return

    try {
      // TODO: Implement document approval via API
      handleApprovalDrawerClose()
      if (currentMeeting?.id) {
        await refreshDocuments(currentMeeting.id)
      }
    } catch {
      // Handle error
    }
  }

  // Show error state
  if (error) {
    return (
      <Box component="main" display="flex" flexDirection="column" gap={3} sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    )
  }

  return (
    <>
      <Suspense>
        <Container component="main" maxWidth="xl">
          <Box
            component="main"
            display="flex"
            flexDirection="column"
            gap={3}
            sx={{ p: { xs: 1, sm: 3 } }}
          >
            {/* Main Documents Section */}
            <Card>
              <CardHeader
                title="Documents"
                action={
                  <Button
                    variant="contained"
                    startIcon={<FileUploadOutlinedIcon />}
                    onClick={handleUpload}
                  >
                    Upload
                  </Button>
                }
                avatar={
                  <IconButton
                    onClick={() => setVideoDialogOpen(true)}
                    aria-label="Watch tutorial"
                    sx={{
                      '&:hover': {
                        backgroundColor: (theme) => theme.vars.palette.action.hover,
                      },
                    }}
                  >
                    <SmartDisplayOutlined />
                  </IconButton>
                }
              />

              <CardContent sx={{ p: 0 }}>
                {/* Search and Filter Bar */}

                {loading ? (
                  <SkeletonTable rows={5} columns={4} />
                ) : filteredDocuments.length === 0 ? (
                  <EmptyState
                    title="No documents"
                    description={
                      searchQuery || statusFilter !== 'All'
                        ? 'No documents match your search criteria.'
                        : 'Upload documents to get started.'
                    }
                    minHeight={300}
                  />
                ) : (
                  <>
                    <Box sx={{ mb: 2, px: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                          placeholder="Search Documents"
                          size="small"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          sx={{ minWidth: 250 }}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={statusFilter}
                            aria-label="Status Filter"
                            onChange={(e) => setStatusFilter(e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="All">All</MenuItem>
                            {availableStatuses.map((status) => {
                              const label =
                                status === 'UNKNOWN'
                                  ? 'Unknown'
                                  : getDocumentStatusLabel(
                                      (status as ExtendedDocumentStatus) || 'NOT_UPLOADED'
                                    )
                              return (
                                <MenuItem key={status} value={status}>
                                  {label}
                                </MenuItem>
                              )
                            })}
                          </Select>
                        </FormControl>
                      </Stack>
                    </Box>
                    <DocumentsTable
                      documents={filteredDocuments}
                      page={page}
                      rowsPerPage={rowsPerPage}
                      emptyRows={emptyRows}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      onOpenDocument={handleDocumentAction}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid size={{ xs: 12, md: 8 }}>
                {loading ? (
                  <SkeletonTable rows={5} columns={4} />
                ) : (
                  <DSMDocuments
                    dsmDocuments={dsmDocuments}
                    dsmPage={dsmPage}
                    dsmRowsPerPage={dsmRowsPerPage}
                    dsmEmptyRows={dsmEmptyRows}
                    dsmProgress={dsmProgress}
                    onUpload={handleDsmUpload}
                    onPageChange={handleDsmChangePage}
                    onRowsPerPageChange={handleDsmChangeRowsPerPage}
                    onOpenDocument={handleDocumentAction}
                    onOpenUploadFor={(doc) => {
                      setSelectedDsmDocument(doc)
                      setUploadSource('dsm')
                      setUploadDialogOpen(true)
                    }}
                    placeholders={[
                      {
                        id: 'placeholder-static-agenda',
                        title: 'Agenda',
                      },
                      {
                        id: 'placeholder-static-slide',
                        title: 'Static Slide or Presentation',
                      },
                      {
                        id: 'placeholder-documents-display',
                        title: 'Documents to Display',
                      },
                      { id: 'placeholder-speaker-list', title: 'Speaker List' },
                      {
                        id: 'placeholder-guest-registration',
                        title: 'Guest Link Registration',
                      },
                      {
                        id: 'placeholder-rules',
                        title: '2025 Virtual Annual Meeting Rules of Conduct',
                      },
                      {
                        id: 'placeholder-forward-looking',
                        title: 'Forward Looking Statements',
                      },
                    ]}
                  />
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <DocumentSiteCard />
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Suspense>
      {selectedDocument && (
        <ApprovalDrawer
          open={approvalDrawerOpen}
          onClose={handleApprovalDrawerClose}
          title={selectedDocument.title ?? 'Document'}
          fileUrl={getStoragePublicUrl(selectedDocument.filePath ?? '')}
          documentId={selectedDocument.id}
          onApprove={handleApproveDocument}
          taskStatus={selectedDocument.status}
          onOpenFullscreen={handleOpenFullscreen}
          onAddComment={() => {}}
        />
      )}

      {/* FileUploadDialog for uploading documents */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        onUpload={handleFilesUpload}
        meetingId={currentMeeting?.id}
        documentType="dsm-document"
        preSelectedDocumentId={selectedDsmDocument?.title}
      />

      {/* Hosting site UI moved to DocumentSiteCard */}

      {/* DocumentViewer for fullscreen document view */}
      {selectedDocument && (
        <DocumentViewer
          open={documentViewerOpen}
          onClose={handleDocumentViewerClose}
          fileUrl={getStoragePublicUrl(selectedDocument.filePath ?? '')}
          title={selectedDocument.title ?? 'Document'}
          documentId={selectedDocument.id}
        />
      )}

      {/* VideoPlayerDialog for tutorial */}
      <VideoPlayerDialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        title="Uploading and Managing Documents"
        description="Learn how to manage and upload documents for your meeting"
        seriesNumber="#3"
      />
    </>
  )
}
