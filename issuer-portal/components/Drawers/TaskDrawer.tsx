'use client'

import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Card,
  Drawer,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'

import TaskEditDialog from '@/components/Dialogs/TaskEditDialog'
import DocumentViewer from '@/components/Documents/DocumentViewer'
import ApprovalDrawer from '@/components/Drawers/ApprovalDrawer'
import TaskActions from '@/components/Drawers/TaskActions'
import DrawerHeader from '@/components/Drawers/shared/DrawerHeader'
import { useDrawerDocuments } from '@/components/Drawers/shared/hooks/useDrawerDocuments'
import type { SignatureArea } from '@/components/Drawers/shared/hooks/useDrawerDocuments'
import BNFileDropzone from '@/components/FileUpload/BNFileDropzone'
import BNFilePreview from '@/components/FileUpload/BNFilePreview'
import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'
import { getStatusBorderColor } from '@/components/mui-styling/theme'
import StatusChip from '@/components/ui/StatusChip'
import TaskContextMenu, {
  type ContextMenuPosition,
} from '@/components/ui/TaskContextMenu'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { useMeeting } from '@/contexts/MeetingContext'
import { useMeetingCompletion } from '@/hooks/taskDrawer/useMeetingCompletion'
import { usePDFGeneration } from '@/hooks/taskDrawer/usePDFGeneration'
import { usePhaseCompletion } from '@/hooks/taskDrawer/usePhaseCompletion'
import { useTaskSubmission } from '@/hooks/taskDrawer/useTaskSubmission'
import { useClients } from '@/hooks/useClients'
import { useDocuments } from '@/hooks/useDocuments'
import { useTasks } from '@/hooks/useTasks'
import { getBrowserSupabase } from '@/lib/browserSupabase'
import { handleFormDownload, handleFormSign } from '@/utils/broadridgeFormHandler'
import {
  handleFormDownload as handlePlanFormDownload,
  handleFormSign as handlePlanFormSign,
} from '@/utils/planFileRequestForm'
import { determineTaskStatus } from '@/utils/taskControl'
import { findSignedDocumentForTask } from '@/utils/taskDrawer/documentMatching'
import type { TaskLink } from '@/utils/taskLinks'
import { parseTaskLinks } from '@/utils/taskLinks'
import {
  getDTCCAuthorizationStatus,
  isDTCCAuthorizationTask,
} from '@/utils/taskTransformers'
import {
  handleFormDownload as handleTransferAgentDownload,
  handleFormSign as handleTransferAgentSign,
} from '@/utils/transferAgentRequestForm'

type Task = components['schemas']['Task']

// Task status type for local use
type _TaskStatus = 'COMPLETE' | 'INCOMPLETE' | 'NEEDS_AUTHORIZATION'

type DbTask = components['schemas']['Task']

interface TaskLinkWithSignature extends TaskLink {
  signatureArea?: SignatureArea[]
}

interface TaskDrawerProps {
  open: boolean
  onClose: () => void
  task: DbTask | null
  onTaskUpdate?: (updatedTask: DbTask) => void
}

const TaskDrawer: React.FC<TaskDrawerProps> = ({ open, onClose, task, onTaskUpdate }) => {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { clients } = useClients()
  // Pass the meetingId from the task to ensure we're updating the right context
  const { updateTaskById, tasks, refetch } = useTasks(task?.meetingId || undefined)
  const {
    createNewDocument,
    addDocumentHistory,
    addCommentToDocument,
    getDocumentsByMeeting,
    uploadDocument,
  } = useDocuments()

  // Get meeting data for the meeting date
  const {
    currentMeeting,
    tasks: _contextTasks,
    refreshMeetingData: refreshContext,
  } = useMeeting()

  // Use shared document management hook (must be called before useTaskSubmission)
  const {
    documentViewerOpen,
    documentUrl,
    signatureAreas,
    currentDocumentId,
    approvalDrawerOpen,
    approvalDocumentUrl,
    approvalTitle,
    uploadFiles,
    hasUnsupportedFiles,
    pdfFormState,
    setDocumentViewerOpen,
    setDocumentUrl,
    setSignatureAreas,
    setCurrentDocumentId,
    handleDocumentViewerClose,
    setApprovalDrawerOpen,
    setApprovalDocumentUrl,
    setApprovalTitle,
    handleApprovalDrawerClose,
    handleFilesSelected,
    handleFileRejections,
    handleFileRemove,
    clearUploadFiles,
    handlePdfStateChange,
    setUploadFiles,
  } = useDrawerDocuments()

  // Initialize custom hooks
  const { generateFilledPDF } = usePDFGeneration()
  const { isSubmittingTask, setIsSubmittingTask, submitRegularFiles } = useTaskSubmission(
    {
      uploadDocument,
      updateTaskById,
      setUploadFiles,
    }
  )
  const { checkAndCompletePhase } = usePhaseCompletion({
    currentMeeting,
    session,
    refreshContext,
  })
  const { updateMeetingCompletion } = useMeetingCompletion({
    currentMeeting,
    tasks,
    refetch,
  })

  const [taskLinks, setTaskLinks] = useState<TaskLink[]>([])
  const [contextMenuOpen, setContextMenuOpen] = useState(false)

  // Get current client data based on URL params
  const currentClient = clients.find((client) => client.ticker === params.clientTicker)

  const [contextMenuPosition, setContextMenuPosition] =
    useState<ContextMenuPosition | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [taskPhaseNumber, setTaskPhaseNumber] = useState<number>(1)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<DbTask | null>(null)
  const [dtccAuthorized, setDtccAuthorized] = useState(false)
  const [phaseCompleteAlert, setPhaseCompleteAlert] = useState<{
    open: boolean
    title: string
    message: string
  }>({ open: false, title: '', message: '' })
  const [hasSignedDocument, setHasSignedDocument] = useState(false)
  const [checkingSignedDocument, setCheckingSignedDocument] = useState(false)

  // Sync DTCC authorization state with task status
  useEffect(() => {
    const taskToCheck = currentTask || task
    if (isDTCCAuthorizationTask(taskToCheck)) {
      const isAuthorized =
        taskToCheck?.status === 'AUTHORIZED' || taskToCheck?.status === 'COMPLETE'
      setDtccAuthorized(isAuthorized)
    }
  }, [currentTask, task, open])

  // Update current task when prop changes and reset document state
  useEffect(() => {
    // Only reset if task actually changed (compare IDs, not references)
    const taskChanged = currentTask?.id !== task?.id

    setCurrentTask(task)

    // Only reset document state when task ID actually changes
    if (task && taskChanged) {
      setDocumentUrl('')
      setSignatureAreas([])
      setCurrentDocumentId('')
      setDocumentViewerOpen(false)
      // Reset hasSignedDocument - will be rechecked in next effect
      setHasSignedDocument(false)
      setCheckingSignedDocument(true)
    }
  }, [
    task,
    currentTask,
    setDocumentUrl,
    setSignatureAreas,
    setCurrentDocumentId,
    setDocumentViewerOpen,
  ])

  // Set task links from task data when task changes
  useEffect(() => {
    const taskToUse = currentTask || task
    if (open && taskToUse) {
      try {
        // Links are now stored as JSON in the task itself
        const fetchedLinks = parseTaskLinks(taskToUse.links, taskToUse.title)
        setTaskLinks(fetchedLinks)

        // Check if there are any signature links
        const hasSignatureLink = fetchedLinks.some((link) => link.action === 'signature')
        if (!hasSignatureLink) {
          setCheckingSignedDocument(false)
        }

        // Check if a signed form document exists for this task
        const checkSignedDocument = async () => {
          if (taskToUse.meetingId) {
            const meetingDocuments = await getDocumentsByMeeting(taskToUse.meetingId)
            const signedDoc = findSignedDocumentForTask(taskToUse, meetingDocuments)

            setHasSignedDocument(!!signedDoc)
            setCheckingSignedDocument(false)
          } else {
            setCheckingSignedDocument(false)
          }
        }
        void checkSignedDocument().catch((_error) => {
          // Error handled silently - we just want to check if signed document exists
          setCheckingSignedDocument(false)
        })

        // Check for signature type tasks first
        if (taskToUse?.type === 'signature') {
          // Don't close the drawer - let the user interact with both
          // The DocumentViewer will handle the signature task via the task prop
          return
        }

        // Signature actions are handled by link clicks within the drawer
        // No need to auto-open DocumentViewer

        // Check for approve type tasks
        if (fetchedLinks.length > 0) {
          if (taskToUse?.type === 'approve') {
            const firstLink = fetchedLinks[0]
            if (firstLink?.url) {
              setApprovalDocumentUrl(firstLink.url)
              setApprovalTitle(taskToUse?.title ?? '')
              setApprovalDrawerOpen(true)
              // Close the task drawer since we're opening approval drawer
              onClose()
              return
            }
          }
        }

        // Set phase number directly from task
        setTaskPhaseNumber(taskToUse.phaseNumber || 1)
      } catch (err) {
        console.error('Failed to initialize task drawer', err)
      }
    } else {
      setTaskLinks([])
      setCheckingSignedDocument(false)
    }
  }, [
    open,
    task,
    currentTask,
    onClose,
    getDocumentsByMeeting,
    setApprovalDocumentUrl,
    setApprovalTitle,
    setApprovalDrawerOpen,
  ])

  const handleLinkClick = async (link: TaskLinkWithSignature) => {
    // Clear document URL and signature areas, but preserve documentId
    // (it will be set by the handler callbacks)
    setDocumentUrl('')
    setSignatureAreas([])

    const clientData = currentClient
      ? {
        issuerName: currentClient.company_name ?? currentClient.short_name ?? '',
        // Client model does not expose cusip; use meeting cusip if available
        cusipNumber: currentMeeting?.cusip || undefined,
        contactName: currentClient.primary_contact ?? '',
        email: currentClient.primary_contact_email ?? '',
        meetingDate: currentMeeting?.meetingDate || undefined,
        ticker: currentClient.ticker || undefined,
      }
      : undefined

    // Check which type of form task this is
    const isPlanFileRequestTask = currentTask?.title
      ?.toLowerCase()
      .includes('plan file request')
    const isTransferAgentTask = currentTask?.title
      ?.toLowerCase()
      .includes('transfer agent')

    switch (link.action) {
      case 'download':
        if (link.label === 'Download Form') {
          // Use appropriate handler based on task type
          if (isPlanFileRequestTask) {
            await handlePlanFormDownload(clientData)
          } else if (isTransferAgentTask) {
            await handleTransferAgentDownload(clientData)
          } else {
            await handleFormDownload(clientData)
          }
        } else if (link.url) {
          window.open(link.url, '_blank')
        }
        break

      case 'signature':
        if (link.label === 'Sign Form') {
          // Use appropriate handler based on task type
          const signHandler = isPlanFileRequestTask
            ? handlePlanFormSign
            : isTransferAgentTask
              ? handleTransferAgentSign
              : handleFormSign

          await signHandler({
            onDocumentOpen: (documentUrl, documentId, signatureAreas) => {
              setDocumentUrl(documentUrl)
              setCurrentDocumentId(documentId)
              setSignatureAreas(signatureAreas)
              setDocumentViewerOpen(true)
              // Keep TaskDrawer open so both are visible
            },
            clientData,
          })
        } else {
          // Handle general document signing - open full DocumentViewer
          const documentUrl = link.url ?? '' // fallback URL
          setDocumentUrl(documentUrl)

          // Generate a real document ID for tracking
          const documentId = `doc-${Date.now()}-${documentUrl.replace(/[^a-zA-Z0-9]/g, '-')}`
          setCurrentDocumentId(documentId)

          // No default signature areas - they should come from form handlers
          // Generic signature links are view-only
          setSignatureAreas([])

          setDocumentViewerOpen(true)
          onClose() // Close drawer for full-screen document viewing
        }
        break

      case 'upload':
        // Upload action is handled by the BNFileDropzone component
        // No direct action needed here - the UI is already shown
        break

      case 'authorize':
      case 'external':
      default:
        if (link.url) {
          window.open(link.url, '_blank')
        }
        break
    }
  }

  // Handle task submission with PDF state
  const handleTaskSubmit = async () => {
    if (!currentTask && !task) {
      return
    }

    const taskToSubmit = currentTask || task
    if (!taskToSubmit) {
      return
    }

    try {
      setIsSubmittingTask(true)

      // Handle regular file uploads (non-signature tasks)
      if (uploadFiles.length > 0) {
        const newStatus = await submitRegularFiles(uploadFiles, taskToSubmit)

        // Update meeting completion percentage
        await updateMeetingCompletion()

        // Update local task state
        const updatedTask = { ...taskToSubmit, status: newStatus }
        setCurrentTask(updatedTask)

        // Notify parent component
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask as DbTask)
        }

        // Check if all tasks in the current phase are complete
        const phaseAdvanced = await checkAndCompletePhase(taskToSubmit)

        // Clear files
        clearUploadFiles()
        setIsSubmittingTask(false)

        // Only close drawer if phase was NOT advanced (if advanced, navigation will handle it)
        if (!phaseAdvanced) {
          onClose()
        }
        return
      }

      // Handle signature tasks (generate PDF from form fields)
      // Convert pdfFormState to the format expected by the hook
      const signatureDataMap = new Map(
        Object.entries(pdfFormState.signatures).map(([areaId, signature]) => [
          areaId,
          {
            name: areaId,
            title: '',
            date: new Date().toLocaleDateString(),
            signature: signature ?? '',
          },
        ])
      )

      const formFieldValues = new Map(
        Object.entries(pdfFormState.formFields).map(([fieldId, value]) => [
          fieldId,
          { value: value ?? '', label: fieldId },
        ])
      )

      // Generate filled PDF
      const pdfBlob = generateFilledPDF(
        taskToSubmit.title ?? 'Task',
        signatureDataMap,
        formFieldValues
      )

      // Upload PDF to Supabase storage
      const fileName = `${taskToSubmit.id}-completed-${Date.now()}.pdf`
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
      if (taskToSubmit.meetingId) {
        const meetingDocuments = await getDocumentsByMeeting(taskToSubmit.meetingId)
        existingSignedDocument = meetingDocuments.find(
          (doc) =>
            doc.taskId === (taskToSubmit.taskId || taskToSubmit.id) &&
            doc.type === 'signed-form'
        )
      }

      // Determine appropriate status based on task type
      const newStatus = determineTaskStatus(taskToSubmit.title ?? '')

      // Only create signed document if it doesn't already exist
      if (!existingSignedDocument) {
        // Create document record for the signed form
        const documentData = {
          title: `${taskToSubmit.title} - Signed`,
          description: `Signed document for task: ${taskToSubmit.title}`,
          type: 'signed-form',
          file: uploadData.path,
          taskId: taskToSubmit.taskId || taskToSubmit.id,
          status: newStatus, // Match document status to task status
        }

        // Create document record in the meeting
        if (taskToSubmit.meetingId) {
          const newDocument = await createNewDocument(
            taskToSubmit.meetingId,
            documentData
          )
          if (newDocument?.id) {
            await addDocumentHistory(newDocument.id, 'UPDATED')
          }
        }
      }

      // Update task status
      if (taskToSubmit.id) {
        await updateTaskById(taskToSubmit.id, { status: newStatus })
      }

      // Update meeting completion percentage
      await updateMeetingCompletion()

      // Update local task state
      const updatedTask = { ...taskToSubmit, status: newStatus }
      setCurrentTask(updatedTask)

      // Notify parent component
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask as DbTask)
      }

      // Check if all tasks in the current phase are complete
      await checkAndCompletePhase(taskToSubmit)

      // Clear files and close drawer
      clearUploadFiles()
      onClose()
    } catch (_error) {
      // Error handled silently - task submission failed
    } finally {
      setIsSubmittingTask(false)
    }
  }

  // Handle adding comments to the task/document
  const handleAddComment = async (comment: string) => {
    if (!comment.trim()) return

    try {
      if (currentDocumentId) {
        await addCommentToDocument(currentDocumentId, comment, {
          // TODO: Add user information from session
        })
      }
    } catch (_error) {
      // Error handled silently - comment addition failed
    }
  }

  const handleOpenFullscreen = () => {
    // Set the document URL from the approval drawer
    if (approvalDocumentUrl) {
      setDocumentUrl(approvalDocumentUrl)
      setDocumentViewerOpen(true)
    }
    // Close the approval drawer
    handleApprovalDrawerClose()
  }

  const handleApprove = () => {
    // Handle approval logic here
    handleApprovalDrawerClose()
  }

  const handleTaskContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenuPosition({ x: event.clientX, y: event.clientY })
    setContextMenuOpen(true)
  }

  const handleContextMenuClose = () => {
    setContextMenuOpen(false)
    setContextMenuPosition(null)
  }

  const handleTaskEdit = () => {
    handleContextMenuClose()
    setEditModalOpen(true)
  }

  const handleTaskDelete = () => {
    // Handle task delete functionality
    handleContextMenuClose()
  }

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false)
  }

  const handleDocumentUpload = async (files: File[]) => {
    const taskToUse = currentTask || task
    if (!taskToUse) return

    const uploadResults = []

    // Upload each file to Supabase storage
    for (const file of files) {
      const fileName = `${taskToUse.id}-${Date.now()}-${file.name}`
      const filePath = `documents/${fileName}`

      const supabase = getBrowserSupabase()
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        throw new Error(`Failed to upload ${file.name}: ${error.message}`)
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath)

      uploadResults.push({
        fileName: file.name,
        filePath: data.path,
        publicUrl: urlData.publicUrl,
        originalFile: file,
      })
    }

    // Create document records for uploaded files if meeting exists
    if (taskToUse.meetingId) {
      for (const result of uploadResults) {
        await createNewDocument(taskToUse.meetingId, {
          title: result.fileName,
          description: `Document uploaded for task: ${taskToUse.title}`,
          type: 'supporting-document',
          file: result.filePath,
          taskId: taskToUse.id,
        })
      }
    }

    return uploadResults
  }

  const convertDbTaskToTask = (dbTask: DbTask): Task | null => {
    if (!dbTask) return null

    return {
      id: dbTask.id ?? '',
      title: dbTask.title ?? '',
      description: dbTask.description || null,
      owner: dbTask.owner ?? 'BetaNXT',
      dueDate: dbTask.dueDate || null,
      status: dbTask.status ?? 'INCOMPLETE',
      meetingId: dbTask.meetingId ?? '',
      phaseId: dbTask.phaseId ?? '',
      phaseNumber: dbTask.phaseNumber ?? 0,
      type: (dbTask.type ?? 'external') as Task['type'],
      taskId: dbTask.taskId ?? dbTask.id ?? '',
      documentId: dbTask.documentId || null,
      links: taskLinks.map((link: TaskLink) => ({
        label: link.label ?? '',
        url: link.url ?? '',
        action: link.action as 'download' | 'upload' | 'sign' | 'authorize' | 'external',
      })) as unknown as Task['links'],
      createdAt: dbTask.createdAt || undefined,
      updatedAt: dbTask.updatedAt || undefined,
    }
  }

  const handleEditModalClose = () => {
    setEditModalOpen(false)
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    // Convert Task back to DbTask format
    const dbTask: DbTask = {
      id: updatedTask.id,
      taskId: updatedTask.taskId,
      title: updatedTask.title,
      description: updatedTask.description,
      owner: updatedTask.owner,
      dueDate: updatedTask.dueDate,
      status: updatedTask.status,
      meetingId: updatedTask.meetingId,
      phaseId: updatedTask.phaseId,
      phaseNumber: updatedTask.phaseNumber,
      type: updatedTask.type,
      documentId: updatedTask.documentId,
      links: updatedTask.links as unknown as DbTask['links'],
      createdAt: updatedTask.createdAt || undefined,
      updatedAt: updatedTask.updatedAt || undefined,
    }

    // Update the current task with the new data including links
    setCurrentTask(dbTask)

    // Notify parent component if callback is provided
    if (onTaskUpdate) {
      onTaskUpdate(dbTask)
    }

    setEditModalOpen(false)
  }

  const handleDtccAuthorizationChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked
    setDtccAuthorized(checked)

    // Update task status in backend
    const taskToUpdate = currentTask || task
    if (taskToUpdate?.id) {
      const newStatus = getDTCCAuthorizationStatus(checked)

      // Update task status in backend
      await updateTaskById(taskToUpdate.id, { status: newStatus })

      // Update local task state
      const updatedTask = { ...taskToUpdate, status: newStatus }
      setCurrentTask(updatedTask)

      // Notify parent component
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask as DbTask)
      }

      // Check if all tasks in the current phase are complete after DTCC authorization
      if (checked) {
        // Check phase completion with updated task (this will refresh and use fresh data)
        const phaseAdvanced = await checkAndCompletePhase(updatedTask)

        // Only close the drawer if phase was NOT advanced (if advanced, setTimeout will close it)
        if (!phaseAdvanced) {
          onClose()
        }
      }
    }
  }

  const isMobile = useMediaQuery('(max-width: 500px)')

  return (
    <Drawer
      variant="temporary"
      anchor={isMobile ? 'bottom' : 'left'}
      open={open}
      onClose={onClose}
      data-testid="task-drawer"
      transitionDuration={{ appear: 200, enter: 200, exit: 200 }}
      sx={{
        borderRadius: '0px 4px 4px 0px',
        overflow: 'hidden',
      }}
      ModalProps={{
        keepMounted: false,
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
      }}
      slotProps={{
        transition: {
          timeout: 200,
        },
        paper: {
          sx: {
            borderRadius: '0px 4px 4px 0px',
            transition: 'transform 2s ease-in-out',
          },
        },
      }}
    >
      {currentTask || task ? (
        <Stack sx={{ height: '100vh', width: { xs: '100vw', md: 550 } }}>
          {/* Header */}
          <DrawerHeader
            title={(currentTask ?? task)?.title ?? 'Task Details'}
            onClose={onClose}
          />

          {/* Content */}
          <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
              {/* Task Details Card */}
              <Card
                onContextMenu={handleTaskContextMenu}
                sx={(theme) => {
                  const taskToUse = currentTask || task
                  const isComplete = taskToUse?.status === 'COMPLETE'
                  const phaseColor = `var(--mui-palette-phase-${taskPhaseNumber - 1}-main)`
                  const borderColor = isComplete
                    ? theme.vars.palette.complete
                    : getStatusBorderColor(taskToUse?.status, phaseColor, theme)

                  return {
                    p: 2,
                    background: theme.vars.palette.tableCellRow.fill,
                    borderLeft: `5px solid ${borderColor}`,
                    boxShadow: `inset 0px 0px 0px 1px ${theme.vars.palette.divider}`,
                  }
                }}
              >
                <Typography
                  variant="body3"
                  fontWeight={500}
                  sx={{ lineHeight: 1.2, mb: 0.5 }}
                >
                  {(currentTask ?? task)?.title ?? 'Task'}
                </Typography>

                <Typography
                  color="text.secondary"
                  variant="body3"
                  sx={{ display: 'block', mb: 1 }}
                >
                  {(currentTask ?? task)?.description ?? ''}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: taskLinks.length > 0 ? 1 : 0,
                  }}
                >
                  <StatusChip
                    status={(currentTask ?? task)?.status ?? 'INCOMPLETE'}
                    size="small"
                  />
                </Box>

                {/* Action buttons for tasks with links */}
                <TaskActions
                  task={currentTask || task || ({} as DbTask)}
                  taskLinks={taskLinks}
                  hasSignedDocument={hasSignedDocument}
                  checkingSignedDocument={checkingSignedDocument}
                  dtccAuthorized={dtccAuthorized}
                  onLinkClick={handleLinkClick}
                  onDtccAuthorizationChange={handleDtccAuthorizationChange}
                  getDocumentsByMeeting={getDocumentsByMeeting}
                  setDocumentUrl={setDocumentUrl}
                  setCurrentDocumentId={setCurrentDocumentId}
                  setSignatureAreas={setSignatureAreas}
                  setDocumentViewerOpen={setDocumentViewerOpen}
                />
              </Card>

              {/* Upload Area - Show when task has upload or download action links */}
              {(() => {
                const hasUpload = taskLinks.some((link) => link.action === 'upload')
                const hasDownload = taskLinks.some((link) => link.action === 'download')
                const isNotClientOwned =
                  ['BetaNXT', 'DFIN'].includes((currentTask ?? task)?.owner ?? '') ||
                  isDTCCAuthorizationTask(currentTask ?? task)
                return hasUpload || (hasDownload && isNotClientOwned)
              })() && (
                  <Box>
                    <BNFileDropzone
                      onFilesSelected={handleFilesSelected}
                      onFileRejections={handleFileRejections}
                      maxFiles={5}
                      maxSize={25 * 1024 * 1024} // 25MB to match API limit
                      acceptedFileTypes={['.docx', '.doc', '.xlsx', '.pdf']}
                      multiple={true}
                      linkText={`Browse files for ${(currentTask || task)?.title}`}
                      hasUnsupportedFiles={hasUnsupportedFiles}
                    />

                    {/* File Previews */}
                    {uploadFiles.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Stack spacing={1}>
                          {uploadFiles.map((uploadFile) => (
                            <BNFilePreview
                              key={uploadFile.id}
                              file={{
                                id: uploadFile.id,
                                file: uploadFile.file,
                                status: uploadFile.status as
                                  | 'uploading'
                                  | 'complete'
                                  | 'error',
                                progress: uploadFile.progress,
                                error: uploadFile.error,
                              }}
                              onRemove={handleFileRemove}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}
            </Stack>
          </Box>

          {/* Footer with Send Button - Show when task has upload or download action links */}
          {(() => {
            const hasUpload = taskLinks.some((link) => link.action === 'upload')
            const hasDownload = taskLinks.some((link) => link.action === 'download')
            const isNotClientOwned = ['BetaNXT', 'DFIN'].includes(
              (currentTask ?? task)?.owner ?? ''
            )
            return hasUpload || (hasDownload && isNotClientOwned)
          })() && (
              <Box
                sx={{
                  pt: 2,
                  px: 3,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  borderTop: '1px solid rgba(31, 30, 28, 0.12)',
                }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  disabled={
                    (uploadFiles.length === 0 && currentTask?.type !== 'signature') ||
                    isSubmittingTask
                  }
                  onClick={handleTaskSubmit}
                >
                  {isSubmittingTask
                    ? 'Submitting...'
                    : currentTask?.type === 'signature'
                      ? 'Submit Signed Document'
                      : `Submit ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}`}
                </Button>
              </Box>
            )}
        </Stack>
      ) : null}

      {/* Document Viewer Modal */}
      <DocumentViewer
        {...(documentViewerOpen && documentUrl
          ? {
            // Use legacy props when we have a generated document URL (like Broadridge form)
            open: documentViewerOpen,
            onClose: handleDocumentViewerClose,
            fileUrl: documentUrl,
            title: approvalTitle ?? (currentTask ?? task)?.title ?? 'Document',
            signatureAreas: signatureAreas,
            documentId: currentDocumentId,
            taskId:
              (currentTask || task)?.id || (currentTask || task)?.taskId || undefined,
            task:
              currentTask || task
                ? {
                  id: (currentTask ?? task)?.id ?? '',
                  task_id: (currentTask ?? task)?.taskId ?? (currentTask ?? task)?.id,
                  title: (currentTask ?? task)?.title ?? 'Document',
                  type: (currentTask || task)?.type,
                  meeting_id: (currentTask || task)?.meetingId,
                }
                : undefined,
            documentType: 'signature', // Ensure signature buttons show up
            onPdfStateChange: handlePdfStateChange,
            onSubmitSuccess: () => {
              void (async () => {
                // Determine appropriate status based on task type
                let newStatus: components['schemas']['TaskStatus'] = 'COMPLETE'
                const taskTitle = ((currentTask ?? task)?.title ?? '').toLowerCase()

                if (
                  taskTitle.includes('broadridge') ||
                  taskTitle.includes('ics access')
                ) {
                  newStatus = 'PENDING_AUTHORIZATION'
                } else if (taskTitle.includes('transfer agent')) {
                  newStatus = 'SUBMITTED_AWAITING_RECORD_DATE'
                } else if (taskTitle.includes('plan file request')) {
                  newStatus = 'SUBMITTED_AWAITING_RECORD_DATE'
                }

                // Update task status in backend
                const taskToUpdate = currentTask || task
                if (taskToUpdate?.id) {
                  try {
                    await updateTaskById(taskToUpdate.id, { status: newStatus })
                  } catch (error) {
                    console.error(
                      'Failed to update task after document submission',
                      error
                    )
                  }
                }

                // Update local task state with appropriate status
                const updatedTask = { ...(currentTask || task), status: newStatus }
                setCurrentTask(updatedTask)

                // Notify parent component to refresh
                if (onTaskUpdate) {
                  onTaskUpdate(updatedTask as DbTask)
                }

                // Close both the DocumentViewer and TaskDrawer after successful submission
                handleDocumentViewerClose()
                onClose()

                // Check if all phase 1 tasks are complete and auto-advance to phase 2
                const taskToCheck = currentTask || task
                if (taskToCheck?.phaseNumber === 1) {
                  // Short delay to ensure database is updated
                  await new Promise((resolve) => setTimeout(resolve, 500))

                  // Refresh tasks to get latest status
                  refetch()

                  // Get all phase 1 tasks (excluding BetaNXT and DFIN owned tasks)
                  const phase1Tasks = tasks.filter(
                    (t) =>
                      t.phaseNumber === 1 &&
                      !['BetaNXT', 'DFIN'].includes(t.owner ?? '')
                  )

                  // Define statuses that indicate task completion
                  const completedStatuses = [
                    'COMPLETE',
                    'AUTHORIZED',
                    'SUBMITTED_AWAITING_RECORD_DATE',
                    'WAITING_FOR_FORM_RETURN',
                    'REQUEST_FORM_TO_FOLLOW',
                    'PENDING_AUTHORIZATION',
                  ]

                  // Check if all phase 1 tasks are complete
                  const allPhase1TasksComplete =
                    phase1Tasks.length > 0 &&
                    phase1Tasks.every((t) => completedStatuses.includes(t.status ?? ''))

                  if (allPhase1TasksComplete) {
                    // Update meeting to Phase 2 and calculate completion percentage
                    if (currentMeeting?.id) {
                      try {
                        const client = await buildApiClient()

                        // Calculate overall completion based on all tasks
                        const allTasks = tasks
                        const completedTasks = allTasks.filter((t) =>
                          [
                            'COMPLETE',
                            'AUTHORIZED',
                            'SUBMITTED_AWAITING_RECORD_DATE',
                            'WAITING_FOR_FORM_RETURN',
                            'REQUEST_FORM_TO_FOLLOW',
                            'PENDING_AUTHORIZATION',
                          ].includes(t.status ?? '')
                        ).length
                        const overallCompletion = Math.round(
                          (completedTasks / allTasks.length) * 100
                        )

                        // Update meeting phase and completion
                        await client.PUT('/meetings/{meetingId}', {
                          params: {
                            path: { meetingId: currentMeeting.id },
                          },
                          body: {
                            currentPhase: 'Phase 2',
                            overallCompletion: overallCompletion,
                          },
                        })
                      } catch (_error) {
                        // Error handled silently - meeting update failed
                      }
                    }

                    // Show success message using MUI Alert
                    const userName = session?.user?.name ?? 'User'
                    const meetingTitle = currentMeeting?.title ?? 'Shareholder Meeting'

                    setPhaseCompleteAlert({
                      open: true,
                      title: 'Phase 1 Wrapped Up – Time for Phase 2',
                      message: `Great news! ${userName}, you completed Phase 1 of ${meetingTitle}. You can now start Phase 2 — check the updated tasks and timelines to keep things moving smoothly.`,
                    })

                    // Close the document viewer and task drawer
                    handleDocumentViewerClose()

                    // Navigate to phase 2 after a short delay to let user see the message
                    setTimeout(() => {
                      onClose() // Close the task drawer
                      const phase2Path = `/${currentMeeting?.ticker}/meeting/${currentMeeting?.id}/dashboard/2`
                      router.push(phase2Path)
                    }, 3000)
                  }
                }

                // Close the document viewer
                handleDocumentViewerClose()
              })()
            },
          }
          : (currentTask || task) && documentViewerOpen
            ? {
              // Use task-based props for regular document tasks
              task: {
                id: (currentTask ?? task)?.id ?? '',
                task_id: (currentTask ?? task)?.taskId ?? (currentTask ?? task)?.id,
                title: (currentTask ?? task)?.title ?? 'Document',
                type: (currentTask || task)?.type,
                meeting_id: (currentTask || task)?.meetingId,
              },
              taskId:
                (currentTask || task)?.id || (currentTask || task)?.taskId || undefined,
              onSuccess: () => {
                handleDocumentViewerClose()
                onClose() // Also close the TaskDrawer
              },
              onPdfStateChange: handlePdfStateChange,
            }
            : {
              // Fallback to legacy props
              open: documentViewerOpen,
              onClose: handleDocumentViewerClose,
              fileUrl: approvalDocumentUrl,
              title: approvalTitle ?? 'Document',
              signatureAreas: signatureAreas,
              documentId: currentDocumentId,
              onPdfStateChange: handlePdfStateChange,
            })}
      />

      {/* Approval Drawer */}
      <ApprovalDrawer
        open={approvalDrawerOpen}
        onClose={handleApprovalDrawerClose}
        title={approvalTitle}
        fileUrl={approvalDocumentUrl}
        onApprove={handleApprove}
        onOpenFullscreen={handleOpenFullscreen}
        onAddComment={handleAddComment}
        documentId={currentDocumentId}
      />

      {/* Task Context Menu */}
      <TaskContextMenu
        open={contextMenuOpen}
        position={contextMenuPosition}
        onClose={handleContextMenuClose}
        onEdit={handleTaskEdit}
        onDelete={handleTaskDelete}
      />

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        onUpload={handleDocumentUpload}
      />

      {/* Task Edit Modal */}
      <TaskEditDialog
        open={editModalOpen}
        onClose={handleEditModalClose}
        task={currentTask || task ? convertDbTaskToTask((currentTask || task)!) : null}
        onTaskUpdated={handleTaskUpdated}
        enableLinkEditing={true}
      />

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
          <Typography variant="body3">{phaseCompleteAlert.message}</Typography>
        </Alert>
      </Snackbar>
    </Drawer>
  )
}

export default TaskDrawer
