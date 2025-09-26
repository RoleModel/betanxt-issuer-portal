import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

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
import type { Document, Meeting } from '@/types/api'

interface MeetingDocumentsProps {
  documents?: Document[]
  meetingId?: string
  meeting?: Meeting
}

export default function MeetingDocuments({
  documents: propDocuments,
  meetingId,
  meeting: _meeting,
}: MeetingDocumentsProps) {
  const router = useRouter()
  const { getDocumentsByMeeting, uploadDocument } = useDocuments()
  const [documents, setDocuments] = useState<Document[]>(propDocuments || [])
  const [open, setOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')

  const fetchDocuments = useCallback(async () => {
    if (!meetingId) return
    try {
      const fetchedDocuments = await getDocumentsByMeeting(meetingId)
      // For Phase 2 dashboard, show only Phase 2 specific documents
      // These are the proxy materials that need review/approval
      const phase2DocTypes = ['draft-proxy-statement', 'proxy-card', 'notice-access-form']
      const filteredDocuments = fetchedDocuments.filter((doc) => {
        const docType = doc.type || doc.fileType || ''
        // Include documents that are Phase 2 proxy materials
        return (
          phase2DocTypes.includes(docType) ||
          // Also include general uploaded documents that aren't task-specific
          (!doc.taskId &&
            ![
              'signed-form',
              'transfer-agent-request',
              'plan-file-request',
              'task-completion',
            ].includes(docType))
        )
      })
      setDocuments(filteredDocuments)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }, [meetingId, getDocumentsByMeeting])

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

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    try {
      for (const file of files) {
        await uploadDocument(file, file.name, meetingId)
      }
      // Refresh documents after upload
      await fetchDocuments()
    } catch (error) {
      console.error('Failed to upload document:', error)
      throw error
    }
  }

  const handleApprove = (documentId: string) => {
    setOpen(true)
    setPdfUrl(documentId)
  }

  const onApprove = () => {
    setOpen(false)
  }

  const onAddComment = (_comment: string) => {}

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
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader title={'Documents'} />
      <CardContent>
        {documents.length === 0 ? (
          <EmptyState
            title="No documents uploaded yet"
            description="Documents will appear here once they are uploaded for this meeting."
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
                        {document.uploadedDate && (
                          <Typography color="text.secondary">
                            Uploaded:{' '}
                            {new Date(document.uploadedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
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
        pdfUrl={pdfUrl}
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
