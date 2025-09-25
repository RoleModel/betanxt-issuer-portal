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
  meeting,
}: MeetingDocumentsProps) {
  const router = useRouter()
  const { getDocumentsByMeeting, uploadDocument } = useDocuments()
  const [documents, setDocuments] = useState<Document[]>(propDocuments || [])
  const [open, setOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState('')

  // Calculate fallback deadline based on meeting date and document type
  const calculateFallbackDeadline = (documentType: string) => {
    if (!meeting?.meetingDate) return null

    const meetingDate = new Date(meeting.meetingDate)

    switch (documentType) {
      case 'Draft Proxy Statement':
      case 'Proxy Card':
        // 30 days before meeting
        const proxyDeadline = new Date(meetingDate)
        proxyDeadline.setDate(meetingDate.getDate() - 30)
        return proxyDeadline.toISOString()
      case 'Notice and Access Form':
        // 20 days before meeting
        const noticeDeadline = new Date(meetingDate)
        noticeDeadline.setDate(meetingDate.getDate() - 20)
        return noticeDeadline.toISOString()
      default:
        return null
    }
  }

  // Define the required Phase 2 documents as placeholders
  const requiredDocuments = [
    {
      id: 'draft-proxy-statement',
      name: 'Draft Proxy Statement',
      type: 'PDF',
      status: 'AWAITING_DRAFT' as const,
    },
    {
      id: 'proxy-card',
      name: 'Proxy Card',
      type: 'PDF',
      status: 'AWAITING_DRAFT' as const,
    },
    {
      id: 'notice-access-form',
      name: 'Notice and Access Form',
      type: 'PDF',
      status: 'AWAITING_REVIEW' as const,
    },
  ]

  const fetchDocuments = useCallback(async () => {
    if (!meetingId) return
    try {
      const fetchedDocuments = await getDocumentsByMeeting(meetingId)
      setDocuments(fetchedDocuments)
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

  // Merge required placeholders with actual uploaded documents
  const getDisplayDocuments = () => {
    return requiredDocuments.map((placeholder) => {
      // Check if there's an uploaded document for this placeholder
      let uploadedDoc = null

      if (placeholder.name === 'Draft Proxy Statement') {
        uploadedDoc = documents.find((doc) =>
          doc.title?.toLowerCase().includes('proxy statement')
        )
      } else if (placeholder.name === 'Proxy Card') {
        uploadedDoc = documents.find((doc) =>
          doc.title?.toLowerCase().includes('proxy card')
        )
      } else if (placeholder.name === 'Notice and Access Form') {
        uploadedDoc = documents.find(
          (doc) =>
            doc.title?.toLowerCase().includes('notice') ||
            doc.title?.toLowerCase().includes('access')
        )
      }

      if (uploadedDoc) {
        // Use the uploaded document but keep placeholder structure for UI
        return {
          ...placeholder,
          ...uploadedDoc,
          // Preserve placeholder status if uploaded doc is missing or falsy
          status: (uploadedDoc as Document).status || placeholder.status,
          // Keep placeholder name for display consistency
          name: placeholder.name,
          // Preserve placeholder info for display
          placeholderId: placeholder.id,
        }
      }

      // If no uploaded document, add fallback deadline to placeholder
      return {
        ...placeholder,
        deadline: calculateFallbackDeadline(placeholder.name),
      }
    })
  }

  const handleViewAllDocuments = () => {
    if (meetingId) {
      router.push(`/meeting/${meetingId}/documents`)
    }
  }

  const handleUpload = (documentId: string) => {
    setSelectedDocumentId(documentId)
    setUploadDialogOpen(true)
  }

  const handleFileUpload = async (files: File[]) => {
    if (!selectedDocumentId || files.length === 0) return

    try {
      for (const file of files) {
        const placeholder = requiredDocuments.find((d) => d.id === selectedDocumentId)
        const documentTitle = placeholder ? placeholder.name : undefined
        await uploadDocument(file, selectedDocumentId, meetingId, documentTitle)
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

  const onAddComment = (_comment: string) => {
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
    // If there is no file yet, always show Upload
    if (!document?.filePath) {
      return (
        <Button variant="text" onClick={() => handleUpload(document.id || selectedDocumentId || '')}>
          Upload
        </Button>
      )
    }

    // Derive a resilient status for action logic
    const effectiveStatus = (document.status || (document.filePath ? 'UPLOADED' : 'AWAITING_DRAFT')) as
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
      case 'AWAITING_DRAFT':
      case 'DRAFT':
      default:
        return (
          <Button variant="text" onClick={() => handleUpload(document.id || selectedDocumentId || '')}>
            Upload
          </Button>
        )
    }
  }

  return (
    <Card>
      <CardHeader title={'Documents'} />
      <CardContent>
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
              {getDisplayDocuments().map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <Box>
                      <Typography fontWeight={500}>{document.name}</Typography>
                      {document.deadline && (
                        <Typography color="text.secondary">
                          Deadline:{' '}
                          {new Date(document.deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {document.type || 'PDF'}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(document.status)}</TableCell>
                  <TableCell align="right">{getActionButton(document)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={handleViewAllDocuments} disabled={!meetingId}>
          View All Documents
        </Button>
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
          setSelectedDocumentId(null)
        }}
        meetingId={meetingId}
        preSelectedDocumentId={selectedDocumentId || undefined}
      />
    </Card>
  )
}
