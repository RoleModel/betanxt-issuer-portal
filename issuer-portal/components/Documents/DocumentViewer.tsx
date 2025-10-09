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
  CircularProgress,
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
import type { TransitionProps } from '@mui/material/transitions'

import DraggableSignatureArea from '@/components/Documents/DraggableSignatureArea'
import { FormFieldArea } from '@/components/Documents/FormFieldArea'
import OfficeDocumentViewer from '@/components/Documents/OfficeDocumentViewer'
import PDFViewer from '@/components/Documents/PDFViewer'
import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'

import { useDocuments } from '@/hooks/useDocuments'
import { useSignatureAreas } from '@/hooks/useSignatureAreas'
import { useTasks } from '@/hooks/useTasks'
import { getStoragePublicUrl, isStorageUrl } from '@/utils/documentUtils'
import {
  convertDataUriToPdfBytes,
  embedSignaturesIntoPDF,
} from '@/utils/pdfSignatureEmbed'

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
  fileUrl?: string
  title?: string
  signatureData?: string
  signatureAreas?: SignatureArea[]
  documentId?: string
  showHistoryButton?: boolean
  showCommentButton?: boolean
  /** When true, completely hides both History & Comment buttons and their side panel */
  hideActivityButtons?: boolean
  taskId?: string
  documentType?: string
  isWebsiteView?: boolean
  onSignatureRequest?: (pageNumber: number, signatureArea: SignatureArea) => void
  onSignatureInsert?: (signatureData: string) => void
  onSubmitSuccess?: () => void
  onApproveSite?: () => Promise<void>
  onRequestRevision?: () => void
  onPdfStateChange?: (
    formFields: Record<string, string>,
    signatures: Record<string, string>
  ) => void
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
  fileUrl,
  title,
  showCommentButton = true,
  showHistoryButton = true,
  hideActivityButtons = false,
  signatureData,
  signatureAreas = [],
  documentId,
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
  const [currentSignatureAreaId, setCurrentSignatureAreaId] = useState<string | null>(
    null
  )
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
  const [localSignatureAreas, setLocalSignatureAreas] = useState<SignatureArea[]>([])
  const prevSignatureAreasRef = useRef<SignatureArea[]>([])
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [showComments, setShowComments] = useState(true) // Open comments panel by default (can be disabled by hideActivityButtons)
  const [showHistory, setShowHistory] = useState(false)
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [comment, setComment] = useState('')
  const [showCommentField, setShowCommentField] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // NextAuth session
  const { data: session } = useSession()
  // Pass the meetingId from the task to ensure we're updating the right context
  const { updateTaskById } = useTasks(task?.meeting_id || undefined)
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
        } else if (!signatureAreas || signatureAreas.length === 0) {
          // If signatureAreas is explicitly an empty array, we're in view-only mode (no signature areas)
          // If signatureAreas is undefined/null, use default signature areas
          if (signatureAreas && signatureAreas.length === 0) {
            // View-only mode - no signature areas
            areas = []
          } else {
            // Only use default signature areas if none were passed as props
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
        } else {
          // Use the signature areas passed as props
          areas = signatureAreas
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
          // Prioritize documentId prop over fetched document ID
          const docId =
            documentId ||
            (document &&
            typeof document === 'object' &&
            'id' in document &&
            typeof document.id === 'string'
              ? document.id
              : `doc-${task.id || Date.now()}`)
          setCurrentDocumentId(docId)
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
          // Only set local signature areas if we don't already have them from props
          if (!signatureAreas || signatureAreas.length === 0) {
            setLocalSignatureAreas(areas)
          }
          setOpen(true)
        }
      } catch {
        // Error fetching task document
      }
    }

    void fetchTaskDocument()
  }, [task, getTaskDocument, signatureAreas.length, signatureAreas, documentId])

  // Determine which props to use (legacy props take absolute priority when provided)
  const actualOpen = legacyOpen !== undefined ? legacyOpen : task ? open : false
  const actualOnClose = useMemo(
    () =>
      legacyOnClose ||
      (task
        ? () => {
            setOpen(false)
          }
        : undefined),
    [legacyOnClose, task]
  )
  const actualfileUrl = useMemo(
    () => (fileUrl ? fileUrl : task ? documentData?.url : undefined),
    [fileUrl, task, documentData?.url]
  )
  const actualTitle = useMemo(
    () => (title ? title : task ? documentData?.title : undefined),
    [title, task, documentData?.title]
  )

  // Determine file type from URL
  const fileExtension = useMemo(() => {
    if (!actualfileUrl) return null
    const urlParts = actualfileUrl.split('.')
    return urlParts[urlParts.length - 1]?.toLowerCase()
  }, [actualfileUrl])

  const isPDF =
    fileExtension === 'pdf' ||
    actualfileUrl?.includes('/test-pdf') ||
    actualfileUrl?.startsWith('data:application/pdf')
  const isOfficeDocument = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(
    fileExtension || ''
  )
  const actualSignatureData = signatureData
    ? signatureData
    : task
      ? internalSignatureData
      : undefined

  // Initialize with a stable ID based on available props
  const getStableDocumentId = useCallback(() => {
    if (documentId) return documentId
    if (actualfileUrl || fileUrl) {
      const url = actualfileUrl || fileUrl || ''
      const urlHash =
        url
          .split('/')
          .pop()
          ?.replace(/[^a-zA-Z0-9]/g, '') ||
        btoa(url)
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 20)
      return `doc-${urlHash}`
    }
    if (actualTitle || title) {
      const docTitle = actualTitle || title || ''
      return `doc-${docTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
    }
    return `temp-doc-${Date.now()}`
  }, [documentId, actualfileUrl, fileUrl, actualTitle, title])

  const handleTaskSubmitSuccess = useCallback(async () => {
    // Call onSubmitSuccess if available (let parent handle status update)
    if (onSubmitSuccess) {
      onSubmitSuccess?.()
    } else if (task) {
      // Only update to COMPLETE if no custom handler provided
      try {
        await updateTaskById(task.id, { status: 'COMPLETE' })
        if (onSuccess) {
          onSuccess?.()
        }
      } catch {
        // Error updating task status
      }
    }
    setOpen(false)
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

  // Track the last document to detect changes
  const lastDocumentKeyRef = useRef<string>('')

  // Create a stable document key
  const documentKey = useMemo(
    () => `${actualfileUrl || 'none'}-${documentId || 'none'}`,
    [actualfileUrl, documentId]
  )

  // Reset signature data only when document key actually changes
  useEffect(() => {
    if (documentKey !== lastDocumentKeyRef.current && documentKey !== 'none-none') {
      // Clear all signature-related state for the new document
      setSignatureDataMap({})
      setFormFieldValues({})
      setInternalSignatureData('')
      setCurrentSignatureAreaId(null)

      // Update the ref to track this document
      lastDocumentKeyRef.current = documentKey
    }
  }, [documentKey]) // Only depend on the memoized document key

  const handlePositionUpdate = useCallback(
    async (areaId: string, x: number, y: number) => {
      try {
        // Update in database using hook
        const updatedArea = await updateSignatureArea(areaId, {
          x_position: x,
          y_position: y,
        })

        if (!updatedArea) {
          // Failed to update signature area position
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
      } catch {
        // Error in handlePositionUpdate
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

    const formFieldsChanged =
      JSON.stringify(currentState.formFieldValues) !==
      JSON.stringify(lastState.formFieldValues)
    const signaturesChanged =
      JSON.stringify(currentState.signatureDataMap) !==
      JSON.stringify(lastState.signatureDataMap)

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

  // Set the current document ID when the dialog opens
  useEffect(() => {
    if (actualOpen && !currentDocumentId) {
      const docId = getStableDocumentId()
      setCurrentDocumentId(docId)
    }
  }, [actualOpen, currentDocumentId, getStableDocumentId])

  // Fetch document history when document opens and we have an ID
  useEffect(() => {
    const loadDocumentHistory = async () => {
      if (!actualOpen || !currentDocumentId) return

      try {
        // Load document history using API
        const history = await getDocumentHistory(currentDocumentId)
        setDocumentHistory(
          history.map((event) => ({
            event_type: event.event_type,
            user: event.user,
            timestamp: event.timestamp,
          }))
        )

        // Load comments using hook
        const comments = await getCommentsForDocument(currentDocumentId)
        const transformedComments = comments.map((comment) => ({
          id: comment.id,
          comment: comment.comment,
          user: comment.user,
          first_name: comment.first_name || comment.user?.split('@')[0] || 'User',
          last_name: comment.last_name || '',
          created_at: comment.created_at,
          users: comment.users || null,
        })) as CommentWithUser[]
        setComments(transformedComments)
      } catch (error) {
        console.error('[DocumentViewer] Error loading document history/comments:', error)
      }
    }

    void loadDocumentHistory()
  }, [actualOpen, currentDocumentId, getCommentsForDocument, getDocumentHistory])

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
        setSignatureDataMap((prev) => {
          const updated = {
            ...prev,
            [currentSignatureAreaId]: signature,
          }
          return updated
        })
      }
      // Also update the single signature data for backward compatibility
      handleTaskSignatureInsert(signature)
      setSignatureModalOpen(false)
      setCurrentSignatureAreaId(null)
    },
    [currentSignatureAreaId, handleTaskSignatureInsert]
  )

  const handleSubmitSignedForm = useCallback(async () => {
    setIsSubmitting(true)
    try {
      // Generate a PDF blob with the signatures and form data
      // Get the current PDF URL and fetch it
      const fileUrlToUse = actualfileUrl || fileUrl
      if (fileUrlToUse) {
        let pdfBytes: Uint8Array

        // Get the original PDF bytes
        if (fileUrlToUse.startsWith('data:')) {
          // For data URIs, convert directly to bytes
          pdfBytes = await convertDataUriToPdfBytes(fileUrlToUse)
        } else {
          // For regular URLs, fetch the PDF
          const response = await fetch(fileUrlToUse)
          const arrayBuffer = await response.arrayBuffer()
          pdfBytes = new Uint8Array(arrayBuffer)
        }

        // Embed signatures and form data into the PDF
        const modifiedPdfBytes = await embedSignaturesIntoPDF({
          pdfBytes,
          signatureDataMap,
          formFieldValues,
          signatureAreas: localSignatureAreas,
        })

        // Create a file from the modified PDF (ensure ArrayBuffer for File parts typing)
        const fileName = `signed_${currentDocumentId || 'document'}_${Date.now()}.pdf`
        // Copy into a fresh Uint8Array to guarantee BlobPart typing (avoid SharedArrayBuffer narrowing issue)
        const copy = new Uint8Array(modifiedPdfBytes.byteLength)
        copy.set(modifiedPdfBytes)
        const file = new File([copy], fileName, { type: 'application/pdf' })

        // Upload the signed document
        if (currentDocumentId && uploadDocument) {
          try {
            const baseTitle = actualTitle || task?.title || 'Document'
            const documentTitle = baseTitle.includes(' - Signed')
              ? baseTitle
              : `${baseTitle} - Signed`
            const meetingId =
              typeof task?.meeting_id === 'string' ? task?.meeting_id : undefined

            // Preserve form type in documentId (plan-file-request, broadridge-form, etc)
            // Insert -signed- after the form type prefix to maintain document type detection
            let documentIdForUpload = currentDocumentId

            if (!documentIdForUpload.includes('-signed-')) {
              // If it starts with a form type (e.g., plan-file-request-123), insert -signed- after first part
              if (
                /^(plan-file-request|broadridge-form|transfer-agent-request)-/.exec(documentIdForUpload)
              ) {
                documentIdForUpload = documentIdForUpload.replace(
                  /^([^-]+-[^-]+-[^-]+)/,
                  '$1-signed'
                )
              } else {
                // Otherwise append -signed- to the end
                documentIdForUpload = `${documentIdForUpload}-signed-${Date.now()}`
              }
            }

            const uploadPath = await uploadDocument(
              file,
              documentIdForUpload,
              meetingId,
              documentTitle,
              task?.id
            )
            if (!uploadPath) {
              throw new Error(
                'Unable to save signed document. Please try again or contact support if the issue persists.'
              )
            }
          } catch (uploadError) {
            throw uploadError
          }
        } else {
        }
      }

      // Add "Signed" history entry
      if (currentDocumentId) {
        const success = await addDocumentHistory(currentDocumentId, 'SIGNED')

        if (success) {
          // Refresh document history by fetching latest data
          const history = await getDocumentHistory(currentDocumentId)
          setDocumentHistory(
            history.map((event) => ({
              event_type: event.event_type,
              user: event.user,
              timestamp: event.timestamp,
            }))
          )
        }
      }

      // Call the submit success handler which will update task and close the dialog
      // handleTaskSubmitSuccess will handle the task status update
      void handleTaskSubmitSuccess()

      // Also ensure we close the dialog directly
      if (actualOnClose) {
        actualOnClose()
      }
    } catch (error) {
      // Show error to user
      alert(
        `Failed to submit signed document: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [
    handleTaskSubmitSuccess,
    currentDocumentId,
    addDocumentHistory,
    getDocumentHistory,
    actualOnClose,
    task,
    actualfileUrl,
    fileUrl,
    uploadDocument,
    signatureDataMap,
    formFieldValues,
    localSignatureAreas,
    actualTitle,
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

  // Disable activity panels entirely if hideActivityButtons is true
  useEffect(() => {
    if (hideActivityButtons) {
      if (showComments) setShowComments(false)
      if (showHistory) setShowHistory(false)
    }
  }, [hideActivityButtons, showComments, showHistory])

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
      // Extract user information from session
      const userFirstName = (session?.user?.name || '').split(' ')[0] || 'User'
      const userLastName = (session?.user?.name || '').split(' ').slice(1).join(' ') || ''
      const userId = session?.user?.email || 'current-user'

      // Save comment using hook with user information
      await addCommentToDocument(currentDocumentId, comment.trim(), {
        firstName: userFirstName,
        lastName: userLastName,
        userId: userId,
      })

      // Create a new comment object for local state
      const newComment = {
        id: `temp_${Date.now()}`,
        comment: comment.trim(),
        user: userId,
        first_name: userFirstName,
        last_name: userLastName,
        created_at: new Date().toISOString(),
        users: null,
      }

      // Add new comment to the bottom of the list (chronological order)
      setComments((prev) => [...prev, newComment])

      setComment('')
      setShowCommentField(false)
    } catch (error) {
      console.error('[DocumentViewer] Error adding comment:', error)
      alert(
        `Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
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
          const meetingId =
            typeof task?.meeting_id === 'string' ? task?.meeting_id : undefined
          const result = await uploadDocument(file, currentDocumentId, meetingId)

          if (!result) {
            throw new Error('Failed to upload document')
          }
        }

        setUploadDialogOpen(false)

        // Refresh document history by fetching latest data
        const history = await getDocumentHistory(currentDocumentId)
        setDocumentHistory(
          history.map((event) => ({
            event_type: event.event_type,
            user: event.user,
            timestamp: event.timestamp,
          }))
        )
      } catch (error) {
        throw error
      }
    },
    [currentDocumentId, uploadDocument, getDocumentHistory, task]
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
                {isPDF &&
                  (documentType === 'signature' ||
                    (task &&
                      (task.type === 'signature' ||
                        task.type === 'Document' ||
                        task.type === 'Authorization'))) && (
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

                {isPDF &&
                  (documentType === 'signature' ||
                    (task &&
                      (task.type === 'signature' ||
                        task.type === 'Document' ||
                        task.type === 'Authorization'))) &&
                  localSignatureAreas.length > 0 && // Only show submit button if there are signature areas (not view-only mode)
                  (() => {
                    // Check if all required fields are complete
                    // Since all areas have undefined type, detect field type by ID/label
                    const allFieldsComplete = localSignatureAreas.every((area) => {
                      // Check if it's filled based on what storage it should use
                      let hasValue = false

                      // Detect field type by ID or label
                      if (
                        area.id?.includes('sig') ||
                        (area.label?.toLowerCase().includes('signature') &&
                          !area.label?.toLowerCase().includes('print'))
                      ) {
                        // Signature field - check signatureDataMap
                        hasValue = !!signatureDataMap[area.id]
                      } else {
                        // Text/date field - check formFieldValues
                        hasValue = !!formFieldValues[area.id]
                      }

                      return hasValue
                    })

                    return (
                      <Tooltip
                        title={
                          !allFieldsComplete
                            ? 'Please complete all required fields and signatures'
                            : ''
                        }
                        placement="top"
                      >
                        <Button
                          variant="contained"
                          color="success"
                          onClick={
                            allFieldsComplete && !isSubmitting
                              ? handleSubmitSignedForm
                              : undefined
                          }
                          startIcon={
                            isSubmitting ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : undefined
                          }
                          sx={{
                            opacity: allFieldsComplete && !isSubmitting ? 1 : 0.65,
                            cursor:
                              allFieldsComplete && !isSubmitting
                                ? 'pointer'
                                : 'not-allowed',
                            pointerEvents: 'auto',
                            '&:hover': {
                              backgroundColor: (theme) =>
                                allFieldsComplete && !isSubmitting
                                  ? theme.vars.palette.success.light
                                  : theme.vars.palette.success.main,
                            },
                          }}
                        >
                          {isSubmitting ? 'Sending…' : 'Submit'}
                        </Button>
                      </Tooltip>
                    )
                  })()}
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
                  variant="body3"
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

            {!hideActivityButtons && showHistoryButton && (
              <Tooltip title="History">
                <IconButton color="inherit" aria-label="history" onClick={handleHistory}>
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            )}
            {!hideActivityButtons && showCommentButton && (
              <Tooltip title="Comments">
                <IconButton
                  color="inherit"
                  aria-label="comments"
                  onClick={handleComments}
                >
                  <CommentIcon />
                </IconButton>
              </Tooltip>
            )}
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
            actualfileUrl ? (
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
                  src={actualfileUrl}
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
                <Typography variant="body3">No URL provided for website view</Typography>
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
                  <Typography variant="body3">Loading document...</Typography>
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
                    background: (theme) => theme.vars.palette.common.white,
                  }}
                >
                  {actualfileUrl ? (
                    isPDF ? (
                      <PDFViewer
                        file={actualfileUrl}
                        pageNumber={pageNumber}
                        width={Math.min(
                          800,
                          typeof window !== 'undefined'
                            ? window.innerWidth -
                                (showComments || showHistory ? 500 : 100)
                            : 800
                        )}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                      />
                    ) : isOfficeDocument ? (
                      <OfficeDocumentViewer
                        url={actualfileUrl}
                        title={actualTitle}
                        fileType={fileExtension || undefined}
                      />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          gap: 2,
                        }}
                      >
                        <Typography variant="h6">Unsupported file type</Typography>
                        <Typography variant="body3" color="text.secondary">
                          This file type ({fileExtension}) cannot be previewed
                        </Typography>
                      </Box>
                    )
                  ) : (
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      minHeight={400}
                    >
                      <div>No document URL available</div>
                    </Box>
                  )}

                  {/* Signature and Form Field Area Overlays - positioned relative to the Page */}
                  {localSignatureAreas
                    .filter((area) => (area.page || 1) === pageNumber)
                    .map((area) => {
                      // Check if this is a form field (text or date) based on type or label
                      const fieldType =
                        area.type ||
                        (area.label?.toLowerCase().includes('print name')
                          ? 'text'
                          : area.label?.toLowerCase().includes('name') &&
                              !area.label?.toLowerCase().includes('signature')
                            ? 'text'
                            : area.label?.toLowerCase().includes('date')
                              ? 'date'
                              : 'signature')

                      if (fieldType === 'text' || fieldType === 'date') {
                        // Render form field for text/date inputs
                        return (
                          <FormFieldArea
                            key={area.id}
                            area={{
                              ...area,
                              type: fieldType,
                              value: formFieldValues[area.id] || area.value || '',
                            }}
                            onValueChange={handleFormFieldChange}
                          />
                        )
                      } else {
                        // Render signature area for signatures
                        const areaSignatureData =
                          signatureDataMap[area.id] || actualSignatureData
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
        {!isWebsiteView && !hideActivityButtons && (showComments || showHistory) && (
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
                            variant="body3"
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
                <Typography variant="body3" color="text.secondary" align="center">
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
