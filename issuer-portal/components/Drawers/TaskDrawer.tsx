'use client'

import BNFileDropzone from '@rolemodel/betanxt-design-system/components/file-upload/BNFileDropzone'
import BNFilePreview from '@rolemodel/betanxt-design-system/components/file-upload/BNFilePreview'
import FileUploadDialog from '@rolemodel/betanxt-design-system/components/file-upload/FileUploadDialog'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import type { FileRejection } from 'react-dropzone'

import { Close as CloseIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Drawer,
  FormControlLabel,
  IconButton,
  Link,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'

import TaskEditDialog from '@/components/Dialogs/TaskEditDialog'
import DocumentViewer from '@/components/Documents/DocumentViewer'
import ApprovalDrawer from '@/components/Drawers/ApprovalDrawer'
import StatusChip from '@/components/ui/StatusChip'
import TaskContextMenu, {
  type ContextMenuPosition,
} from '@/components/ui/TaskContextMenu'

import type { components } from '@/domain-models/generated-schema'

import { useClients } from '@/hooks/useClients'
import { useDocuments } from '@/hooks/useDocuments'
import { useTasks } from '@/hooks/useTasks'
import {
  handleFormDownload,
  handleFormSign,
} from '@/utils/broadridgeFormHandler'
import { TaskLink, parseTaskLinks } from '@/utils/taskLinks'
import { isDTCCAuthorizationTask, getDTCCAuthorizationStatus } from '@/utils/taskTransformers'
import { jsPDF } from 'jspdf'
import { supabase } from '../../../supabase/clients'

type Task = components['schemas']['Task']

// Task status type for local use
type _TaskStatus = 'COMPLETE' | 'INCOMPLETE' | 'NEEDS_AUTHORIZATION'

type DbTask = components['schemas']['Task']

interface TaskLinkWithSignature extends TaskLink {
  signatureArea?: SignatureArea[]
}

interface SignatureArea {
  id: string
  x: number
  y: number
  width: number
  height: number
  page?: number
  label?: string
  signed?: boolean
}

interface TaskDrawerProps {
  open: boolean
  onClose: () => void
  task: DbTask | Task | null
  onTaskUpdate?: (updatedTask: DbTask) => void
}

const TaskDrawer: React.FC<TaskDrawerProps> = ({ open, onClose, task, onTaskUpdate }) => {
  const params = useParams()
  const { clients } = useClients()
  const { updateTaskById } = useTasks()
  const { createNewDocument, addDocumentHistory, addCommentToDocument } = useDocuments()
  const [uploadFiles, setUploadFiles] = useState<
    {
      id: string
      file: File
      status: 'pending' | 'uploading' | 'complete' | 'error'
      progress?: number
      error?: string
    }[]
  >([])
  const [hasUnsupportedFiles, setHasUnsupportedFiles] = useState(false)
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [documentUrl, setDocumentUrl] = useState<string>('')
  const [signatureAreas, setSignatureAreas] = useState<SignatureArea[]>([])
  const [currentDocumentId, setCurrentDocumentId] = useState<string>('')
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false)
  const [approvalDocumentUrl, setApprovalDocumentUrl] = useState<string>('')
  const [approvalTitle, setApprovalTitle] = useState<string>('')
  const [taskLinks, setTaskLinks] = useState<TaskLink[]>([])
  const [contextMenuOpen, setContextMenuOpen] = useState(false)

  // Get current client data based on URL params
  const currentClient = clients.find((client) => client.ticker === params.clientTicker)
  const [contextMenuPosition, setContextMenuPosition] =
    useState<ContextMenuPosition | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [taskPhaseNumber, setTaskPhaseNumber] = useState<number>(1)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<DbTask | Task | null>(null)
  const [dtccAuthorized, setDtccAuthorized] = useState(false)
  const [pdfFormState, setPdfFormState] = useState<{
    formFields: Record<string, string>
    signatures: Record<string, string>
  }>({ formFields: {}, signatures: {} })
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)

  // Update current task when prop changes
  useEffect(() => {
    setCurrentTask(task)
  }, [task])

  // Set task links from task data when task changes
  useEffect(() => {
    const taskToUse = currentTask || task
    if (open && taskToUse) {
      try {
        // Links are now stored as JSON in the task itself
        const fetchedLinks = parseTaskLinks(taskToUse.links)
        setTaskLinks(fetchedLinks)

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
              setApprovalTitle(taskToUse?.title || '')
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
        console.warn('Error setting task links:', err)
      }
    } else {
      setTaskLinks([])
    }
  }, [open, task, currentTask, onClose])


  const handleFilesSelected = (newFiles: File[]) => {
    const uploadFileObjects = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending' as const,
    }))
    setUploadFiles((prev) => [...prev, ...uploadFileObjects])
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

  const handleFileRemove = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleLinkClick = async (link: TaskLinkWithSignature) => {

    // Create client data for Broadridge form
    const clientData = currentClient
      ? {
        issuerName: currentClient.company_name || currentClient.short_name || '',
        contactName: currentClient.primary_contact || '',
        email: currentClient.primary_contact_email || '',
      }
      : undefined

    switch (link.action) {
      case 'download':
        if (link.label === 'Download Form') {
          await handleFormDownload(clientData)
        } else if (link.url) {
          window.open(link.url, '_blank')
        }
        break

      case 'signature':
        if (link.label === 'Sign Form') {
          // Handle Broadridge form signing - open DocumentViewer, keep TaskDrawer open
          await handleFormSign({
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
          const documentUrl = link.url || 'proxy-statement.pdf' // fallback URL
          setDocumentUrl(documentUrl)

          // TODO: Fetch signature areas from API when document endpoints are available
          try {
            // For now, use mock signature areas
            const mockDocumentId = `doc-${documentUrl.replace(/[^a-zA-Z0-9]/g, '-')}`
            setCurrentDocumentId(mockDocumentId)

            // Mock signature areas for demonstration
            const mockSignatureAreas = [
              {
                id: 'sig-1',
                x: 100,
                y: 200,
                width: 200,
                height: 50,
                page: 1,
                label: 'Signature',
                signed: false,
              },
            ]
            setSignatureAreas(mockSignatureAreas)

          } catch (error) {
            console.error('Error loading signature areas:', error)
            setSignatureAreas([])
          }

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

  const handleDocumentViewerClose = () => {
    setDocumentViewerOpen(false)
    setDocumentUrl('')
    setSignatureAreas([])
    setCurrentDocumentId('')
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

      // Generate filled PDF
      const pdfBlob = await generateFilledPDF(taskToSubmit.title || 'Task')

      // Upload PDF to Supabase storage
      const fileName = `${taskToSubmit.id}-completed-${Date.now()}.pdf`
      const filePath = `task-completions/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('supporting')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`)
      }

      // Create document record for the submitted task
      const documentData = {
        title: `${taskToSubmit.title} - Completed`,
        description: `Document completed for task: ${taskToSubmit.title}`,
        type: 'task-completion',
        file: uploadData.path, // Point to the actual stored PDF
        taskId: taskToSubmit.taskId || taskToSubmit.id,
      }

      // Create document record in the meeting
      if (taskToSubmit.meetingId) {
        const newDocument = await createNewDocument(taskToSubmit.meetingId, documentData)
        if (newDocument && newDocument.id) {
          // Add history entry for document completion
          await addDocumentHistory(newDocument.id, 'Task Completed')
        }
      }

      // Update task status to COMPLETE
      if (taskToSubmit.id) {
        await updateTaskById(taskToSubmit.id, { status: 'COMPLETE' })
      }

      // Update local task state
      const updatedTask = { ...taskToSubmit, status: 'COMPLETE' as const }
      setCurrentTask(updatedTask)

      // Notify parent component
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask as DbTask)
      }

      // Clear files and close drawer
      setUploadFiles([])
      onClose()
    } catch (error) {
      console.error('Error submitting task:', error)
      // TODO: Show error message to user
    } finally {
      setIsSubmittingTask(false)
    }
  }

  // Callback to receive PDF state from DocumentViewer
  const handlePdfStateChange = (formFields: Record<string, string>, signatures: Record<string, string>) => {
    setPdfFormState({ formFields, signatures })
  }

  // Handle adding comments to the task/document
  const handleAddComment = async (comment: string) => {
    if (!comment.trim()) return

    try {
      // If we have a document ID, add comment to the document
      if (currentDocumentId) {
        await addCommentToDocument(currentDocumentId, comment)
      } else {
        // If no document ID, we could add task-level comments
        // For now, just log the comment as a placeholder
        // TODO: Implement task-level comments API when available
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleApprovalDrawerClose = () => {
    setApprovalDrawerOpen(false)
    setApprovalDocumentUrl('')
    setApprovalTitle('')
  }

  const handleOpenFullscreen = () => {
    // Set the document URL from the approval drawer
    if (approvalDocumentUrl) {
      setDocumentUrl(approvalDocumentUrl)
    }
    // Close the approval drawer
    setApprovalDrawerOpen(false)
    // Open the document viewer in fullscreen
    setDocumentViewerOpen(true)
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

  const handleTaskView = () => {
    // Handle task view functionality - drawer is already open
    handleContextMenuClose()
  }

  const handleTaskDelete = () => {
    // Handle task delete functionality
    handleContextMenuClose()
  }

  const handleUploadDocument = () => {
    handleContextMenuClose()
    setUploadDialogOpen(true)
  }

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false)
  }

  const handleDocumentUpload = async (files: File[]) => {
    if (!task) return

    try {
      // TODO: Replace with actual document upload API when available
      // For now, simulate file upload success

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock successful upload results
      const mockUploadResults = files.map((file) => ({
        fileName: `${task.id}-${file.name}`,
        publicUrl: `/mock-uploads/${task.id}-${file.name}`,
        originalFile: file,
      }))

    } catch (error) {
      console.error('Error uploading documents:', error)
      throw error
    }
  }

  const convertDbTaskToTask = (dbTask: DbTask): Task | null => {
    if (!dbTask) return null

    return {
      id: dbTask.id || '',
      title: dbTask.title || '',
      description: dbTask.description || null,
      owner: dbTask.owner || 'BetaNXT',
      dueDate: dbTask.dueDate || null,
      status: dbTask.status || 'INCOMPLETE',
      meetingId: dbTask.meetingId || '',
      phaseId: dbTask.phaseId || '',
      phaseNumber: dbTask.phaseNumber || 0,
      type: (dbTask.type || 'external') as Task['type'],
      taskId: dbTask.taskId || dbTask.id || '',
      documentId: dbTask.documentId || null,
      links: taskLinks.map((link) => ({
        label: link.label || '',
        url: link.url || '',
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

  const handleDtccAuthorizationChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked
    setDtccAuthorized(checked)

    // Update task status in backend
    const taskToUpdate = currentTask || task
    if (taskToUpdate && taskToUpdate.id) {
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
    }
  }

  const isMobile = useMediaQuery('(max-width: 500px)')

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'left'}
      elevation={10}
      open={open}
      onClose={onClose}
      data-testid="task-drawer"
      transitionDuration={{ appear: 200, enter: 200, exit: 200 }}
      sx={{
        borderRadius: '0px 4px 4px 0px',
        overflow: 'hidden',
      }}
      ModalProps={{
        keepMounted: true,
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
          <Box
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              pl: 3,
              background: theme.vars.palette.appBarPrimary.defaultFill,
              color: theme.vars.palette.appBarPrimary.defaultContrast,
              borderBottom: 1,
              borderColor: theme.vars.palette.divider,
            })}
          >
            <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 500 }}>
              {(currentTask || task)?.title || 'Task Details'}
            </Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
              {/* Task Details Card */}
              <Card
                onContextMenu={handleTaskContextMenu}
                sx={(theme) => ({
                  p: 2,
                  background: theme.vars.palette.tableCellRow.fill,
                  borderLeft: `5px solid ${theme.vars.palette.phase[taskPhaseNumber - 1].main}`,
                  boxShadow: `inset 0px 0px 0px 1px ${theme.vars.palette.divider}`,
                  cursor: 'context-menu',
                })}
              >
                <Typography
                  variant="body3"
                  fontWeight={500}
                  sx={{ lineHeight: 1.2, mb: 0.5 }}
                >
                  {(currentTask || task)?.title || 'Task'}
                </Typography>

                <Typography
                  color="text.secondary"
                  variant="body3"
                  sx={{ display: 'block', mb: 1 }}
                >
                  {(currentTask || task)?.description || ''}
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
                    status={(currentTask || task)?.status || 'INCOMPLETE'}
                    size="small"
                  />
                </Box>

                {/* DTCC Authorization Checkbox */}
                {isDTCCAuthorizationTask(currentTask || task) && (
                  <Box sx={{ mt: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          color="secondary"
                          checked={dtccAuthorized || (currentTask || task)?.status === 'COMPLETE'}
                          onChange={handleDtccAuthorizationChange}
                          size="small"
                        />
                      }
                      label="Authorization confirmed"
                    />
                  </Box>
                )}

                {taskLinks.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {taskLinks.map((link, linkIndex) => {
                      // Make sign and download actions clickable even without direct URL
                      const isClickable =
                        link.url ||
                        link.action === 'signature' ||
                        link.action === 'download'

                      return isClickable ? (
                        <Link
                          key={linkIndex}
                          component="button"
                          onClick={() => handleLinkClick(link)}
                          variant="body3"
                          sx={{
                            textDecoration: 'underline',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            p: 0,
                          }}
                        >
                          {link.label}
                        </Link>
                      ) : null
                    })}
                  </Stack>
                )}
              </Card>

              {/* Upload Area - Show when task has download action links */}
              {(() => {
                const hasDownload = taskLinks.some((link) => link.action === 'download')
                return hasDownload
              })() && (
                  <Box>
                    <BNFileDropzone
                      onFilesSelected={handleFilesSelected}
                      onFileRejections={handleFileRejections}
                      maxFiles={5}
                      maxSize={3 * 1024 * 1024} // 3MB
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

          {/* Footer with Send Button - Show when task has download action links */}
          {taskLinks.some((link) => link.action === 'download') && (
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
                variant="contained"
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
                    : `Submit ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}`
                }
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
            pdfUrl: documentUrl,
            title: approvalTitle || (currentTask || task)?.title || 'Document',
            signatureAreas: signatureAreas,
            documentId: currentDocumentId,
            taskId: (currentTask || task)?.id || (currentTask || task)?.taskId || undefined,
            task: (currentTask || task) ? {
              id: (currentTask || task)?.id || '',
              task_id: (currentTask || task)?.taskId || (currentTask || task)?.id,
              title: (currentTask || task)?.title || 'Document',
              type: (currentTask || task)?.type,
              meeting_id: (currentTask || task)?.meetingId,
            } : undefined,
            documentType: 'signature', // Ensure signature buttons show up
            onPdfStateChange: handlePdfStateChange,
          }
          : (currentTask || task) && documentViewerOpen
            ? {
              // Use task-based props for regular document tasks
              task: {
                id: (currentTask || task)?.id || '',
                task_id: (currentTask || task)?.taskId || (currentTask || task)?.id,
                title: (currentTask || task)?.title || 'Document',
                type: (currentTask || task)?.type,
                meeting_id: (currentTask || task)?.meetingId,
              },
              taskId: (currentTask || task)?.id || (currentTask || task)?.taskId || undefined,
              onSuccess: handleDocumentViewerClose,
              onPdfStateChange: handlePdfStateChange,
            }
            : {
              // Fallback to legacy props
              open: documentViewerOpen,
              onClose: handleDocumentViewerClose,
              pdfUrl: approvalDocumentUrl,
              title: approvalTitle || 'Document',
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
        pdfUrl={approvalDocumentUrl}
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
        onView={handleTaskView}
        onUploadDocument={handleUploadDocument}
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
        task={
          currentTask || task
            ? convertDbTaskToTask((currentTask || task) as DbTask)
            : null
        }
        onTaskUpdated={handleTaskUpdated}
        enableLinkEditing={true}
      />
    </Drawer>
  )
}

export default TaskDrawer
