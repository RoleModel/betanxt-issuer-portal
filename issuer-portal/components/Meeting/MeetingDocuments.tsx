import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { InsertDriveFileOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import DocumentViewer from '@/components/Documents/DocumentViewer'
import ApprovalDrawer from '@/components/Drawers/ApprovalDrawer'
import { EmptyState } from '@/components/EmptyState'
import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'
import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'
import StatusChip from '@/components/ui/StatusChip'

import { useDocuments } from '@/hooks/useDocuments'
import type { Document, Meeting } from '@/types/api-exports'
import { formatDateForDisplay } from '@/utils/dateUtils'
import { getStoragePublicUrl } from '@/utils/documentUtils'

interface MeetingDocumentsProps {
  documents?: Document[]
  meetingId?: string
  meeting?: Meeting
}

export default function MeetingDocuments({
  documents: propDocuments,
  meetingId,
  meeting,
}: MeetingDocumentsProps) {
  const router = useRouter()
  const params = useParams()
  const clientTicker = params.clientTicker as string
  const { getDocumentsByMeeting, uploadDocument } = useDocuments()
  const [documents, setDocuments] = useState<Document[]>(propDocuments || [])
  const [open, setOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [fileUrl, setfileUrl] = useState('')
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('')
  const [selectedDocumentStatus, setSelectedDocumentStatus] = useState<
    Document['status'] | undefined
  >(undefined)
  const [selectedPlaceholderId, setSelectedPlaceholderId] = useState<string | undefined>(
    undefined
  )
  const [loading, setLoading] = useState(!!meetingId)
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [documentViewerUrl, setDocumentViewerUrl] = useState('')

  // Track selectedDocumentId changes
  useEffect(() => {
    // Placeholder for future side effects
  }, [selectedDocumentId])

  const fetchDocuments = useCallback(async () => {
    if (!meetingId) return
    setLoading(true)
    try {
      const fetchedDocuments = await getDocumentsByMeeting(meetingId)
      // Show relevant documents for the meeting phases
      const filteredDocuments = fetchedDocuments.filter((doc) => {
        const docType = (doc.type || doc.fileType || '').toLowerCase()
        const docTitle = (doc.title || '').toLowerCase()
        const category = doc.displayCategory || ''

        // Exclude DSM documents (they belong in the DSMDocuments component)
        if (
          doc.displayCategory === 'dsm' ||
          docType === 'dsm-document' ||
          docType.includes('presentation') ||
          docType.includes('slide') ||
          docTitle.includes('presentation') ||
          docTitle.includes('slide')
        ) {
          return false
        }

        // Exclude hosting site documents
        if (docType === 'hosting_site' || docType === 'hosting site') {
          return false
        }

        // Exclude signed forms (they belong in the full Documents page)
        if (
          docType === 'signed-form' ||
          docType === 'transfer-agent-request' ||
          docType === 'plan-file-request' ||
          docTitle.includes('transfer agent request') ||
          docTitle.includes('plan file request')
        ) {
          return false
        }

        // Include proxy materials (Phase 2-4)
        if (
          category === 'proxy-materials' ||
          docType.includes('proxy') ||
          docType.includes('notice') ||
          docTitle.includes('proxy') ||
          docTitle.includes('notice') ||
          docTitle.includes('voting instruction')
        ) {
          return true
        }

        // Include meeting materials (Phase 3-5)
        if (
          category === 'meeting-materials' ||
          docType.includes('agenda') ||
          docType.includes('script') ||
          docType.includes('procedure') ||
          docType.includes('guest') ||
          docType.includes('inspector') ||
          docType.includes('q&a')
        ) {
          return true
        }

        // Include post-meeting documents (Phase 6-8)
        if (category === 'post-meeting') {
          return true
        }

        // Include draft proxy statement if it exists
        if (docType.includes('draft') && docType.includes('proxy')) {
          return true
        }

        // Exclude internal documents by default
        if (category === 'internal') {
          return false
        }

        // Include other general documents
        return true
      })

      // Helper to compute placeholder deadlines relative to meeting date
      const computePlaceholderDeadline = (docType: string): string | null => {
        if (!meeting?.meetingDate) return null
        const meetingDate = new Date(meeting.meetingDate)
        const deadline = new Date(meetingDate)
        switch (docType) {
          case 'draft-proxy-statement':
            deadline.setDate(deadline.getDate() - 60)
            break
          case 'proxy-card':
            deadline.setDate(deadline.getDate() - 30)
            break
          case 'notice-access-form':
            deadline.setDate(deadline.getDate() - 40)
            break
          default:
            return null
        }
        return deadline.toISOString()
      }

      // Create placeholder documents for Phase 2 if they don't exist
      const placeholderDocs: Document[] = []

      // Check if Draft Proxy Statement exists
      if (
        !filteredDocuments.find(
          (doc) =>
            doc.type === 'draft-proxy-statement' ||
            doc.title?.toLowerCase().includes('draft proxy statement')
        )
      ) {
        placeholderDocs.push({
          id: 'placeholder-draft-proxy-statement',
          title: 'Draft Proxy Statement',
          type: 'draft-proxy-statement',
          status: 'AWAITING_DRAFT',
          deadline: computePlaceholderDeadline('draft-proxy-statement'),
          uploadedDate: null,
        } as Document)
      }

      // Check if Proxy Card exists
      if (
        !filteredDocuments.find(
          (doc) =>
            doc.type === 'proxy-card' || doc.title?.toLowerCase().includes('proxy card')
        )
      ) {
        placeholderDocs.push({
          id: 'placeholder-proxy-card',
          title: 'Proxy Card',
          type: 'proxy-card',
          status: 'AWAITING_DRAFT',
          deadline: computePlaceholderDeadline('proxy-card'),
          uploadedDate: null,
        } as Document)
      }

      // Check if Notice exists
      if (
        !filteredDocuments.find(
          (doc) =>
            doc.type === 'notice-access-form' ||
            doc.title?.toLowerCase().includes('Notice')
        )
      ) {
        placeholderDocs.push({
          id: 'placeholder-notice-access-form',
          title: 'Notice',
          type: 'notice-access-form',
          status: 'AWAITING_DRAFT',
          deadline: computePlaceholderDeadline('notice-access-form'),
          uploadedDate: null,
        } as Document)
      }

      // Combine real documents with placeholders, placeholders first
      setDocuments([...placeholderDocs, ...filteredDocuments])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }, [meetingId, getDocumentsByMeeting, meeting?.meetingDate])

  // Fetch actual uploaded documents when meetingId changes
  useEffect(() => {
    if (meetingId) {
      fetchDocuments()
    }
  }, [meetingId, fetchDocuments])

  const handleViewAllDocuments = () => {
    router.push(`/${clientTicker}/meeting/${meetingId}/documents`)
  }

  const handleUpload = (placeholderId?: string) => {
    setSelectedPlaceholderId(placeholderId)
    setUploadDialogOpen(true)
  }

  const handleFileUpload = async (
    files: File[],
    associations?: { [fileId: string]: string }
  ) => {
    if (files.length === 0) return

    try {
      for (const file of files) {
        const fileId = `${file.name}-${file.size}`
        const placeholderId = associations?.[fileId]

        let result: string | null = null
        if (
          placeholderId &&
          typeof placeholderId === 'string' &&
          placeholderId.startsWith('placeholder-')
        ) {
          const documentType = placeholderId.replace('placeholder-', '')
          result = await uploadDocument(file, documentType, meetingId, file.name)
        } else {
          result = await uploadDocument(file, file.name, meetingId)
        }

        if (!result) {
          throw new Error(`Failed to upload ${file.name}`)
        }
      }
      // Small delay to ensure database has been updated
      await new Promise((resolve) => setTimeout(resolve, 500))
      // Refresh documents after upload
      await fetchDocuments()
    } catch (error) {
      console.error('Failed to upload document:', error)
      throw error
    }
  }

  const handleApprove = (documentId: string) => {
    if (documentId.startsWith('placeholder-')) {
      console.warn('Cannot approve placeholder document')
      return
    }

    const document = documents.find((d) => d.id === documentId)
    if (!document) {
      return
    }

    const storagePath = document.filePath || ''

    if (!storagePath) {
      return
    }

    // Convert storage path to public URL
    const docUrl = getStoragePublicUrl(storagePath)

    setSelectedDocumentId(documentId)
    setSelectedDocumentStatus(document.status)
    setOpen(true)
    setfileUrl(docUrl)
  }

  const handleOpenFullscreen = () => {
    // Set the document URL from the approval drawer
    if (fileUrl) {
      setDocumentViewerUrl(fileUrl)
      setDocumentViewerOpen(true)
    }
    // Close the approval drawer
    setOpen(false)
  }

  const onApprove = () => {
    setOpen(false)
  }

  const onAddComment = (_comment: string) => {
    // TODO: Implement comment persistence (e.g., POST to /api/documents/:id/comments)
    // Mark parameter as intentionally unused until implementation
    void _comment
  }

  const getStatusChip = (status: Document['status']) => {
    const statusConfig = {
      AWAITING_DRAFT: { color: 'default' as const, label: 'Awaiting Draft' },
      AWAITING_REVIEW: { color: 'warning' as const, label: 'Awaiting Review' },
      APPROVED: { color: 'success' as const, label: 'Approved' },
      DRAFT: { color: 'info' as const, label: 'Draft' },
      UPLOADED: { color: 'success' as const, label: 'Uploaded' },
      IN_PROGRESS: { color: 'info' as const, label: 'In Progress' },
      SIGNED: { color: 'success' as const, label: 'Signed' },
      PENDING_AUTHORIZATION: {
        color: 'warning' as const,
        label: 'Pending Authorization',
      },
      AUTHORIZED: { color: 'success' as const, label: 'Authorized' },
      COMPLETED: { color: 'success' as const, label: 'Completed' },
      NOT_UPLOADED: { color: 'default' as const, label: 'Not Uploaded' },
    }

    const config =
      statusConfig[status || 'AWAITING_DRAFT'] || statusConfig['AWAITING_DRAFT']
    return <StatusChip status={config.label} />
  }

  const getActionButton = (document: Document) => {
    const effectiveStatus = document.status as
      | 'AWAITING_DRAFT'
      | 'DRAFT'
      | 'AWAITING_REVIEW'
      | 'UPLOADED'
      | 'IN_PROGRESS'
      | 'SIGNED'
      | 'PENDING_AUTHORIZATION'
      | 'AUTHORIZED'
      | 'COMPLETED'
      | 'APPROVED'
      | 'NOT_UPLOADED'

    // Check if this is a placeholder document
    const isPlaceholder = document.id?.startsWith('placeholder-')

    if (isPlaceholder) {
      return (
        <Button variant="text" onClick={() => handleUpload(document.id)}>
          Upload
        </Button>
      )
    }

    switch (effectiveStatus) {
      case 'AWAITING_REVIEW':
      case 'UPLOADED':
      case 'IN_PROGRESS':
      case 'SIGNED':
      case 'PENDING_AUTHORIZATION':
        return (
          <Button variant="text" onClick={() => handleApprove(document.id || '')}>
            View
          </Button>
        )
      case 'AUTHORIZED':
      case 'COMPLETED':
      case 'APPROVED':
        return null
      case 'AWAITING_DRAFT':
        return (
          <Button variant="outlined" onClick={() => handleUpload()}>
            Upload
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader title={'Documents'} />
      <CardContent sx={{ p: 0 }}>
        {documents.length === 0 && !loading ? (
          <EmptyState
            title="No documents uploaded yet"
            description="Documents will appear here once they are uploaded for this meeting."
            minHeight="unset"
            icon={<InsertDriveFileOutlined fontSize="large" color="disabled" />}
          />
        ) : (
          <TableContainer>
            <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
              <SROnlyTableCaption>Meeting Documents</SROnlyTableCaption>
              <TableHead sx={{ visibility: 'hidden', display: 'none' }}>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <Box>
                        <Typography noWrap fontWeight={500}>
                          {document.title || 'Untitled'}
                        </Typography>
                        {document.uploadedDate ? (
                          <Typography color="text.secondary">
                            Uploaded:{' '}
                            {new Date(document.uploadedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
                        ) : (
                          document.id?.startsWith('placeholder-') &&
                          typeof document.deadline === 'string' && (
                            <Typography
                              noWrap
                              color="text.secondary"
                              sx={{ fontStyle: 'italic' }}
                            >
                              Deadline: {formatDateForDisplay(document.deadline)}
                            </Typography>
                          )
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.secondary">
                        {(() => {
                          const docType = document.fileType || 'PDF'
                          // Map MIME types to friendly names
                          if (docType === 'application/pdf') return 'PDF'
                          if (
                            docType ===
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                          )
                            return 'DOCX'
                          if (
                            docType ===
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                          )
                            return 'XLSX'
                          if (docType === 'application/msword') return 'DOC'
                          if (docType === 'application/vnd.ms-excel') return 'XLS'
                          // Return as-is if already friendly or unknown
                          return docType
                        })()}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(document.status)}</TableCell>
                    <TableCell align="right">{getActionButton(document)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => handleUpload()} disabled={!meetingId}>
          Upload
        </Button>
        {documents.length > 0 && (
          <Button
            variant="outlined"
            onClick={handleViewAllDocuments}
            disabled={!meetingId}
          >
            View All
          </Button>
        )}
      </CardActions>
      <ApprovalDrawer
        title="Approve Document"
        fileUrl={fileUrl}
        documentId={selectedDocumentId}
        taskStatus={selectedDocumentStatus}
        onApprove={onApprove}
        onOpenFullscreen={handleOpenFullscreen}
        onAddComment={onAddComment}
        open={open}
        onClose={() => {
          setOpen(false)
        }}
      />
      <DocumentViewer
        open={documentViewerOpen}
        onClose={() => setDocumentViewerOpen(false)}
        fileUrl={documentViewerUrl}
        title="Document Viewer"
        documentId={selectedDocumentId}
      />
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false)
          setSelectedPlaceholderId(undefined)
        }}
        onUpload={handleFileUpload}
        onUploadSuccess={() => {
          setUploadDialogOpen(false)
          setSelectedPlaceholderId(undefined)
        }}
        meetingId={meetingId}
        preSelectedDocumentId={selectedPlaceholderId}
      />
    </Card>
  )
}
