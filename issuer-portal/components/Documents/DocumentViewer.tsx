'use client'

import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  Close as CloseIcon,
  CommentOutlined as CommentIcon,
  History as HistoryIcon,
  Update as UpdateIcon,
} from '@mui/icons-material'
import {
  ChevronLeftOutlined as ChevronLeftIcon,
  ChevronRightOutlined as ChevronRightIcon,
} from '@mui/icons-material'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  Paper,
  Slide,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'

import DraggableSignatureArea from '@/components/Documents/DraggableSignatureArea'
import { FormFieldArea } from '@/components/Documents/FormFieldArea'
import PDFViewer from '@/components/Documents/PDFViewer'
import FileUploadDialog from '@/components/file-upload/FileUploadDialog'

import { useDocuments } from '@/hooks/useDocuments'
import { useSignatureAreas } from '@/hooks/useSignatureAreas'
import { useTasks } from '@/hooks/useTasks'
import { getStoragePublicUrl, isStorageUrl } from '@/utils/documentUtils'

// Dynamically import SignatureModal to avoid SSR issues
const SignatureModal = dynamic(() => import('@/components/Documents/SignatureModal'), {
  ssr: false,
  loading: () => null,
})

interface SignatureArea {
  id: string
  x: number // percentage from left
  y: number // percentage from top
  width: number // percentage width
  height: number // percentage height
  page?: number // page number (default 1)
  label?: string // label for the signature area
  type?: 'signature' | 'text' | 'date' // field type (default 'signature')
  signed?: boolean
  value?: string // for text/date fields
}

interface CommentWithUser {
  id: string
  comment: string
  user: string
  first_name: string
  last_name: string
  created_at: string
  users: {
    avatar: string | null
  } | null
}

interface DocumentViewerProps {
  // New task-based API
  task?: {
    id: string
    task_id?: string | null
    title: string
    type?: string | null
    meeting_id?: string | null
  } | null
  onSuccess?: () => void

  // Legacy props for backward compatibility
  open?: boolean
  onClose?: () => void
  pdfUrl?: string
  title?: string
  signatureData?: string
  signatureAreas?: SignatureArea[]
  documentId?: string
  taskId?: string
  documentType?: string
  isWebsiteView?: boolean
  onSignatureRequest?: (pageNumber: number, signatureArea: SignatureArea) => void
  onSignatureInsert?: (signatureData: string) => void
  onSubmitSuccess?: () => void
  onApproveSite?: () => Promise<void>
  onRequestRevision?: () => void
  onPdfStateChange?: (formFields: Record<string, string>, signatures: Record<string, string>) => void
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  // New task-based props
  task,
  onSuccess,

  // Legacy props
  open: legacyOpen,
  onClose: legacyOnClose,
  pdfUrl,
  title,
  signatureData,
  signatureAreas = [],
  documentId,
  taskId,
  documentType,
  isWebsiteView = false,
  onSignatureInsert,
  onSubmitSuccess,
  onApproveSite,
  onRequestRevision,
  onPdfStateChange,
}) => {
  // Task-based state management
  const [open, setOpen] = useState(false)
  const [internalSignatureData, setInternalSignatureData] = useState<string>('')
  const [signatureDataMap, setSignatureDataMap] = useState<Record<string, string>>({})
  const [currentSignatureAreaId, setCurrentSignatureAreaId] = useState<string | null>(null)
  const [formFieldValues, setFormFieldValues] = useState<Record<string, string>>({})
  const [documentData, setDocumentData] = useState<{
    url: string
    title: string
    signatureAreas: SignatureArea[]
  } | null>(null)

  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [signatureModalOpen, setSignatureModalOpen] = useState(false)
  const [documentHistory, setDocumentHistory] = useState<
    { event_type: string; user: string; timestamp: string }[]
  >([])
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const [localSignatureAreas, setLocalSignatureAreas] = useState(signatureAreas)
  const prevSignatureAreasRef = useRef(signatureAreas)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [showComments, setShowComments] = useState(true) // Open comments panel by default
  const [showHistory, setShowHistory] = useState(false)
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [comment, setComment] = useState('')
  const [showCommentField, setShowCommentField] = useState(false)

  // NextAuth session
  const { data: session } = useSession()
  const { updateTaskById } = useTasks()
  const {
    getTaskDocument,
    getCommentsForDocument,
    addCommentToDocument,
    uploadDocument,
    addDocumentHistory,
    getDocumentHistory,
  } = useDocuments()
  const { updateSignatureArea } = useSignatureAreas()

  // Handle task-based document fetching
  useEffect(() => {
    if (!task) {
      setOpen(false)
      setDocumentData(null)
      return
    }

    const fetchTaskDocument = async () => {
      try {
        // Use hook to get task document data
        const document = await getTaskDocument(task.id)

        if (!document) {
          // Don't close, proceed with fallback PDF for signature tasks
        }

        // Process the document if found, or use fallback
        // Use document data if available, otherwise use fallback
        let areas: SignatureArea[] = []

        if (
          document &&
          typeof document === 'object' &&
          'signature_areas' in document &&
          Array.isArray(document.signature_areas) &&
          document.signature_areas.length > 0
        ) {
          // Remove duplicates based on id
          const uniqueAreas = document.signature_areas.filter(
            (area: SignatureArea, index: number, self: SignatureArea[]) =>
              index === self.findIndex((a: SignatureArea) => a.id === area.id)
          )

          areas = uniqueAreas.map(
            (area: {
              id: string
              x_position: number
              y_position: number
              width: number
              height: number
              page_number: number
              signature_type?: string
            }) => ({
              id: area.id,
              x: area.x_position,
              y: area.y_position,
              width: area.width,
              height: area.height,
              page: area.page_number,
              label:
                area.signature_type === 'electronic'
                  ? 'Click to sign'
                  : area.signature_type || 'Click to sign',
              signed: false,
            })
          )
        } else {
          // Default signature areas for common form fields
          areas = [
            {
              id: 'temp-signature-area-1',
              x: 20,
              y: 75,
              width: 25,
              height: 5,
              page: 1,
              label: 'Signature',
              type: 'signature',
              signed: false,
            },
            {
              id: 'temp-text-area-1',
              x: 50,
              y: 75,
              width: 25,
              height: 5,
              page: 1,
              label: 'Print Name',
              type: 'text',
              signed: false,
            },
            {
              id: 'temp-date-area-1',
              x: 20,
              y: 82,
              width: 15,
              height: 5,
              page: 1,
              label: 'Date',
              type: 'date',
              signed: false,
            },
          ]
        }

        // Construct the proper URL for the document
        let documentUrl =
          (document &&
            typeof document === 'object' &&
            'url' in document &&
            typeof document.url === 'string'
            ? document.url
            : undefined) ||
          (document &&
            typeof document === 'object' &&
            'file_path' in document &&
            typeof document.file_path === 'string'
            ? document.file_path
            : undefined)

        // If no document URL is found, use a default PDF for demonstration
        if (!documentUrl) {
          documentUrl = '/documents/proxy-guide-2025-250204.pdf'
        }

        // If file_path is just a filename and not a full URL, construct Supabase storage URL
        if (
          documentUrl &&
          !isStorageUrl(documentUrl) &&
          !documentUrl.startsWith('/') &&
          documentUrl.endsWith('.pdf')
        ) {
          documentUrl = getStoragePublicUrl(documentUrl)
        }

        // Only open if we have a valid PDF URL
        if (
          documentUrl &&
          (documentUrl.endsWith('.pdf') || documentUrl.includes('/test-pdf'))
        ) {
          setCurrentDocumentId(
            document &&
              typeof document === 'object' &&
              'id' in document &&
              typeof document.id === 'string'
              ? document.id
              : ''
          )
          setDocumentData({
            url: documentUrl,
            title:
              task.title ||
              (document &&
                typeof document === 'object' &&
                'title' in document &&
                typeof document.title === 'string'
                ? document.title
                : 'Document'),
            signatureAreas: areas,
          })
          setLocalSignatureAreas(areas)
          setOpen(true)
        }
      } catch (error) {
        console.error('Error fetching task document:', error)
      }
    }

    fetchTaskDocument()
  }, [task, getTaskDocument])

  // Determine which props to use (legacy props take absolute priority when provided)
  const actualOpen = legacyOpen !== undefined ? legacyOpen : task ? open : false
  const actualOnClose = useMemo(
    () => legacyOnClose ||
      (task
        ? () => {
          setOpen(false)
        }
        : undefined),
    [legacyOnClose, task, setOpen]
  )
  const actualPdfUrl = pdfUrl ? pdfUrl : task ? documentData?.url : undefined
  const actualTitle = title ? title : task ? documentData?.title : undefined
  const actualSignatureData = signatureData
    ? signatureData
    : task
      ? internalSignatureData
      : undefined

  const handleTaskSubmitSuccess = useCallback(async () => {

    if (task) {
      try {
        const result = await updateTaskById(task.id, { status: 'COMPLETE' })

        onSuccess?.()
        setOpen(false)
      } catch (error) {
        console.error('DocumentViewer: Error in handleTaskSubmitSuccess:', error)
      }
    } else {
      onSubmitSuccess?.()
    }
  }, [task, onSuccess, onSubmitSuccess, updateTaskById])

  const handleTaskSignatureInsert = useCallback(
    (signature: string) => {
      if (task) {
        setInternalSignatureData(signature)
      } else {
        onSignatureInsert?.(signature)
      }
    },
    [task, onSignatureInsert]
  )

  // Sync signature areas when props change (prioritize legacy props)
  useEffect(() => {
    const areasToUse =
      signatureAreas.length > 0 ? signatureAreas : documentData?.signatureAreas || []
    // Only update if the arrays are actually different
    if (JSON.stringify(prevSignatureAreasRef.current) !== JSON.stringify(areasToUse)) {
      setLocalSignatureAreas(areasToUse)
      prevSignatureAreasRef.current = areasToUse
    }
  }, [signatureAreas, documentData?.signatureAreas])

  const handlePositionUpdate = useCallback(
    async (areaId: string, x: number, y: number) => {
      try {
        // Update in database using hook
        const updatedArea = await updateSignatureArea(areaId, {
          x_position: x,
          y_position: y,
        })

        if (!updatedArea) {
          console.error('Failed to update signature area position')
        }

        // Update local state - handle both temp area replacement and position updates
        setLocalSignatureAreas((prev) => {
          // If this is a new area ID (from temp area conversion), replace the temp area
          const tempAreaIndex = prev.findIndex(
            (area) => area.id === 'temp-signature-area'
          )
          const existingAreaIndex = prev.findIndex((area) => area.id === areaId)

          if (tempAreaIndex !== -1 && existingAreaIndex === -1) {
            // Replace temp area with new real area

            const newAreas = [...prev]
            newAreas[tempAreaIndex] = { ...newAreas[tempAreaIndex], id: areaId, x, y }
            return newAreas
          } else {
            // Update existing area position
            return prev.map((area) => (area.id === areaId ? { ...area, x, y } : area))
          }
        })
      } catch (err) {
        console.error('Error in handlePositionUpdate:', err)
      }
    },
    [updateSignatureArea]
  )

  const handleFormFieldChange = useCallback((areaId: string, value: string) => {
    setFormFieldValues((prev) => ({
      ...prev,
      [areaId]: value,
    }))
    // Also update the area's value in local state
    setLocalSignatureAreas((prev) =>
      prev.map((area) => (area.id === areaId ? { ...area, value } : area))
    )
  }, [])

  // Notify parent of PDF state changes (with stable callback to prevent infinite loops)
  const lastStateRef = useRef({ formFieldValues: {}, signatureDataMap: {} })
  useEffect(() => {
    // Only call if state actually changed
    const currentState = { formFieldValues, signatureDataMap }
    const lastState = lastStateRef.current

    const formFieldsChanged = JSON.stringify(currentState.formFieldValues) !== JSON.stringify(lastState.formFieldValues)
    const signaturesChanged = JSON.stringify(currentState.signatureDataMap) !== JSON.stringify(lastState.signatureDataMap)

    if ((formFieldsChanged || signaturesChanged) && onPdfStateChange) {
      onPdfStateChange(formFieldValues, signatureDataMap)
      lastStateRef.current = currentState
    }
  }, [formFieldValues, signatureDataMap, onPdfStateChange])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }, [])

  const onDocumentLoadError = useCallback(() => {
    setIsLoading(false)
  }, [])

  // Fetch document history when document opens
  useEffect(() => {
    const loadDocumentHistory = async () => {
      if (actualOpen && (documentId || actualPdfUrl)) {
        try {
          // Set document ID for API calls
          const docId = documentId || currentDocumentId || 'temp-doc-id'
          if (!currentDocumentId) {
            setCurrentDocumentId(docId)
          }

          // Load document history using API
          const history = await getDocumentHistory(docId)
          setDocumentHistory(history.map(event => ({
            event_type: event.event_type,
            user: event.user,
            timestamp: event.timestamp,
          })))

          // Load comments using hook
          const comments = await getCommentsForDocument(docId)
          const transformedComments = comments.map((comment) => ({
            id: comment.id,
            comment: comment.comment,
            user: comment.user,
            first_name: '',
            last_name: '',
            created_at: comment.created_at,
            users: null,
          })) as CommentWithUser[]
          setComments(transformedComments)
        } catch (error) {
          console.error('Error loading document history:', error)
        }
      }
    }

    loadDocumentHistory()
  }, [actualOpen, documentId, actualPdfUrl, currentDocumentId, getCommentsForDocument, getDocumentHistory])

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1))
  }, [numPages])

  const handleCustomSignature = useCallback((areaId: string) => {
    setCurrentSignatureAreaId(areaId)
    // Open signature modal on top of document viewer
    setSignatureModalOpen(true)
  }, [])

  const handleSignatureModalClose = useCallback(() => {
    setSignatureModalOpen(false)
  }, [])

  const handleSignatureModalInsert = useCallback(
    (signature: string) => {
      // Store signature data for the specific area
      if (currentSignatureAreaId) {
        setSignatureDataMap((prev) => ({
          ...prev,
          [currentSignatureAreaId]: signature,
        }))
      }
      // Also update the single signature data for backward compatibility
      handleTaskSignatureInsert(signature)
      setSignatureModalOpen(false)
      setCurrentSignatureAreaId(null)
    },
    [currentSignatureAreaId, handleTaskSignatureInsert]
  )

  const handleSubmitSignedForm = useCallback(async () => {

    try {
      // Add "Signed" history entry
      if (currentDocumentId) {
        const success = await addDocumentHistory(currentDocumentId, 'Signed')

        if (success) {
          // Refresh document history by fetching latest data
          const history = await getDocumentHistory(currentDocumentId)
          setDocumentHistory(history.map(event => ({
            event_type: event.event_type,
            user: event.user,
            timestamp: event.timestamp,
          })))
        }
      } else {
      }

      // Update task status to Complete
      const taskIdToUpdate = taskId || task?.id

      if (taskIdToUpdate) {
        try {
          await updateTaskById(taskIdToUpdate, { status: 'COMPLETE' })
        } catch (error) {
          console.error('DocumentViewer: Error updating task status:', error)
        }
      } else {
      }

      // Call the submit success handler which will close the dialog
      handleTaskSubmitSuccess()

      // Also ensure we close the dialog directly
      if (actualOnClose) {
        actualOnClose()
      }
    } catch (error) {
      console.error('DocumentViewer: Error in handleSubmitSignedForm:', error)
    }
  }, [
    handleTaskSubmitSuccess,
    currentDocumentId,
    taskId,
    addDocumentHistory,
    getDocumentHistory,
    updateTaskById,
    actualOnClose,
    formFieldValues,
    signatureDataMap,
    task,
  ])

  const handleUploadSignedDocument = useCallback(() => {
    setUploadDialogOpen(true)
  }, [])

  const handleUploadDialogClose = useCallback(() => {
    setUploadDialogOpen(false)
  }, [])

  const handleComments = useCallback(() => {
    setShowComments(!showComments)
    setShowHistory(false) // Hide history when showing comments
  }, [showComments])

  const handleHistory = useCallback(() => {
    setShowHistory(!showHistory)
    setShowComments(false) // Hide comments when showing history
  }, [showHistory])

  // Helper function to format timestamps
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return (
        date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }) + ', Today'
      )
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  const handleAddComment = () => {
    setShowCommentField(true)
    // Smooth scroll to bottom when comment field appears
    setTimeout(() => {
      const commentsContainer = document.querySelector('[data-comments-container]')
      if (commentsContainer) {
        commentsContainer.scrollTo({
          top: commentsContainer.scrollHeight,
          behavior: 'smooth',
        })
      }
    }, 100)
  }

  const handleSubmitComment = async () => {

    if (!comment.trim()) {
      return
    }

    if (!currentDocumentId) {
      return
    }

    try {
      // Save comment using hook
      await addCommentToDocument(currentDocumentId, comment.trim())

      // Create a new comment object for local state
      const newComment = {
        id: `temp_${Date.now()}`,
        comment: comment.trim(),
        user: session?.user?.email || 'current-user',
        first_name: (session?.user?.name || '').split(' ')[0] || 'User',
        last_name: (session?.user?.name || '').split(' ').slice(1).join(' ') || '',
        created_at: new Date().toISOString(),
        users: null,
      }


      // Add new comment to the bottom of the list (chronological order)
      setComments((prev) => [...prev, newComment])

      setComment('')
      setShowCommentField(false)
    } catch (error) {
      console.error('DocumentViewer: Error adding comment:', error)
    }
  }

  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      try {
        if (!currentDocumentId) {
          throw new Error('No document selected to attach uploads to')
        }
        for (const file of files) {
          // Use hook to upload document
          const result = await uploadDocument(file, currentDocumentId)

          if (!result) {
            throw new Error('Failed to upload document')
          }
        }

        setUploadDialogOpen(false)

        // Refresh document history by fetching latest data
        const history = await getDocumentHistory(currentDocumentId)
        setDocumentHistory(history.map(event => ({
          event_type: event.event_type,
          user: event.user,
          timestamp: event.timestamp,
        })))
      } catch (error) {
        console.error('Error uploading files:', error)
        throw error
      }
    },
    [currentDocumentId, uploadDocument, getDocumentHistory]
  )

  return (
    <Dialog
      open={actualOpen}
      onClose={actualOnClose}
      fullScreen
      data-testid="document-viewer"
      slots={{
        transition: Transition,
      }}
    >
      {/* Top Toolbar */}
      <AppBar
        position="static"
        elevation={10}
        color="primary"
        sx={(theme) => ({
          background: theme.vars?.palette.appBarPrimary?.defaultFill,
          color: theme.vars?.palette.appBarPrimary?.defaultContrast,
          boxShadow: theme.shadows[10],
        })}
      >
        <Toolbar sx={{ px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 2 }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={actualOnClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography
              variant="h4"
              whiteSpace="nowrap"
              sx={{ color: 'var(--mui-palette-appBarPrimary-defaultContrast)' }}
            >
              {actualTitle}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {isWebsiteView ? (
              <>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={onRequestRevision}
                  sx={{
                    color: (theme) => theme.vars?.palette.common.white,
                    borderColor: (theme) => theme.vars?.palette.common.white,
                    '&:hover': {
                      borderColor: (theme) => theme.vars.palette.common.white,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Request Revision
                </Button>
                <Button variant="contained" color="success" onClick={onApproveSite}>
                  Approve Site
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    // Create a download link and click it
                    if (actualPdfUrl) {
                      const downloadLink = document.createElement('a')
                      downloadLink.href = actualPdfUrl
                      downloadLink.download = `${actualTitle || 'document'}.pdf`
                      downloadLink.click()
                    }
                  }}
                  sx={{
                    color: (theme) => theme.vars.palette.common.white,
                    borderColor: (theme) => theme.vars.palette.common.white,
                    '&:hover': {
                      borderColor: (theme) => theme.vars.palette.common.white,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Download
                </Button>
                {(documentType === 'signature' ||
                  (task && (task.type === 'signature' || task.type === 'Document' || task.type === 'Authorization'))) && (
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={handleUploadSignedDocument}
                      sx={{
                        color: (theme) => theme.vars.palette.common.white,
                        borderColor: (theme) => theme.vars.palette.common.white,
                        '&:hover': {
                          borderColor: (theme) => theme.vars.palette.common.white,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Upload Signed Document
                    </Button>
                  )}

                {(documentType === 'signature' ||
                  (task && (task.type === 'signature' || task.type === 'Document' || task.type === 'Authorization'))) && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleSubmitSignedForm}
                      sx={{
                        '&:hover': {
                          backgroundColor: (theme) => theme.vars.palette.success.light,
                        },
                      }}
                    >
                      Submit
                    </Button>
                  )}
              </>
            )}

            {/* PDF Navigation */}
            {!isWebsiteView && numPages && numPages > 1 && (
              <>
                <IconButton
                  color="inherit"
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  sx={{
                    '&.Mui-disabled': {
                      color: (theme) => theme.vars.palette.common.white,
                      opacity: 0.5,
                    },
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{ color: (theme) => theme.vars.palette.common.white, mx: 1 }}
                >
                  {pageNumber} / {numPages}
                </Typography>
                <IconButton
                  color="inherit"
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  sx={{
                    '&.Mui-disabled': {
                      color: (theme) => theme.vars.palette.common.white,
                      opacity: 0.5,
                    },
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}

            <Tooltip title="History">
              <IconButton color="inherit" aria-label="history" onClick={handleHistory}>
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Comments">
              <IconButton color="inherit" aria-label="comments" onClick={handleComments}>
                <CommentIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        sx={{
          display: 'flex',
          height: 'calc(100vh - 64px)',
          background: 'var(--mui-palette-background-default)',
        }}
      >
        {/* PDF Viewer or Website Iframe */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: { xs: 1, sm: 2 },
            overflow: 'auto',
            background: 'var(--mui-palette-background-default)',
          }}
        >
          {isWebsiteView ? (
            // Website iframe view
            actualPdfUrl ? (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 1,
                  boxShadow: (theme) => theme.shadows[4],
                  overflow: 'hidden',
                }}
              >
                <iframe
                  src={actualPdfUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  title={actualTitle || 'Website View'}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">No URL provided for website view</Typography>
              </Box>
            )
          ) : (
            // PDF viewer
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                pt: 2,
              }}
            >
              {isLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                  }}
                >
                  <Typography variant="body2">Loading document...</Typography>
                </Box>
              )}

              {/* React-PDF Document Viewer */}
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  width: '100%',
                  maxWidth: '100%',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    maxWidth: '100%',
                    boxShadow: 3,
                    borderRadius: 1,
                    overflow: 'hidden',
                    background: 'white',
                  }}
                >
                  {actualPdfUrl ? (
                    <PDFViewer
                      file={actualPdfUrl}
                      pageNumber={pageNumber}
                      width={Math.min(
                        800,
                        typeof window !== 'undefined'
                          ? window.innerWidth - (showComments || showHistory ? 500 : 100)
                          : 800
                      )}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                    />
                  ) : (
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      minHeight={400}
                    >
                      <div>No PDF URL available</div>
                    </Box>
                  )}

                  {/* Signature and Form Field Area Overlays - positioned relative to the Page */}
                  {localSignatureAreas
                    .filter((area) => (area.page || 1) === pageNumber)
                    .map((area) => {
                      // Check if this is a form field (text or date) based on type or label
                      const fieldType = area.type ||
                        (area.label?.toLowerCase().includes('print name') ? 'text' :
                          area.label?.toLowerCase().includes('name') && !area.label?.toLowerCase().includes('signature') ? 'text' :
                            area.label?.toLowerCase().includes('date') ? 'date' :
                              'signature')

                      if (fieldType === 'text' || fieldType === 'date') {
                        // Render form field for text/date inputs
                        return (
                          <FormFieldArea
                            key={area.id}
                            area={{
                              ...area,
                              type: fieldType as 'text' | 'date',
                              value: formFieldValues[area.id] || area.value || '',
                            }}
                            onValueChange={handleFormFieldChange}
                          />
                        )
                      } else {
                        // Render signature area for signatures
                        const areaSignatureData = signatureDataMap[area.id] || actualSignatureData
                        return (
                          <DraggableSignatureArea
                            key={area.id}
                            area={area}
                            signatureData={areaSignatureData}
                            documentId={currentDocumentId || ''}
                            onClick={() => handleCustomSignature(area.id)}
                            onPositionUpdate={handlePositionUpdate}
                          />
                        )
                      }
                    })}
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Right Side Panel - Only show for PDF documents */}
        {!isWebsiteView && (showComments || showHistory) && (
          <Paper
            elevation={3}
            sx={{
              width: 380,
              background: 'var(--mui-palette-background-paper)',
              borderLeft: (theme) => `1px solid ${theme.vars?.palette.divider}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <Box
              sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'start',
                p: 2,
                py: 1,
                background: theme.vars?.palette.appBarPrimary?.defaultFill,
                color: theme.vars?.palette.appBarPrimary?.defaultContrast,
              })}
            >
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {showComments ? 'Comments' : 'Document History'}
              </Typography>
            </Box>

            {/* Content */}
            {showComments ? (
              /* Comments View */
              <Box
                sx={{
                  p: 1,
                  flex: 1,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                data-comments-container
              >
                <List sx={{ flex: 1 }}>
                  {comments.length > 0 ? (
                    comments.map((commentItem) => (
                      <ListItem key={commentItem.id} divider>
                        <ListItemAvatar>
                          <Avatar
                            src={commentItem.users?.avatar || undefined}
                            sx={{
                              width: 40,
                              height: 40,
                              backgroundColor: (theme) =>
                                theme.vars.palette.secondary.main,
                              borderRadius: 1,
                            }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box
                              component="span"
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'start',
                              }}
                            >
                              <Typography
                                component="span"
                                variant="body3"
                                fontWeight={500}
                              >
                                {`${commentItem.first_name} ${commentItem.last_name}`}
                              </Typography>
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatTimestamp(commentItem.created_at)}
                              </Typography>
                            </Box>
                          }
                          secondary={commentItem.comment}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                          >
                            No comments yet
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    p: 2,
                    borderTop: (theme) => `1px solid ${theme.vars?.palette.divider}`,
                  }}
                >
                  {showCommentField && (
                    <TextField
                      label="Add Comment"
                      aria-label="Add Comment"
                      variant="outlined"
                      size="small"
                      fullWidth
                      multiline
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      autoFocus
                    />
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={showCommentField ? handleSubmitComment : handleAddComment}
                    sx={{ alignSelf: 'flex-end' }}
                  >
                    {showCommentField ? 'Submit Comment' : 'Add Comment'}
                  </Button>
                </Box>
              </Box>
            ) : showHistory ? (
              /* History View */
              <List sx={{ p: 1, flex: 1 }}>
                {documentHistory && documentHistory.length > 0 ? (
                  documentHistory.map((historyItem, index) => (
                    <React.Fragment key={index}>
                      <ListItem dense>
                        <ListItemIcon>
                          {historyItem.event_type === 'Signed' ? (
                            <HistoryIcon />
                          ) : (
                            <UpdateIcon />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={historyItem.event_type}
                          secondary={`${historyItem.user}: ${historyItem.timestamp}`}
                        />
                      </ListItem>
                      {index < documentHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem dense>
                    <ListItemIcon>
                      <UpdateIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="No history available"
                      secondary="Document history will appear here"
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              /* Default View - No panel selected */
              <Box
                sx={{
                  p: 2,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary" align="center">
                  Click History or Comments to view document information
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>

      {/* Signature Modal - Rendered on top of DocumentViewer */}
      {signatureModalOpen && (
        <SignatureModal
          open={signatureModalOpen}
          onClose={handleSignatureModalClose}
          onSignatureInsert={handleSignatureModalInsert}
        />
      )}

      {/* File Upload Dialog for signed documents */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        onUpload={handleUploadFiles}
        meetingId={task?.meeting_id || ''}
        documentType="signed-document"
      />
    </Dialog>
  )
}

export default DocumentViewer
