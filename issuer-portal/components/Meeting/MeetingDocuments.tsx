import { useRouter } from 'next/navigation'
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

import ApprovalDrawer from '@/components/Drawers/ApprovalDrawer'
import { EmptyState } from '@/components/EmptyState'
import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'
import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'
import StatusChip from '@/components/ui/StatusChip'

import { useDocuments } from '@/hooks/useDocuments'
import type { Document, Meeting } from '@/types/api-exports'
import { friendlyDate } from '@/utils/dateUtils'

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
  const { getDocumentsByMeeting, uploadDocument } = useDocuments()
  const [documents, setDocuments] = useState<Document[]>(propDocuments || [])
  const [open, setOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [fileUrl, setfileUrl] = useState('')
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('')
  const [loading, setLoading] = useState(!!meetingId)

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

      // Check if Notice and Access Form exists
      if (
        !filteredDocuments.find(
          (doc) =>
            doc.type === 'notice-access-form' ||
            doc.title?.toLowerCase().includes('notice and access form')
        )
      ) {
        placeholderDocs.push({
          id: 'placeholder-notice-access-form',
          title: 'Notice and Access Form',
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
    if (meetingId) {
      router.push(`/meeting/${meetingId}/documents`)
    }
  }

  const handleUpload = () => {
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

        if (placeholderId && placeholderId.startsWith('placeholder-')) {
          const documentType = placeholderId.replace('placeholder-', '')
          await uploadDocument(file, documentType, meetingId, file.name)
        } else {
          await uploadDocument(file, file.name, meetingId)
        }
      }
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
      console.error('Document not found:', documentId)
      return
    }

    const storagePath = document.filePath || ''

    if (!storagePath) {
      console.error('Document has no file path:', document)
      return
    }

    // Use the file path directly if it's already a full URL
    const docUrl = storagePath

    setSelectedDocumentId(documentId)
    setOpen(true)
    setfileUrl(docUrl)
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
      AUTHORIZED: { color: 'success' as const, label: 'Authorized' },
      COMPLETED: { color: 'success' as const, label: 'Completed' },
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
      | 'AUTHORIZED'
      | 'COMPLETED'
      | 'APPROVED'

    // Check if this is a placeholder document
    const isPlaceholder = document.id?.startsWith('placeholder-')

    if (isPlaceholder) {
      return (
        <Button variant="text" onClick={handleUpload}>
          Upload
        </Button>
      )
    }

    switch (effectiveStatus) {
      case 'AWAITING_REVIEW':
      case 'UPLOADED':
      case 'IN_PROGRESS':
        return (
          <Button variant="text" onClick={() => handleApprove(document.id || '')}>
            Approve Draft
          </Button>
        )
      case 'SIGNED':
      case 'AUTHORIZED':
      case 'COMPLETED':
      case 'APPROVED':
        return null
      case 'AWAITING_DRAFT':
        return (
          <Button variant="outlined" onClick={handleUpload}>
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
            <Table>
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
                        <Typography fontWeight={500}>
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
                              color="text.secondary"
                              sx={{ fontStyle: 'italic' }}
                            >
                              {friendlyDate(document.deadline)}
                            </Typography>
                          )
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.secondary">
                        {(() => {
                          const docType = document.type || document.fileType || 'PDF'
                          // Map document types to display names
                          const typeMapping: Record<string, string> = {
                            'signed-form': 'Broadridge/ICS Access',
                            'transfer-agent-request': 'Transfer Agent Request Form',
                            'plan-file-request': 'Plan File Request Form',
                            'draft-proxy-statement': 'Draft Proxy Statement',
                            'proxy-card': 'Proxy Card',
                            'notice-access-form': 'Notice and Access Form',
                            HOSTING_SITE: 'Document Hosting Site',
                            'task-completion': 'Completed Task Document',
                            general: 'General Document',
                            PDF: 'PDF Document',
                          }
                          return typeMapping[docType] || docType
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
        <Button variant="contained" onClick={handleUpload} disabled={!meetingId}>
          Upload Document
        </Button>
        {documents.length > 0 && (
          <Button
            variant="outlined"
            onClick={handleViewAllDocuments}
            disabled={!meetingId}
          >
            View All Documents
          </Button>
        )}
      </CardActions>
      <ApprovalDrawer
        title="Approve Document"
        fileUrl={fileUrl}
        documentId={selectedDocumentId}
        onApprove={onApprove}
        onAddComment={onAddComment}
        open={open}
        onClose={() => setOpen(false)}
      />
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleFileUpload}
        onUploadSuccess={() => {
          setUploadDialogOpen(false)
        }}
        meetingId={meetingId}
      />
    </Card>
  )
}
