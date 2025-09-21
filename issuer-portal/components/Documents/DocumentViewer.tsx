'use client'

import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import {
  Close as CloseIcon,
  CommentOutlined as CommentIcon,
  History as HistoryIcon,
  Update as UpdateIcon,
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
  signed?: boolean
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
}) => {
  // Task-based state management
  const [open, setOpen] = useState(false)
  const [internalSignatureData, setInternalSignatureData] = useState<string>('')
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
  } = useDocuments()
  const { updateSignatureArea } = useSignatureAreas()

  // Handle task-based document fetching
  useEffect(() => {
    if (!task || task.type !== 'signature') {
      setOpen(false)
      setDocumentData(null)
      return
    }

    const fetchTaskDocument = async () => {
      try {
        // Use hook to get task document data
        const document = await getTaskDocument(task.id)

        if (!document) {
          console.warn('No document found for task:', task.id)
          setDocumentData(null)
          setOpen(false)
          return
        }

        // Process the document if found
        if (document) {
          let areas: SignatureArea[] = []

          if (document.signature_areas && document.signature_areas.length > 0) {
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
            // Default signature area - only add if no areas exist
            areas = [
              {
                id: 'temp-signature-area',
                x: 20,
                y: 80,
                width: 25,
                height: 8,
                page: 1,
                label: 'Click to sign',
                signed: false,
              },
            ]
          }

          // Construct the proper URL for the document
          let documentUrl = document.url || document.file_path || '/test-pdf.pdf'

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
            setCurrentDocumentId(document.id)
            setDocumentData({
              url: documentUrl,
              title: task.title || document.title,
              signatureAreas: areas,
            })
            setLocalSignatureAreas(areas)
            setOpen(true)
          }
        }
      } catch (error) {
        console.error('Error fetching task document:', error)
      }
    }

    fetchTaskDocument()
  }, [task, getTaskDocument])

  // Determine which props to use (task-based or legacy)
  const actualOpen = task ? open : (legacyOpen ?? false)
  const actualOnClose = task ? () => setOpen(false) : legacyOnClose
  const actualPdfUrl = task ? documentData?.url : pdfUrl
  const actualTitle = task ? documentData?.title : title
  const actualSignatureData = task ? internalSignatureData : signatureData

  const handleTaskSubmitSuccess = useCallback(async () => {
    if (task) {
      try {
        await updateTaskById(task.id, { status: 'COMPLETE' })

        onSuccess?.()
        setOpen(false)
      } catch {}
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

  // Sync signature areas when props change
  useEffect(() => {
    // Only update if the arrays are actually different
    if (
      JSON.stringify(prevSignatureAreasRef.current) !== JSON.stringify(signatureAreas)
    ) {
      setLocalSignatureAreas(signatureAreas)
      prevSignatureAreasRef.current = signatureAreas
    }
  }, [signatureAreas])

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
          // Use hook to get document (placeholder for now)
          console.warn(
            'loadDocumentHistory: Using placeholder data - needs proper document lookup API'
          )

          // Set placeholder values until proper API is implemented
          if (documentId) {
            setCurrentDocumentId(documentId)
          } else {
            setCurrentDocumentId('temp-doc-id')
          }

          setDocumentHistory([])

          // Load comments using hook
          if (currentDocumentId) {
            const comments = await getCommentsForDocument(currentDocumentId)
            const transformedComments = comments.map((comment) => ({
              id: comment.id,
              comment: comment.comment,
              user: comment.userId,
              first_name: '',
              last_name: '',
              created_at: comment.createdAt,
              users: null,
            })) as CommentWithUser[]
            setComments(transformedComments)
          }
        } catch (error) {
          console.error('Error loading document history:', error)
        }
      }
    }

    loadDocumentHistory()
  }, [actualOpen, documentId, actualPdfUrl, currentDocumentId, getCommentsForDocument])

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1))
  }, [numPages])

  const handleCustomSignature = useCallback(() => {
    // Open signature modal on top of document viewer
    setSignatureModalOpen(true)
  }, [])

  const handleSignatureModalClose = useCallback(() => {
    setSignatureModalOpen(false)
  }, [])

  const handleSignatureModalInsert = useCallback(
    (signature: string) => {
      // Pass signature data to parent component
      handleTaskSignatureInsert(signature)
      setSignatureModalOpen(false)
    },
    [handleTaskSignatureInsert]
  )

  const handleSubmitSignedForm = useCallback(async () => {
    try {
      // Add "Signed" history entry
      if (currentDocumentId) {
        const success = await addDocumentHistory(currentDocumentId, 'Signed')
        if (success) {
          // Refresh document history (placeholder)
          console.warn('Document history refresh: Using placeholder - needs proper API')
          setDocumentHistory([])
        }
      }

      // Update task status to Complete
      if (taskId) {
        try {
          await updateTaskById(taskId, { status: 'COMPLETE' })
          // Note: onTaskStatusChange may need to be updated to work with the new task system
          // await onTaskStatusChange(taskId)
        } catch (error) {
          console.error('Error updating task status:', error)
        }
      }

      // Call the submit success handler
      handleTaskSubmitSuccess()
    } catch {}
  }, [handleTaskSubmitSuccess, currentDocumentId, taskId, addDocumentHistory, updateTaskById])

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

    if (!session?.user?.username) {
      return
    }

    try {
      // Save comment using hook
      await addCommentToDocument(currentDocumentId, comment.trim())

      // Create a new comment object for local state
      const newComment = {
        id: `temp_${Date.now()}`,
        comment: comment.trim(),
        user: session.user.username || '',
        first_name: (session.user.name || '').split(' ')[0] || '',
        last_name: (session.user.name || '').split(' ').slice(1).join(' ') || '',
        created_at: new Date().toISOString(),
        users: null,
      }

      // Add new comment to the bottom of the list (chronological order)
      setComments((prev) => [...prev, newComment])

      setComment('')
      setShowCommentField(false)
    } catch (error) {
      console.error('Error adding comment:', error)
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

        // Refresh document history (placeholder)
        console.warn(
          'Document history refresh after upload: Using placeholder - needs proper API'
        )
        setDocumentHistory([])
      } catch (error) {
        console.error('Error uploading files:', error)
        throw error
      }
    },
    [currentDocumentId, uploadDocument]
  )

  return (
    <Dialog
      open={actualOpen}
      onClose={actualOnClose}
      fullScreen
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
                  onClick={() => window.open(actualPdfUrl, '_blank')}
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
                  (task && task.type === 'signature')) && (
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
                  (task && task.type === 'signature')) && (
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
                <Button
                  variant="text"
                  color="inherit"
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  sx={{
                    color: (theme) => theme.vars.palette.common.white,
                    minWidth: 'auto',
                    px: 1,
                  }}
                >
                  ‹
                </Button>
                <Typography
                  variant="body2"
                  sx={{ color: (theme) => theme.vars.palette.common.white, mx: 1 }}
                >
                  {pageNumber} / {numPages}
                </Typography>
                <Button
                  variant="text"
                  color="inherit"
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  sx={{
                    color: (theme) => theme.vars.palette.common.white,
                    minWidth: 'auto',
                    px: 1,
                  }}
                >
                  ›
                </Button>
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
            p: { xs: 1, sm: 3 },
            overflow: 'auto',
          }}
        >
          {isWebsiteView ? (
            // Website iframe view
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
            // PDF viewer
            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
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
              <Box sx={{ position: 'relative', display: 'flex', justifySelf: 'center' }}>
                <PDFViewer
                  file={actualPdfUrl || ''}
                  pageNumber={pageNumber}
                  width={Math.min(
                    800,
                    typeof window !== 'undefined' ? window.innerWidth - 400 : 800
                  )}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                />

                {/* Signature Area Overlays - positioned relative to the Page */}
                {localSignatureAreas
                  .filter((area) => (area.page || 1) === pageNumber)
                  .map((area) => {
                    return (
                      <DraggableSignatureArea
                        key={area.id}
                        area={area}
                        signatureData={actualSignatureData}
                        documentId={currentDocumentId || ''}
                        onClick={handleCustomSignature}
                        onPositionUpdate={handlePositionUpdate}
                      />
                    )
                  })}
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
