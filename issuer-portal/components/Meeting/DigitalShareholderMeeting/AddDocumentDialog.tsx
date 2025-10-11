'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Divider,
} from '@mui/material'

import BNFileDropzone from '@/components/FileUpload/BNFileDropzone'
import BNFilePreview from '@/components/FileUpload/BNFilePreview'

interface DSMDocument {
  id: string
  title: string
  status?: string
  filePath?: string
}

interface FileWithMetadata {
  id: string
  file: File
  status: 'uploading' | 'complete' | 'error'
  progress?: number
  error?: string
  associatedDocumentId?: string
}

interface AddDocumentDialogProps {
  open: boolean
  onClose: () => void
  participantName: string
  meetingId: string
  participantId: string
  onDocumentAdded: (documentName: string, documentStatus: string) => void
}

export function AddDocumentDialog({
  open,
  onClose,
  participantName,
  meetingId,
  participantId,
  onDocumentAdded,
}: AddDocumentDialogProps) {
  const [dsmDocuments, setDsmDocuments] = useState<DSMDocument[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [uploadFiles, setUploadFiles] = useState<FileWithMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadMode, setIsUploadMode] = useState(false)

  // Fetch DSM documents when dialog opens
  useEffect(() => {
    if (open && meetingId) {
      void fetchDSMDocuments()
    }
    // fetchDSMDocuments is a stable function defined in this component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, meetingId])

  const fetchDSMDocuments = async () => {
    try {
      setIsLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api'
      const response = await fetch(`${API_URL}/meetings/${meetingId}/documents`)

      if (response.ok) {
        const documents = await response.json() as {
          documentType?: string
          title?: string
          [key: string]: unknown
        }[]
        // Filter for DSM-related documents
        const dsmDocs = documents.filter((doc) =>
          doc.documentType === 'digital-shareholder-meeting' ||
          doc.title?.includes('DSM') ||
          doc.title?.includes('Digital Shareholder Meeting')
        )
        setDsmDocuments(dsmDocs as unknown as DSMDocument[])
        setIsUploadMode(dsmDocs.length === 0)
      } else {
        setDsmDocuments([])
        setIsUploadMode(true)
      }
    } catch (error) {
      console.error('Failed to fetch DSM documents:', error)
      setDsmDocuments([])
      setIsUploadMode(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilesSelected = (files: File[]) => {
    const newFiles: FileWithMetadata[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      file,
      status: 'complete' as const, // Set to complete initially, will change to uploading when upload starts
    }))
    setUploadFiles(prev => [...prev, ...newFiles])
  }

  const handleFileRejections = (rejections: unknown[]) => {
    console.warn('File rejections:', rejections)
    // Handle file rejections if needed
  }

  const handleFileRemove = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleAssignExistingDocument = () => {
    if (selectedDocumentId) {
      const selectedDoc = dsmDocuments.find(doc => doc.id === selectedDocumentId)
      if (selectedDoc) {
        onDocumentAdded(selectedDoc.title, selectedDoc.status ?? 'uploaded')
        handleClose()
      }
    }
  }

  const handleUploadNewDocument = async () => {
    if (uploadFiles.length === 0) return

    try {
      const file = uploadFiles[0]
      setUploadFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
      ))

      // Create unique filename to avoid duplicates
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const fileExtension = file.file.name.split('.').pop()
      const uniqueFileName = `${file.file.name.split('.')[0]}_${timestamp}_${randomId}.${fileExtension}`

      const renamedFile = new File([file.file], uniqueFileName, { type: file.file.type })

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', renamedFile)
      formData.append('meetingId', meetingId)
      formData.append('documentType', 'digital-shareholder-meeting')
      formData.append('participantName', participantName)
      formData.append('participantId', participantId)

      // Upload via API route
      const response = await fetch('/api/documents/types/digital-shareholder-meeting/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${errorText}`)
      }

      await response.json() as { id?: string; storagePath?: string }

      setUploadFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'complete', progress: 100 } : f
      ))

      // Add document to participant
      onDocumentAdded(file.file.name, 'uploaded')

      setTimeout(() => {
        handleClose()
      }, 1000)
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadFiles(prev => prev.map(f =>
        f.id === uploadFiles[0].id ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' } : f
      ))
    }
  }

  const handleClose = () => {
    setSelectedDocumentId('')
    setUploadFiles([])
    setIsUploadMode(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Add Document for {participantName}
      </DialogTitle>

      <DialogContent>
        {isLoading ? (
          <Typography>Loading available documents...</Typography>
        ) : isUploadMode || dsmDocuments.length === 0 ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No DSM documents found. Upload a new document:
            </Typography>

            <Box sx={{ mb: 2 }}>
              <BNFileDropzone
                onFilesSelected={handleFilesSelected}
                onFileRejections={handleFileRejections}
                maxFiles={1}
                multiple={false}
                acceptedFileTypes={['.pdf', '.doc', '.docx', '.ppt', '.pptx']}
                linkText="Select Document"
              />
            </Box>

            {uploadFiles.map((file) => (
              <Box key={file.id} sx={{ mb: 1 }}>
                <BNFilePreview
                  file={file}
                  onRemove={handleFileRemove}
                />
              </Box>
            ))}
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select an existing DSM document:
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>DSM Document</InputLabel>
              <Select
                value={selectedDocumentId}
                onChange={(e) => setSelectedDocumentId(e.target.value)}
                label="DSM Document"
              >
                {dsmDocuments.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id}>
                    <Box>
                      <Typography variant="body2">{doc.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Status: {doc.status ?? 'Unknown'}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Or upload a new document:
            </Typography>

            <Button
              variant="outlined"
              onClick={() => setIsUploadMode(true)}
              fullWidth
            >
              Upload New Document
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={handleClose}>
          Cancel
        </Button>

        {isUploadMode || dsmDocuments.length === 0 ? (
          <Button
            onClick={handleUploadNewDocument}
            variant="contained"
            disabled={uploadFiles.length === 0 || uploadFiles.some(f => f.status === 'uploading')}
          >
            Upload & Assign
          </Button>
        ) : (
          <Button
            onClick={handleAssignExistingDocument}
            variant="contained"
            disabled={!selectedDocumentId}
          >
            Assign Document
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
