/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

'use client'

import dynamic from 'next/dynamic'
import React, { Suspense, useEffect, useState } from 'react'

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
  InputAdornment,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import DSMDocuments from '@/components/Documents/DSMDocuments'
import DocumentSiteCard from '@/components/Documents/DocumentSiteCard'
import DocumentsTable from '@/components/Documents/DocumentsTable'

import { components } from '@/domain-models/generated-schema'

import { useDocuments } from '@/contexts/DocumentContext'
import { useMeeting } from '@/contexts/MeetingContext'
import { ExtendedDocumentStatus } from '@/utils/documentUtils'

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

/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

// Dynamic imports for heavy document components to enable route-based code splitting
const ApprovalDrawer = dynamic(() => import('@/components/Drawers/ApprovalDrawer'), {
  loading: () => <LinearProgress />,
  ssr: false,
})

const DocumentViewer = dynamic(() => import('@/components/Documents/DocumentViewer'), {
  loading: () => <LinearProgress />,
  ssr: false,
})

const FileUploadDialog = dynamic(
  () => import('@/components/FileUpload/FileUploadDialog'),
  {
    loading: () => <LinearProgress />,
    ssr: false,
  }
)

interface DocumentsPageProps {
  params: Promise<{
    meetingId: string
  }>
}

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

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dsmPage, setDsmPage] = useState(0)
  const [dsmRowsPerPage, setDsmRowsPerPage] = useState(6)

  // Calculate DSM progress
  const dsmProgress = React.useMemo(() => {
    const uploadedDsm = dsmDocuments.filter((doc) => doc.status === 'AUTHORIZED').length
    return {
      uploaded: uploadedDsm,
      totalRequired: Math.max(dsmDocuments.length, 5),
      percentage: dsmDocuments.length > 0 ? (uploadedDsm / dsmDocuments.length) * 100 : 0,
    }
  }, [dsmDocuments])

  // ApprovalDrawer state
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  // FileUploadDialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDsmDocument, setSelectedDsmDocument] = useState<Document | null>(null)

  // DocumentViewer state for fullscreen view
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)

  // Set active meeting based on URL parameter
  // Meeting is set by layout - no need to set it again here

  // Fetch documents from API when meeting changes
  useEffect(() => {
    if (currentMeeting?.id) {
      refreshDocuments(currentMeeting.id)
    }
  }, [currentMeeting?.id, refreshDocuments])

  // Refresh documents when page gains focus or becomes visible
  useEffect(() => {
    const handleFocus = () => {
      if (currentMeeting?.id) {
        refreshDocuments(currentMeeting.id)
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && currentMeeting?.id) {
        refreshDocuments(currentMeeting.id)
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentMeeting?.id, refreshDocuments])

  // Filter documents based on search and status
  const filteredDocuments = regularDocuments.filter((doc) => {
    const matchesSearch =
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter
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
    setUploadDialogOpen(true)
  }

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false)
    setSelectedDsmDocument(null) // Clear selected document when closing
  }

  const handleFilesUpload = async (
    files: File[],
    associations?: { [fileId: string]: string }
  ) => {
    if (!currentMeeting?.id) return
    try {
      await uploadDocument(currentMeeting.id, files, 'dsm-document', associations)
    } catch (error) {
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
    } catch (err) {
      // Handle error
    }
  }

  // Show loading state
  if (loading) {
    return <LinearProgress />
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
      <Suspense fallback={<LinearProgress />}>
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
              />

              <CardContent sx={{ p: 0 }}>
                {/* Search and Filter Bar */}
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
                        <MenuItem value="Approved">Approved</MenuItem>
                        <MenuItem value="1/3 Reviews Complete">In Review</MenuItem>
                        <MenuItem value="Not Uploaded">Not Uploaded</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>

                {/* Documents Table */}
                <DocumentsTable
                  documents={filteredDocuments}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  emptyRows={emptyRows}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  onOpenDocument={handleDocumentAction}
                />
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <DSMDocuments
                  dsmDocuments={dsmDocuments}
                  dsmPage={dsmPage}
                  dsmRowsPerPage={dsmRowsPerPage}
                  dsmEmptyRows={dsmEmptyRows}
                  dsmProgress={dsmProgress}
                  onUpload={handleUpload}
                  onPageChange={handleDsmChangePage}
                  onRowsPerPageChange={handleDsmChangeRowsPerPage}
                  onOpenDocument={handleDocumentAction}
                  onOpenUploadFor={(doc) => {
                    setSelectedDsmDocument(doc)
                    setUploadDialogOpen(true)
                  }}
                  placeholders={[
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
          title={selectedDocument.title || 'Document'}
          pdfUrl={selectedDocument.filePath || ''}
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
        preSelectedDocumentId={selectedDsmDocument?.id}
      />

      {/* Hosting site UI moved to DocumentSiteCard */}

      {/* DocumentViewer for fullscreen document view */}
      {selectedDocument && (
        <DocumentViewer
          open={documentViewerOpen}
          onClose={handleDocumentViewerClose}
          pdfUrl={selectedDocument.filePath || ''}
          title={selectedDocument.title || 'Document'}
          documentId={selectedDocument.id}
        />
      )}
    </>
  )
}
