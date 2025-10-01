'use client'

import { Global } from '@emotion/react'
import { jsPDF } from 'jspdf'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'
import type { FileRejection } from 'react-dropzone'

import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Snackbar,
  Stack,
  SwipeableDrawer,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'

import TaskEditDialog from '@/components/Dialogs/TaskEditDialog'
import DocumentViewer from '@/components/Documents/DocumentViewer'
import ApprovalDrawer from '@/components/Drawers/ApprovalDrawer'
import DrawerTaskItem from '@/components/Drawers/DrawerTaskItem'
import BNFileDropzone from '@/components/FileUpload/BNFileDropzone'
import TaskContextMenu from '@/components/ui/TaskContextMenu'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { useMeeting } from '@/contexts/MeetingContext'
import { useClients } from '@/hooks/useClients'
import { useDocuments } from '@/hooks/useDocuments'
import { usePhases } from '@/hooks/usePhases'
import { useTasks } from '@/hooks/useTasks'
import { getBrowserSupabase } from '@/lib/browserSupabase'
import type { KeyDate, Task } from '@/types/api-exports'
import type { ContextMenuPosition } from '@/types/common'
import { handleFormDownload, handleFormSign } from '@/utils/broadridgeFormHandler'
import { calculateDaysUntil, formatDaysUntil, friendlyDate } from '@/utils/dateUtils'
import {
  handleFormDownload as handlePlanFormDownload,
  handleFormSign as handlePlanFormSign,
} from '@/utils/planFileRequestForm'
import { TaskLink } from '@/utils/taskLinks'
import {
  handleFormDownload as handleTransferAgentDownload,
  handleFormSign as handleTransferAgentSign,
} from '@/utils/transferAgentRequestForm'

// Phase URL type for UI
type PhaseUrl = { title: string; description?: string; url?: string }

// Signature area type (should match DocumentViewer interface)
type SignatureArea = {
  id: string
  x: number
  y: number
  width: number
  height: number
  page?: number
  label?: string
  signed?: boolean
}

// Swipeable drawer constants
const drawerBleeding = 60

// Styled components for swipeable drawer
const StyledBox = styled('div')(({ theme }) => ({
  backgroundColor: theme.vars?.palette.background.default,
}))

const Puller = styled('div')(({ theme }) => ({
  width: 30,
  height: 6,
  backgroundColor: theme.vars?.palette.divider || '#e0e0e0',
  borderRadius: 3,
  position: 'absolute',
  top: 8,
  left: 'calc(50% - 15px)',
}))

// Remove duplicate SignatureArea - use from DocumentViewer if needed

interface PhaseDrawerProps {
  open: boolean
  onClose: () => void
  phase: number
  onPhaseChange?: (newPhase: number) => void
  onTaskClick?: (taskId: string) => void
}

const PhaseDrawer: React.FC<PhaseDrawerProps> = (props) => {
  const { open, onClose, phase = 1, onPhaseChange } = props

  // Get active meeting and tasks from context
  const {
    currentMeeting,
    tasks,
    tasksLoading,
    refreshMeetingData,
    keyDates: meetingKeyDates,
    setCurrentMeeting,
  } = useMeeting()

  // Session and routing
  const { data: session } = useSession()
  const router = useRouter()

  // Tasks and documents hooks
  const { updateTaskById, refetch } = useTasks(currentMeeting?.id)
  const { createNewDocument, addDocumentHistory, getDocumentsByMeeting } = useDocuments()

  // Mobile detection
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Get phases using the proper hook
  const {
    phases,
    loading: phaseLoading,
    error: phaseError,
  } = usePhases(currentMeeting?.id)

  // Get client data for form generation
  const params = useParams()
  const clientTicker = params?.clientTicker as string

  const { clients } = useClients()
  const currentClient = clients.find((client) => client.ticker === clientTicker)

  // Create client data for form generation
  const clientData = useMemo(
    () =>
      currentClient
        ? {
            issuerName: currentClient.company_name || currentClient.short_name || '',
            contactName: currentClient.primary_contact || '',
            email: currentClient.primary_contact_email || '',
          }
        : undefined,
    [currentClient]
  )

  const [currentView, setCurrentView] = useState<'overview' | 'upload'>('overview')

  // Determine current phase from MeetingContext, fallback to prop, then 1
  const currentPhaseNumber = React.useMemo(() => {
    const label = currentMeeting?.currentPhase || `Phase ${phase || 1}`
    const parsed = parseInt(label.replace('Phase ', ''))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : phase || 1
  }, [currentMeeting?.currentPhase, phase])
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadTaskTitle, setUploadTaskTitle] = useState('')
  const [hasUnsupportedFiles, setHasUnsupportedFiles] = useState(false)
  const [mobileUploadOpen, setMobileUploadOpen] = useState(false)
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [documentUrl, setDocumentUrl] = useState<string>('')
  const [documentTitle, setDocumentTitle] = useState<string>('')
  const [signatureAreas, setSignatureAreas] = useState<SignatureArea[]>([])
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false)
  const [approvalDocumentUrl, setApprovalDocumentUrl] = useState<string>('')
  const [approvalTitle, setApprovalTitle] = useState<string>('')
  const [currentDocumentId, setCurrentDocumentId] = useState<string>('')
  const [currentTaskForDocument, setCurrentTaskForDocument] = useState<Task | null>(null)
  const [pdfFormState, setPdfFormState] = useState<{
    formFields: Record<string, string>
    signatures: Record<string, string>
  }>({ formFields: {}, signatures: {} })
  const [phaseCompleteAlert, setPhaseCompleteAlert] = useState<{
    open: boolean
    title: string
    message: string
  }>({ open: false, title: '', message: '' })

  // Context menu states
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [TaskEditDialogOpen, setTaskEditDialogOpen] = useState(false)
  const [tasksWithSignedDocs, setTasksWithSignedDocs] = useState<Set<string>>(new Set())

  // Get theme and phase color using theme palette
  const phaseColor = theme.vars.palette.phase[currentPhaseNumber - 1].main
  const phaseContrast = theme.vars.palette.phase[currentPhaseNumber - 1].contrastText

  // Find the current phase data
  const currentPhaseData = phases.find((p) => p.orderIndex === currentPhaseNumber)
  const phaseTitle = currentPhaseData?.name || `Phase ${currentPhaseNumber}`

  // Filter tasks for the current phase from context and cast to TaskWithLinks
  // Memoize filtered tasks for performance
  const phaseTasks = useMemo(
    () => tasks.filter((task) => task.phaseNumber === currentPhaseNumber),
    [tasks, currentPhaseNumber]
  )

  // Check for signed documents for all phase tasks (moved outside useEffect for reuse)
  const checkSignedDocuments = useCallback(async () => {
    if (!currentMeeting?.id || phaseTasks.length === 0) return

    try {
      const meetingDocuments = await getDocumentsByMeeting(currentMeeting.id)

      const taskIdsWithSignedDocs = new Set<string>()

      phaseTasks.forEach((task) => {
        const matchingDocs = meetingDocuments.filter(
          (doc) => doc.taskId === (task.taskId || task.id) && doc.type === 'signed-form'
        )

        if (matchingDocs.length > 0) {
          if (task.id) {
            taskIdsWithSignedDocs.add(task.id)
          }
        } else if (
          task.status === 'SUBMITTED_AWAITING_RECORD_DATE' ||
          task.status === 'PENDING_AUTHORIZATION'
        ) {
        }
      })

      setTasksWithSignedDocs(taskIdsWithSignedDocs)
    } catch (error) {
      console.error('Failed to check for signed documents:', error)
    }
  }, [currentMeeting?.id, phaseTasks, getDocumentsByMeeting])

  // Run check when drawer opens or dependencies change
  React.useEffect(() => {
    if (open) {
      checkSignedDocuments()
    }
  }, [open, checkSignedDocuments])

  // Get key dates for current phase from MeetingContext
  const keyDates: KeyDate[] = React.useMemo(() => {
    // Check if phase data has key dates
    if (currentPhaseData?.keyDates && Object.keys(currentPhaseData.keyDates).length > 0) {
      // If phase has specific key dates in the phase data, use those
      const result = Object.entries(currentPhaseData.keyDates)
        .filter(([, value]) => value)
        .map(([key, value]) => ({
          id: key,
          title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
          phaseNumber: currentPhaseNumber,
          date: value as string,
        }))
      if (result.length > 0) {
        return result
      }
    }

    // Use key dates from MeetingContext (with correct phase assignments)
    // Exclude pre-filing dates
    const filtered = meetingKeyDates.filter((kd) => {
      const title = kd.title?.toLowerCase() || ''
      const isPreFiling =
        title.includes('pre-fil') ||
        title.includes('prefil') ||
        title === 'pre filing date' ||
        title === 'pre-filing date'
      return kd.phaseNumber === currentPhaseNumber && !isPreFiling
    })

    // If no dates found for the current phase, show dates without phase assignment for debugging
    if (filtered.length === 0 && meetingKeyDates.length > 0) {
      // For phase 1, show only filing date (not pre-filing)
      if (currentPhaseNumber === 1) {
        const phase1Dates = meetingKeyDates.filter((kd) => {
          const title = kd.title?.toLowerCase() || ''
          return (
            title.includes('filing') &&
            !title.includes('pre-filing') &&
            !title.includes('pre filing') &&
            !title.includes('prefiling')
          )
        })
        if (phase1Dates.length > 0) {
          return phase1Dates
        }
      }
    }
    return filtered
  }, [currentPhaseData, meetingKeyDates, currentPhaseNumber])

  // URLs would come from phase data if available (currently not in our schema)
  const urls: PhaseUrl[] = []

  const handleFilesSelected = (newFiles: File[]) => {
    setUploadFiles((prev) => [...prev, ...newFiles])
    setHasUnsupportedFiles(false)
  }

  const handleFileRejections = (fileRejections: FileRejection[]) => {
    const hasUnsupportedType = fileRejections.some((rejection) =>
      rejection.errors.some((error) => error.code === 'file-invalid-type')
    )
    if (hasUnsupportedType) {
      setHasUnsupportedFiles(true)
    }
  }

  // Callback to receive PDF state from DocumentViewer
  const handlePdfStateChange = (
    formFields: Record<string, string>,
    signatures: Record<string, string>
  ) => {
    setPdfFormState({ formFields, signatures })
  }

  // Generate filled PDF with form data and signatures
  const generateFilledPDF = async (taskTitle: string): Promise<Blob> => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    })

    // Add header
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(`${taskTitle} - Completed`, 20, 20)

    // Add form fields data
    let yPosition = 40
    doc.setFontSize(12)
    doc.text('Form Fields:', 20, yPosition)
    yPosition += 10

    Object.entries(pdfFormState.formFields).forEach(([fieldId, value]) => {
      if (value) {
        doc.text(`${fieldId}: ${value}`, 25, yPosition)
        yPosition += 8
      }
    })

    // Add signatures data
    if (Object.keys(pdfFormState.signatures).length > 0) {
      yPosition += 10
      doc.text('Signatures:', 20, yPosition)
      yPosition += 10

      Object.entries(pdfFormState.signatures).forEach(([areaId, signature]) => {
        if (signature) {
          doc.text(`${areaId}: [Signed]`, 25, yPosition)
          yPosition += 8
        }
      })
    }

    // Add completion timestamp
    yPosition += 10
    doc.text(`Completed: ${new Date().toLocaleString()}`, 20, yPosition)

    return doc.output('blob')
  }

  // Check if all tasks in the current phase are complete and auto-advance to next phase
  const checkAndCompletePhase = async (taskWithPhase: Task | null) => {
    if (!taskWithPhase?.phaseNumber || taskWithPhase.phaseNumber <= 0) {
      return
    }

    const currentPhaseNumber = taskWithPhase.phaseNumber

    // Delay to ensure database is fully updated
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Refresh tasks to get latest status
    refetch()

    // Get all tasks for the current phase (excluding BetaNXT and DFIN owned tasks)
    const currentPhaseTasks = tasks.filter(
      (t) =>
        t.phaseNumber === currentPhaseNumber &&
        !['BetaNXT', 'DFIN'].includes(t.owner || '')
    )

    // Define statuses that indicate task has been initiated/acted upon
    const initiatedStatuses = [
      'COMPLETE',
      'AUTHORIZED',
      'SUBMITTED_AWAITING_RECORD_DATE',
      'WAITING_FOR_FORM_RETURN',
      'REQUEST_FORM_TO_FOLLOW',
      'PENDING_AUTHORIZATION',
    ]

    // Check if all phase tasks have been initiated
    const allPhaseTasksInitiated =
      currentPhaseTasks.length > 0 &&
      currentPhaseTasks.every((t) => initiatedStatuses.includes(t.status || ''))

    if (allPhaseTasksInitiated) {
      // Update meeting to next phase and calculate completion percentage
      if (currentMeeting?.id) {
        try {
          const client = await buildApiClient()

          // Calculate overall completion
          const allTasks = tasks
          const completedTasks = allTasks.filter((t) =>
            initiatedStatuses.includes(t.status || '')
          ).length
          const overallCompletion = Math.round((completedTasks / allTasks.length) * 100)

          const nextPhaseNumber = currentPhaseNumber + 1

          const updatePayload = {
            currentPhase: `Phase ${nextPhaseNumber}`,
            overallCompletion: overallCompletion,
          }

          // Update meeting phase and completion
          const updateResult = await client.PUT('/meetings/{meetingId}', {
            params: {
              path: { meetingId: currentMeeting.id },
            },
            body: updatePayload,
          })

          if (!updateResult.error) {
            // Refresh meeting data to update the context with new phase
            await refreshMeetingData()
          }
        } catch (error) {
          console.error('Failed to auto-advance meeting phase', error)
        }
      }

      // Get user name and meeting title for personalized message
      const userName = session?.user?.name || 'User'
      const meetingTitle = currentMeeting?.title || 'Shareholder Meeting'
      const nextPhaseNumber = currentPhaseNumber + 1

      // Show personalized success message
      const successTitle = `Phase ${currentPhaseNumber} Wrapped Up – Time for Phase ${nextPhaseNumber}`
      const successMessage = `Great news! ${userName}, you completed Phase ${currentPhaseNumber} of ${meetingTitle}. You can now start Phase ${nextPhaseNumber} — check the updated tasks and timelines to keep things moving smoothly.`

      setPhaseCompleteAlert({
        open: true,
        title: successTitle,
        message: successMessage,
      })

      // Close drawer and navigate to next phase after delay
      setTimeout(() => {
        onClose()
        const nextPhasePath = `/${currentMeeting?.ticker}/meeting/${currentMeeting?.id}/dashboard/${nextPhaseNumber}`
        router.push(nextPhasePath)
      }, 3000)
    }
  }

  // Handle task submission with PDF state
  const handleTaskSubmit = async (task: Task) => {
    if (!task) {
      return
    }

    try {
      // Generate filled PDF
      const pdfBlob = await generateFilledPDF(task.title || 'Task')

      // Upload PDF to Supabase storage
      const fileName = `${task.id}-completed-${Date.now()}.pdf`
      const filePath = `task-completions/${fileName}`

      const supabase = getBrowserSupabase()
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`)
      }

      // Check if signed document already exists for this task
      let existingSignedDocument = null
      if (task.meetingId) {
        const meetingDocuments = await getDocumentsByMeeting(task.meetingId)
        existingSignedDocument = meetingDocuments.find(
          (doc) => doc.taskId === (task.taskId || task.id) && doc.type === 'signed-form'
        )
      }

      // Only create signed document if it doesn't already exist
      if (!existingSignedDocument) {
        const documentData = {
          title: `${task.title} - Signed`,
          description: `Signed document for task: ${task.title}`,
          type: 'signed-form',
          file: uploadData.path,
          taskId: task.taskId || task.id,
        }

        if (task.meetingId) {
          const newDocument = await createNewDocument(task.meetingId, documentData)
          if (newDocument && newDocument.id) {
            await addDocumentHistory(newDocument.id, 'UPDATED')
          }

          // Refresh signed documents list to update button labels
          await checkSignedDocuments()
        }
      }

      // Determine appropriate status based on task type
      let newStatus: components['schemas']['TaskStatus'] = 'COMPLETE'
      const taskTitle = task.title?.toLowerCase() || ''

      if (taskTitle.includes('broadridge') || taskTitle.includes('ics access')) {
        newStatus = 'PENDING_AUTHORIZATION'
      } else if (taskTitle.includes('transfer agent')) {
        newStatus = 'SUBMITTED_AWAITING_RECORD_DATE'
      } else if (taskTitle.includes('plan file request')) {
        newStatus = 'SUBMITTED_AWAITING_RECORD_DATE'
      }

      // Update task status
      if (task.id) {
        try {
          await updateTaskById(task.id, { status: newStatus })
        } catch (error) {
          console.error('Failed to update task status', error)
          throw error
        }
      }

      // Update meeting completion percentage
      if (currentMeeting?.id) {
        try {
          const client = await buildApiClient()

          refetch()

          const completedStatuses = [
            'COMPLETE',
            'AUTHORIZED',
            'SUBMITTED_AWAITING_RECORD_DATE',
            'WAITING_FOR_FORM_RETURN',
            'REQUEST_FORM_TO_FOLLOW',
            'PENDING_AUTHORIZATION',
          ]

          const allTasks = tasks
          const completedTasks = allTasks.filter((t) =>
            completedStatuses.includes(t.status || '')
          ).length
          const overallCompletion = Math.round((completedTasks / allTasks.length) * 100)

          await client.PUT('/meetings/{meetingId}', {
            params: {
              path: { meetingId: currentMeeting.id },
            },
            body: {
              overallCompletion: overallCompletion,
            },
          })
        } catch (error) {
          console.error('Failed to update meeting completion', error)
        }
      }

      // Check if all tasks in the current phase are complete
      await checkAndCompletePhase(task)

      // Clear state and close
      setUploadFiles([])
      refreshMeetingData()
    } catch (error) {
      console.error('Failed to submit task', error)
    }
  }

  const handleTaskLinkClick = useCallback(
    async (link: TaskLink, taskTitle: string, task?: Task) => {
      // Store the task for document submission
      if (task) {
        setCurrentTaskForDocument(task)
      }

      // Check which type of form task this is
      const isPlanFileRequestTask = taskTitle?.includes('Plan File Request')
      const isTransferAgentTask = taskTitle?.includes('Transfer Agent')

      switch (link.action) {
        case 'signature':
          if (link.url) {
            setDocumentUrl(link.url)
            setDocumentTitle(taskTitle)
            setSignatureAreas([])
            setDocumentViewerOpen(true)
          } else if (link.label === 'View Form') {
            // View signed form document
            if (task?.meetingId && task?.id) {
              try {
                const meetingDocuments = await getDocumentsByMeeting(task.meetingId)
                const signedDoc = meetingDocuments.find(
                  (doc) =>
                    doc.taskId === (task.taskId || task.id) && doc.type === 'signed-form'
                )

                if (signedDoc?.filePath) {
                  const { getStoragePublicUrl } = await import('@/utils/documentUtils')
                  const documentUrl = getStoragePublicUrl(signedDoc.filePath)

                  setDocumentUrl(documentUrl)
                  setDocumentTitle(taskTitle)
                  setCurrentDocumentId(signedDoc.id || '')
                  setSignatureAreas([]) // No signature areas for view-only
                  setDocumentViewerOpen(true)
                }
              } catch (error) {
                console.error('Failed to load signed form:', error)
              }
            }
          } else if (link.label === 'Sign Form') {
            // Use appropriate handler based on task type
            const signHandler = isPlanFileRequestTask
              ? handlePlanFormSign
              : isTransferAgentTask
                ? handleTransferAgentSign
                : handleFormSign
            await signHandler({
              onDocumentOpen: (documentUrl, documentId, signatureAreas) => {
                setDocumentUrl(documentUrl)
                setDocumentTitle(taskTitle)
                setCurrentDocumentId(documentId)
                setSignatureAreas(signatureAreas)
                setDocumentViewerOpen(true)
              },
              clientData,
            })
          } else {
          }
          break

        case 'upload':
          setUploadTaskTitle(taskTitle)
          if (isMobile) {
            setMobileUploadOpen(true)
          } else {
            setCurrentView('upload')
          }
          break

        case 'download':
          if (link.url) {
            window.open(link.url, '_blank')
          } else if (link.label === 'Download') {
            // Use appropriate handler based on task type
            if (isPlanFileRequestTask) {
              await handlePlanFormDownload(clientData)
            } else if (isTransferAgentTask) {
              await handleTransferAgentDownload(clientData)
            } else {
              await handleFormDownload(clientData)
            }
          } else {
          }
          break

        case 'authorize':
        case 'external':
        default:
          if (link.url) {
            window.open(link.url, '_blank')
          }
          break
      }
    },
    [isMobile, clientData, getDocumentsByMeeting]
  )

  const handleTaskApprovalClick = useCallback((task: Task) => {
    if (task.type === 'approve' && Array.isArray(task.links) && task.links[0]?.url) {
      setApprovalDocumentUrl(task.links[0].url)
      setApprovalTitle(task.title || 'Approval Task')
      setApprovalDrawerOpen(true)
    }
  }, [])

  const handleBackToOverview = () => {
    setCurrentView('overview')
    setUploadFiles([])
    setUploadTaskTitle('')
    setMobileUploadOpen(false)
  }

  const handleMobileUploadClose = () => {
    setMobileUploadOpen(false)
    setUploadFiles([])
    setUploadTaskTitle('')
  }

  const toggleMobileUpload = (newOpen: boolean) => () => {
    setMobileUploadOpen(newOpen)
  }

  const handleMainDrawerClose = () => {
    setCurrentView('overview')
    setUploadFiles([])
    setUploadTaskTitle('')
    onClose()
  }

  const handleDocumentViewerClose = useCallback(() => {
    setDocumentViewerOpen(false)
    setDocumentUrl('')
    setDocumentTitle('')
    setSignatureAreas([])
  }, [])

  const handleApprovalDrawerClose = useCallback(() => {
    setApprovalDrawerOpen(false)
    setApprovalDocumentUrl('')
    setApprovalTitle('')
  }, [])

  const handleApprove = useCallback(() => {
    // Handle approval logic here
    handleApprovalDrawerClose()
  }, [handleApprovalDrawerClose])

  // Context menu handlers - memoized for performance
  const handleTaskRightClick = useCallback((event: React.MouseEvent, task: Task) => {
    event.preventDefault()
    setSelectedTask(task)
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null)
    setSelectedTask(null)
  }, [])

  const handleTaskEdit = useCallback(() => {
    if (selectedTask) {
      setTaskEditDialogOpen(true)
      handleContextMenuClose()
    }
  }, [selectedTask, handleContextMenuClose])

  const handleTaskEditDialogClose = useCallback(() => {
    setTaskEditDialogOpen(false)
  }, [])

  const handleTaskUpdated = useCallback(() => {
    // Refresh meeting data (including tasks) after task update
    refreshMeetingData()
  }, [refreshMeetingData])

  const handlePhaseNavigation = useCallback(
    (direction: 'prev' | 'next') => {
      const maxPhase = 8 // We have 8 phases
      const next =
        direction === 'prev'
          ? Math.max(1, currentPhaseNumber - 1)
          : Math.min(maxPhase, currentPhaseNumber + 1)

      // Update MeetingContext.currentMeeting.currentPhase so all openers stay in sync
      if (currentMeeting) {
        setCurrentMeeting({
          ...currentMeeting,
          currentPhase: `Phase ${next}`,
        } as typeof currentMeeting)
      }

      onPhaseChange?.(next)
    },
    [currentPhaseNumber, currentMeeting, setCurrentMeeting, onPhaseChange]
  )

  const renderMobileUploadDrawer = () => (
    <>
      <Global
        styles={{
          '.MuiDrawer-root > .MuiPaper-root': {
            height: `100%`,
            overflow: 'visible',
          },
        }}
      />
      <SwipeableDrawer
        anchor="bottom"
        open={mobileUploadOpen}
        onClose={toggleMobileUpload(false)}
        onOpen={toggleMobileUpload(true)}
        swipeAreaWidth={drawerBleeding}
        disableSwipeToOpen={false}
        keepMounted
        ModalProps={{
          disableEnforceFocus: true,
        }}
        sx={{
          boxShadow: theme.shadows[10],
        }}
      >
        <StyledBox
          sx={{
            position: 'absolute',
            top: -drawerBleeding,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            visibility: 'visible',

            border: '1px solid',
            borderColor: theme.vars.palette.divider,
            right: 0,
            left: 0,
            height: drawerBleeding,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Puller />
        </StyledBox>
        <StyledBox sx={{ height: '100%', overflow: 'hidden' }}>
          {renderUploadContent()}
        </StyledBox>
      </SwipeableDrawer>
    </>
  )

  const renderUploadContent = () => (
    <Stack sx={{ height: '100%' }}>
      {/* Header */}
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: theme.vars.palette.divider,
          p: 2,
          height: 60,
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 500 }}>
            {uploadTaskTitle || 'Upload Form'}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={isMobile ? handleMobileUploadClose : handleBackToOverview}
          aria-label="Close upload view and return to overview"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Upload Area */}
      <Box sx={{ m: 3, height: 300 }}>
        <BNFileDropzone
          onFilesSelected={handleFilesSelected}
          onFileRejections={handleFileRejections}
          maxFiles={5}
          maxSize={3 * 1024 * 1024} // 3MB
          acceptedFileTypes={['.docx', '.doc', '.xlsx', '.pdf']}
          multiple={true}
          linkText="Browse files"
          hasUnsupportedFiles={hasUnsupportedFiles}
        />
      </Box>

      {/* Submit Button */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid rgba(31, 30, 28, 0.12)',
        }}
      >
        <Button
          variant="contained"
          disabled={uploadFiles.length === 0}
          onClick={() => {
            // Handle file submission here
            setUploadFiles([])
            if (isMobile) {
              handleMobileUploadClose()
            } else {
              handleBackToOverview()
            }
          }}
        >
          Submit File{uploadFiles.length > 1 ? 's' : ''}
        </Button>
      </Box>
    </Stack>
  )

  const renderUploadSection = () => renderUploadContent()

  const renderOverviewSection = () => (
    <Stack sx={{ height: '100%' }}>
      {/* Header */}
      <Box
        sx={(theme) => ({
          background: theme.vars.palette.appBarPrimary.defaultFill,
          color: theme.vars.palette.appBarPrimary.defaultContrast,
        })}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            height: 60,
          }}
        >
          <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 500 }}>
            Phase {currentPhaseNumber} Overview
          </Typography>
          {currentView === 'overview' && (
            <IconButton
              size="small"
              onClick={handleMainDrawerClose}
              aria-label="Close phase drawer"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {/* Phase Navigation */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            px: 1,
            height: 40,
          }}
        >
          <IconButton
            size="small"
            disabled={currentPhaseNumber <= 1}
            onClick={() => handlePhaseNavigation('prev')}
            aria-label="Go to previous phase"
            sx={{ color: 'white', opacity: currentPhaseNumber <= 1 ? 0.5 : 1 }}
          >
            <ChevronLeftIcon />
          </IconButton>

          <Typography variant="caption" sx={{ color: 'white', fontSize: '12px' }}>
            Phase {currentPhaseNumber} of 8
          </Typography>

          <IconButton
            size="small"
            disabled={currentPhaseNumber >= 8}
            onClick={() => handlePhaseNavigation('next')}
            aria-label="Go to next phase"
            sx={{ color: 'white', opacity: currentPhaseNumber >= 8 ? 0.5 : 1 }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Phase Bar */}
      <Box
        sx={{
          background: phaseColor,
          color: phaseContrast,
          px: 2,
          py: 1,
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'left',
        }}
      >
        Phase {currentPhaseNumber}: {phaseTitle}
      </Box>
      {/* Linear Progress Loader */}
      {(phaseLoading || tasksLoading) && (
        <LinearProgress
          aria-label="Loading phase data"
          color={`phase[${currentPhaseNumber}].main` as 'primary'}
          sx={{
            height: 4,
          }}
        />
      )}

      {/* Content */}
      <Box
        sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}
        tabIndex={0}
        role="region"
        aria-label={`Phase ${currentPhaseNumber} content`}
      >
        {phaseError ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
            }}
          >
            <Typography variant="body2" color="error">
              Error loading phase data: {phaseError}
            </Typography>
          </Box>
        ) : phaseLoading || tasksLoading ? (
          <Box /> // Empty box while loading to hide old content
        ) : (
          <Stack spacing={1}>
            {/* Key Dates */}
            {keyDates.length > 0 && (
              <>
                <Typography variant="body2" fontWeight={500} sx={{ fontSize: '14px' }}>
                  {currentPhaseNumber === 7 ? 'Tabulation Reports' : 'Key Dates'}
                </Typography>

                {keyDates.map((keyDate: KeyDate) => (
                  <Card
                    key={keyDate.id}
                    sx={(theme) => ({
                      background: theme.vars.palette.appBarPrimary.defaultFill,
                      color: theme.vars.palette.appBarPrimary.defaultContrast,
                    })}
                  >
                    <CardContent>
                      <Typography
                        variant="caption"
                        sx={{ color: '#CCE5FF', fontSize: '14px', fontWeight: 500 }}
                      >
                        {friendlyDate(keyDate.date || '')}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontSize: '16px', fontWeight: 700, my: 0.5 }}
                      >
                        {keyDate.title}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontSize: '14px', fontWeight: 500 }}
                      >
                        {formatDaysUntil(calculateDaysUntil(keyDate.date || ''))}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}

                {/* Phase-specific description after key dates */}
                {currentPhaseNumber === 2 && (
                  <Typography
                    variant="body3"
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: '14px', lineHeight: 1.6 }}
                  >
                    The Broker Search distribution signals the start of Phase 2 in your
                    proxy meeting project. The search ensures all necessary parties are
                    aware of the upcoming record date. Additionally, BetaNXT is now fully
                    authorized to receive all pertinent files related to shareholder
                    mailings and tabulations.
                  </Typography>
                )}
                {currentPhaseNumber === 4 && (
                  <Typography
                    variant="body3"
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: '14px', lineHeight: 1.6 }}
                  >
                    Once the Record Date is reached, we will need to collect the required
                    files listed below. Final print quantities can only be confirmed after
                    all files are securely uploaded to our system. Typically, these tasks
                    take approximately 3–4 business days to complete. The urgency of these
                    tasks will depend on the proximity to your Mailing Date. As that date
                    approaches, you may experience an increased need for timely responses
                    and actions.
                  </Typography>
                )}
                {currentPhaseNumber === 5 && (
                  <Typography
                    variant="body3"
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: '14px', lineHeight: 1.6 }}
                  >
                    As your mailing date approaches, you will notice an increase in
                    automated emails from broker intermediary firms as we update their
                    portal. You may disregard these emails, regardless of their frequency.
                    We have direct access to their systems and already possess the
                    information they are providing to you.
                  </Typography>
                )}
                {/* Phase-specific description after key dates */}
                {currentPhaseNumber === 6 && (
                  <Typography
                    variant="body3"
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: '14px', lineHeight: 1.6 }}
                  >
                    Once the mailing process is finalized, mailing affidavits will be
                    delivered shortly thereafter for your legal and record-keeping
                    purposes. Please note, mailing affidavits are not provided for
                    beneficial holder distributions; however, we proactively confirm that
                    these beneficial mailings have been completed by the relevant
                    intermediaries according to applicable guidelines.
                  </Typography>
                )}
                {currentPhaseNumber === 7 && (
                  <Typography
                    variant="body3"
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: '14px', lineHeight: 1.6 }}
                  >
                    Tabulation reports will be sent to you daily beginning 10-15 days
                    prior to your meeting. Please keep in mind you can always log in to
                    our online portal to view real-time results on demand.
                  </Typography>
                )}
              </>
            )}

            {/* Tasks */}
            <Stack spacing={1}>
              {phaseTasks.map((task) => {
                const isCompleted = task.status === 'COMPLETE'
                const hasSignedDoc = task.id ? tasksWithSignedDocs.has(task.id) : false

                // Modify task links if signed document exists
                const modifiedTask: Task =
                  hasSignedDoc && task.links && Array.isArray(task.links)
                    ? {
                        ...task,
                        links: (task.links as TaskLink[]).map((link: TaskLink) => {
                          if (link.action === 'signature' && link.label === 'Sign Form') {
                            return { ...link, label: 'View Form' }
                          }
                          return link
                        }) as unknown as Record<string, unknown>,
                      }
                    : task

                return (
                  <Box key={task.id} onContextMenu={(e) => handleTaskRightClick(e, task)}>
                    <DrawerTaskItem
                      task={modifiedTask}
                      phaseColor={phaseColor}
                      isCompleted={isCompleted}
                      onClick={
                        task.type === 'approve'
                          ? () => handleTaskApprovalClick(task)
                          : undefined
                      }
                      onStatusUpdate={handleTaskUpdated}
                      onLinkClick={(link, taskTitle) =>
                        handleTaskLinkClick(link, taskTitle, task)
                      }
                    />
                  </Box>
                )
              })}
            </Stack>

            {/* URLs Section */}
            {urls.length > 0 && (
              <>
                <Divider />
                {urls.map((urlItem: PhaseUrl, index: number) => (
                  <Box key={index}>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                      {urlItem.title}
                    </Typography>
                    <Typography
                      variant="body3"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1 }}
                    >
                      {urlItem.description}
                    </Typography>
                    {urlItem.url && (
                      <Link href={urlItem.url} target="_blank" rel="noopener noreferrer">
                        {urlItem.url}
                      </Link>
                    )}
                  </Box>
                ))}
              </>
            )}
            {currentPhaseNumber === 5 && (
              <Typography
                variant="body3"
                color="text.secondary"
                sx={{ mt: 1, fontSize: '14px', lineHeight: 1.6 }}
              >
                IMPORTANT: As master tabulator, we do our due diligence to make sure that
                the shares we&apos;ve received from your transfer agent match the total
                outstanding shares presented in your proxy statement. Once you have that
                final number please provide it to your BetaNXT contact at your earliest
                convenience.
              </Typography>
            )}
            {currentPhaseNumber === 6 && (
              <>
                <Typography variant="body2" fontWeight={500} sx={{ mt: 2 }}>
                  Access to MIC
                </Typography>
                <Typography
                  variant="body3"
                  color="text.secondary"
                  sx={{ mt: 1, fontSize: '14px', lineHeight: 1.6 }}
                >
                  IMPORTANT: Confirmed company representatives should have access to
                  BetaNXT&apos;s Online Voting Portal (MIC) to view real-time voting and
                  other reports.
                </Typography>
                <Link
                  href="https://www.mediantonline.com/mic/login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.mediantonline.com/mic/login
                </Link>
              </>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  )

  return (
    <Drawer
      anchor="left"
      elevation={10}
      open={open}
      onClose={handleMainDrawerClose}
      keepMounted={false}
      sx={{
        zIndex: 100,
      }}
      slotProps={{
        paper: {
          sx: {
            height: '100%',
            borderRadius: '0px 4px 4px 0px',
            boxShadow:
              '0px 8px 10px -5px rgba(0, 0, 0, 0.08), 0px 16px 24px 2px rgba(0, 0, 0, 0.05), 0px 6px 30px 5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            alignItems: 'center',
          },
        },
      }}
      ModalProps={{
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
        BackdropProps: {
          sx: {
            zIndex: -1,
            background: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {/* Overview Content */}
        <Box
          className="overview-content"
          sx={{ height: '100%', width: isMobile ? '100%' : 600 }}
        >
          {renderOverviewSection()}
        </Box>

        {/* Upload Content - Desktop only */}
        {!isMobile && (
          <Collapse
            orientation="horizontal"
            in={currentView === 'upload'}
            mountOnEnter
            unmountOnExit
          >
            <Paper
              sx={(theme) => ({
                width: 450,
                height: '100%',
                borderLeft: `1px solid ${theme.vars.palette.divider}`,
              })}
            >
              {renderUploadSection()}
            </Paper>
          </Collapse>
        )}
      </Box>

      {/* Document Viewer Modal */}
      <DocumentViewer
        open={documentViewerOpen}
        onClose={handleDocumentViewerClose}
        fileUrl={documentUrl}
        title={documentTitle}
        signatureAreas={signatureAreas}
        documentId={currentDocumentId}
        taskId={currentTaskForDocument?.id || currentTaskForDocument?.taskId}
        task={
          currentTaskForDocument
            ? {
                id: currentTaskForDocument.id || '',
                task_id: currentTaskForDocument.taskId || currentTaskForDocument.id,
                title: currentTaskForDocument.title || 'Document',
                type: currentTaskForDocument.type,
                meeting_id: currentTaskForDocument.meetingId,
              }
            : undefined
        }
        documentType="signature"
        onPdfStateChange={handlePdfStateChange}
        onSubmitSuccess={async () => {
          if (!currentTaskForDocument) return

          // Handle task submission with the current task
          await handleTaskSubmit(currentTaskForDocument)

          // Close the document viewer
          handleDocumentViewerClose()
        }}
      />

      {/* Approval Drawer */}
      <ApprovalDrawer
        open={approvalDrawerOpen}
        onClose={handleApprovalDrawerClose}
        title={approvalTitle}
        fileUrl={approvalDocumentUrl}
        onApprove={handleApprove}
        onAddComment={() => {}}
      />

      {/* Context Menu */}
      <TaskContextMenu
        open={contextMenu !== null}
        position={contextMenu}
        onClose={handleContextMenuClose}
        onEdit={handleTaskEdit}
      />

      {/* Task Edit Modal - Only render when needed for performance */}
      {(TaskEditDialogOpen || selectedTask) && (
        <TaskEditDialog
          open={TaskEditDialogOpen}
          onClose={handleTaskEditDialogClose}
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
          onRefresh={refreshMeetingData}
          enableLinkEditing={true}
        />
      )}

      {/* Mobile Upload Drawer */}
      {isMobile && renderMobileUploadDrawer()}

      {/* Phase Completion Success Alert */}
      <Snackbar
        open={phaseCompleteAlert.open}
        autoHideDuration={6000}
        onClose={() => setPhaseCompleteAlert((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setPhaseCompleteAlert((prev) => ({ ...prev, open: false }))}
          severity="success"
          sx={{
            width: '100%',
            maxWidth: '600px',
            boxShadow: 3,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {phaseCompleteAlert.title}
          </Typography>
          <Typography variant="body2">{phaseCompleteAlert.message}</Typography>
        </Alert>
      </Snackbar>
    </Drawer>
  )
}

export default PhaseDrawer
