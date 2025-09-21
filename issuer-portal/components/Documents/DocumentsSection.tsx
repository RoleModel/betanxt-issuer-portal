/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

'use client'

import dynamic from 'next/dynamic'
import React, { Suspense, useEffect, useMemo, useState } from 'react'

import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  FormControl,
  Grid,
  InputAdornment,
  LinearProgress,
  Link,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TablePaginationActions,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

import StatusChip from '@/components/ui/StatusChip'

import { listDocumentsByMeetingId } from '@/domain-models/api/documents'
import { components } from '@/domain-models/generated-schema'

import { useMeeting } from '@/contexts/MeetingContext'
import { formatDate } from '@/lib/formats'

/**
 * Documents page for managing meeting documents
 * Displays uploaded documents and Digital Shareholder Meeting (DSM) documents
 */

type Document = components['schemas']['Document']

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

const RevisionRequestDialog = dynamic(
  () => import('@/components/Documents/RevisionRequestDialog'),
  {
    loading: () => <LinearProgress />,
    ssr: false,
  }
)

const FileUploadDialog = dynamic(
  () => import('@/components/file-upload/FileUploadDialog'),
  {
    loading: () => <LinearProgress />,
    ssr: false,
  }
)

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

// Status types are now handled by the centralized StatusChip component

// Document thumbnail component with proper caching and error handling
const DocumentThumbnail: React.FC<{
  filePath?: string | null
}> = ({ filePath }) => {

  const fileUrl = useMemo(() => {
    if (!filePath) {
      return null // No file to display
    }
    // For now, just return the file path as is
    return filePath
  }, [filePath])


  if (!fileUrl) {
    return (
      <Box
        sx={{
          width: 30,
          height: 40,
          maxHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'action.hover',
          borderRadius: 1,
          fontSize: '10px',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '8px' }}>
          {!fileUrl ? 'No File' : 'Error'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {/* TODO: Add PDFViewer here */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'action.hover',
          borderRadius: 1,
          zIndex: 1,
        }}
      >
        <LinearProgress />
      </Box>
    </Box>
  )
}

interface DocumentsPageProps {
  params: Promise<{
    meetingId: string
  }>
}

export default function DocumentsPage({ params }: DocumentsPageProps) {
  const resolvedParams = React.use(params)
  const { currentMeeting } = useMeeting()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dsmPage, setDsmPage] = useState(0)
  const [dsmRowsPerPage, setDsmRowsPerPage] = useState(6)

  // State for documents data
  const [regularDocuments, setRegularDocuments] = useState<Document[]>([])
  const [dsmDocuments, setDsmDocuments] = useState<Document[]>([])
  const [dsmProgress, setDsmProgress] = useState({
    uploaded: 0,
    totalRequired: 5,
    percentage: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ApprovalDrawer state
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  // FileUploadDialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDsmDocument, setSelectedDsmDocument] = useState<Document | null>(null)

  // Hosting site states
  const [hostingSiteStatus, setHostingSiteStatus] = useState<string>('Incomplete')
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [hostingSiteViewerOpen, setHostingSiteViewerOpen] = useState(false)

  // DocumentViewer state for fullscreen view
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)

  // Set active meeting based on URL parameter
  // Meeting is set by layout - no need to set it again here

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      const meetingId = resolvedParams.meetingId

      try {
        setLoading(true)
        setError(null)

        const { data, error } = await listDocumentsByMeetingId(meetingId)

        if (error) {
          setError('Failed to fetch documents')
          return
        }

        const documents = data ?? []

        // Separate regular documents from DSM documents
        const regular = documents.filter((doc) => doc.type !== 'dsm-document')
        const dsm = documents.filter((doc) => doc.type === 'dsm-document')

        setRegularDocuments(regular)
        setDsmDocuments(dsm)

        // Calculate DSM progress
        const uploadedDsm = dsm.filter((doc) => doc.status === 'AUTHORIZED').length
        setDsmProgress({
          uploaded: uploadedDsm,
          totalRequired: Math.max(dsm.length, 5),
          percentage: Math.round((uploadedDsm / Math.max(dsm.length, 5)) * 100),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch documents')
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [resolvedParams.meetingId])

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
    _files: File[],
    _associations?: { [fileId: string]: string }
  ) => {
    // TODO: Implement file upload using API endpoints
    // For now, just log the action
    try {
      // Would use createDocument API here
      await handleUploadSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const handleUploadSuccess = async () => {
    // Refresh documents after successful upload
    if (!resolvedParams.meetingId) return

    const { data } = await listDocumentsByMeetingId(resolvedParams.meetingId)
    const documents = data ?? []

    const regular = documents.filter((doc) => doc.type !== 'dsm-document')
    const dsm = documents.filter((doc) => doc.type === 'dsm-document')

    setRegularDocuments(regular)
    setDsmDocuments(dsm)

    // Calculate DSM progress
    const uploadedDsm = dsm.filter((doc) => doc.status === 'AUTHORIZED').length
    setDsmProgress({
      uploaded: uploadedDsm,
      totalRequired: Math.max(dsm.length, 5),
      percentage: Math.round((uploadedDsm / Math.max(dsm.length, 5)) * 100),
    })
  }

  const handleRevisionRequest = () => {
    setRevisionDialogOpen(true)
  }

  const handleRevisionDialogClose = () => {
    setRevisionDialogOpen(false)
  }

  const handleRevisionSubmit = async (_revisionText: string) => {
    try {
      // Update the hosting site status to "Revisions Requested"
      setHostingSiteStatus('Revisions Requested')
      // TODO: Save revision request to database via API
    } catch (err) {
      throw err
    }
  }

  const handleViewHostingSite = () => {
    setHostingSiteViewerOpen(true)
  }

  const handleHostingSiteViewerClose = () => {
    setHostingSiteViewerOpen(false)
  }

  const handleApproveSite = async (): Promise<void> => {
    try {
      setHostingSiteStatus('Approved')
      setHostingSiteViewerOpen(false)
    } catch (err) {
      // Handle error
    }
  }

  const handleDocumentAction = (doc: Document) => {
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
      await handleUploadSuccess() // Refresh documents
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
              <TableContainer>
                <Table size="small" sx={{ minWidth: 500 }} aria-label="Event Documents">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ p: 2 }}>Document</TableCell>
                      <TableCell>Added/Updated</TableCell>
                      <TableCell sx={{ width: '200px' }}>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(rowsPerPage > 0
                      ? filteredDocuments.slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      : filteredDocuments
                    ).map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <DocumentThumbnail filePath={doc.filePath} />
                            <Typography variant="body2">
                              {doc.title ?? 'Untitled Document'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography>System</Typography>
                            <Typography>
                              {doc.updatedAt ? formatDate(doc.updatedAt) : 'No date'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={(doc.status ?? null) as string | null} />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="text"
                            onClick={() => handleDocumentAction(doc)}
                          >
                            {doc.filePath ? 'View' : 'Review'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {emptyRows > 0 && (
                      <TableRow style={{ height: 53 * emptyRows }}>
                        <TableCell colSpan={6} />
                      </TableRow>
                    )}
                  </TableBody>
                  {/* Pagination */}
                  <TableFooter>
                    <TableRow sx={{ minWidth: '100%' }}>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                        colSpan={4}
                        count={filteredDocuments.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        slotProps={{
                          select: {
                            inputProps: {
                              'aria-label': 'rows per page',
                            },
                            native: true,
                          },
                        }}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        ActionsComponent={TablePaginationActions}
                      />
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              {/* DSM Documents Section */}
              <Card>
                <CardHeader
                  title={' Digital Shareholder Meeting Documents'}
                  subheader={`${dsmProgress.uploaded} of ${dsmProgress.totalRequired} Materials Uploaded`}
                  action={
                    <Button
                      variant="contained"
                      startIcon={<FileUploadOutlinedIcon />}
                      onClick={handleUpload}
                      sx={{ textTransform: 'none' }}
                    >
                      Upload
                    </Button>
                  }
                />

                <CardContent sx={{ p: 0 }}>
                  {/* DSM Documents Table */}
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Document</TableCell>
                          <TableCell>Added/Updated</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(dsmRowsPerPage > 0
                          ? dsmDocuments.slice(
                            dsmPage * dsmRowsPerPage,
                            dsmPage * dsmRowsPerPage + dsmRowsPerPage
                          )
                          : dsmDocuments
                        ).map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <Typography>{doc.title}</Typography>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography>System</Typography>
                                <Typography color="text.secondary">
                                  {doc.updatedAt ? formatDate(doc.updatedAt) : '—'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <StatusChip
                                status={(doc.status ?? null) as string | null}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                variant="text"
                                onClick={() => {
                                  if (!doc.filePath) {
                                    // Open upload dialog for documents without files
                                    setSelectedDsmDocument(doc) // Set the specific document being uploaded to
                                    setUploadDialogOpen(true)
                                  } else {
                                    // Open approval drawer for documents with files
                                    handleDocumentAction(doc)
                                  }
                                }}
                              >
                                {!doc.filePath ? 'Upload' : 'View'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {dsmEmptyRows > 0 && (
                          <TableRow style={{ height: 53 * dsmEmptyRows }}>
                            <TableCell colSpan={4} />
                          </TableRow>
                        )}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TablePagination
                            rowsPerPageOptions={[6, 10, 25, { label: 'All', value: -1 }]}
                            colSpan={4}
                            count={dsmDocuments.length}
                            rowsPerPage={dsmRowsPerPage}
                            page={dsmPage}
                            slotProps={{
                              select: {
                                inputProps: {
                                  'aria-label': 'rows per page',
                                },
                                native: true,
                              },
                            }}
                            onPageChange={handleDsmChangePage}
                            onRowsPerPageChange={handleDsmChangeRowsPerPage}
                            ActionsComponent={TablePaginationActions}
                          />
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              {/* Document Hosting Site Card */}
              <Card sx={{ height: 'auto' }}>
                <CardContent>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'start',
                      gap: 2,
                    }}
                  >
                    <Typography variant="h4" component="p">
                      Document Hosting Site
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verify all shareholder facing sites, you will use the test control
                      number (123456782) to enter the voting site. Once approved, sites
                      will be made active in conjunction with the filing mailing date.
                    </Typography>
                    <Link
                      href={
                        currentMeeting?.client?.brandingId
                          ? `https://www.proxydocs.com/branding/${currentMeeting.client.brandingId}/2024/issuer/`
                          : 'https://www.proxydocs.com/branding/966152/2024/issuer/'
                      }
                      target="_blank"
                    >
                      View Document Hosting Site
                    </Link>
                    <StatusChip status={hostingSiteStatus} />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    variant="outlined"
                    onClick={handleViewHostingSite}
                    sx={{ textTransform: 'none' }}
                  >
                    View Site
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleRevisionRequest}
                    sx={{ textTransform: 'none' }}
                  >
                    Request Revision
                  </Button>
                </CardActions>
              </Card>

              {/* Proxy Push Site Card */}
              <Card sx={{ height: 'auto', mt: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'start',
                      gap: 2,
                    }}
                  >
                    <Typography variant="h4" component="p">
                      Proxy Push Voting Site
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Access the electronic voting platform for shareholders to cast their
                      votes. Use test control number (123456782) to verify voting
                      functionality.
                    </Typography>
                    <Link
                      href={
                        currentMeeting?.ticker
                          ? `https://www.proxypush.com/evote/${currentMeeting.ticker}/login`
                          : 'https://www.proxypush.com/evote/WEN/login'
                      }
                      target="_blank"
                    >
                      View Proxy Push Site
                    </Link>
                    <StatusChip status="Incomplete" />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const proxyPushUrl = currentMeeting?.ticker
                        ? `https://www.proxypush.com/evote/${currentMeeting.ticker}/login`
                        : 'https://www.proxypush.com/evote/WEN/login'
                      window.open(proxyPushUrl, '_blank')
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Test Voting Site
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Suspense>

      {/* ApprovalDrawer for document review/view */}
      {selectedDocument && (
        <ApprovalDrawer
          open={approvalDrawerOpen}
          onClose={handleApprovalDrawerClose}
          title={selectedDocument.title || 'Document'}
          pdfUrl={selectedDocument.filePath || ''}
          onApprove={handleApproveDocument}
          taskStatus={selectedDocument.status}
          onOpenFullscreen={handleOpenFullscreen}
          onAddComment={() => { }}
        />
      )}

      {/* FileUploadDialog for uploading documents */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        onUpload={handleFilesUpload}
        onUploadSuccess={handleUploadSuccess}
        meetingId={resolvedParams.meetingId}
        documentType="dsm-document"
        preSelectedDocumentId={selectedDsmDocument?.id}
      />

      {/* RevisionRequestDialog for requesting hosting site revisions */}
      <RevisionRequestDialog
        open={revisionDialogOpen}
        onClose={handleRevisionDialogClose}
        onSubmit={handleRevisionSubmit}
        title="Request Site Revision"
        description="Please describe the revisions needed for the document hosting site."
      />

      {/* DocumentViewer for viewing hosting site in iframe */}
      <DocumentViewer
        open={hostingSiteViewerOpen}
        onClose={handleHostingSiteViewerClose}
        pdfUrl={
          currentMeeting?.client?.brandingId
            ? `https://www.proxydocs.com/branding/${currentMeeting.client.brandingId}/2024/issuer/`
            : 'https://www.proxydocs.com/branding/966152/2024/issuer/'
        }
        title="Document Hosting Site"
        isWebsiteView={true}
        onApproveSite={handleApproveSite}
        onRequestRevision={handleRevisionRequest}
      />

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
