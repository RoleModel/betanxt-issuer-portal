'use client'

import BNFileDropzone from '@rolemodel/betanxt-design-system/components/file-upload/BNFileDropzone'
import BNFilePreview from '@rolemodel/betanxt-design-system/components/file-upload/BNFilePreview'
import FileUploadDialog from '@rolemodel/betanxt-design-system/components/file-upload/FileUploadDialog'
import React, { useEffect, useState } from 'react'
import type { FileRejection } from 'react-dropzone'

import { Close as CloseIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  Drawer,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material'

import TaskEditDialog from '@/components/Dialogs/TaskEditDialog'
import DocumentViewer from '@/components/Documents/DocumentViewer'
import ApprovalDrawer from '@/components/Drawers/ApprovalDrawer'
import StatusChip from '@/components/ui/StatusChip'
import TaskContextMenu, {
  type ContextMenuPosition,
} from '@/components/ui/TaskContextMenu'

import type { components } from '@/domain-models/generated-schema'

type Task = components['schemas']['Task']
import { TaskLink, parseTaskLinks } from '@/utils/taskLinks'

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
  const [uploadFiles, setUploadFiles] = useState<
    {
      id: string
      file: File
      status: 'pending' | 'uploading' | 'complete' | 'error'
      progress?: number
      error?: string
    }[]
  >([])
  const [isOpen, setIsOpen] = useState(false)
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
  const [contextMenuPosition, setContextMenuPosition] =
    useState<ContextMenuPosition | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [taskPhaseNumber, setTaskPhaseNumber] = useState<number>(1)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<DbTask | Task | null>(null)

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

        // Check for sign action link in regular tasks
        if (fetchedLinks.length > 0) {
          const signLink = fetchedLinks.find((link: TaskLink) => link.action === 'sign')
          if (signLink?.url) {
            // Open DocumentViewer directly for sign tasks
            setDocumentUrl(signLink.url)
            setDocumentViewerOpen(true)
            // Close the task drawer since we're opening document viewer
            onClose()
            return
          }

          // Check for approve type tasks
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

  useEffect(() => {
    setIsOpen(open)
  }, [open])

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
    if (link.action === 'sign') {
      // For sign actions, try to use the link URL or find a default document
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

        console.log('Mock signature areas loaded for:', documentUrl)
      } catch (error) {
        console.error('Error loading signature areas:', error)
        setSignatureAreas([])
      }

      setDocumentViewerOpen(true)
    } else if (link.url) {
      window.open(link.url, '_blank')
    }
  }

  const handleDocumentViewerClose = () => {
    setDocumentViewerOpen(false)
    setDocumentUrl('')
    setSignatureAreas([])
    setCurrentDocumentId('')
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

      console.log(
        'Mock document upload for task:',
        task.id,
        'files:',
        files.map((f) => f.name)
      )

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock successful upload results
      const mockUploadResults = files.map((file) => ({
        fileName: `${task.id}-${file.name}`,
        publicUrl: `/mock-uploads/${task.id}-${file.name}`,
        originalFile: file,
      }))

      console.log('Mock documents uploaded successfully:', mockUploadResults)
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
      links: taskLinks
        .map((link) => ({
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
      links: (updatedTask.links as unknown as DbTask['links']),
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

  return (
    <Drawer
      anchor="left"
      elevation={10}
      open={isOpen}
      onClose={onClose}
      keepMounted={false}
      sx={{
        borderRadius: '0px 4px 4px 0px',
        overflow: 'hidden',
      }}
      ModalProps={{
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '0px 4px 4px 0px',
          },
        },
      }}
    >
      {currentTask || task ? (
        <Stack sx={{ height: '100%', width: 550 }}>
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

                {taskLinks.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {taskLinks.map((link, linkIndex) => {
                      // Make sign actions clickable even without direct URL if task has documents
                      const isClickable = link.url || link.action === 'sign'

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

              {/* Upload Area - Only show for upload type tasks, not authorize tasks */}
              {(() => {
                const taskType = (currentTask || task)?.type
                console.log('TaskDrawer: Task type check:', {
                  taskType,
                  currentTaskType: currentTask?.type,
                  propTaskType: task?.type,
                })
                // Check for various possible upload type representations
                const isUploadType = taskType === 'upload' || taskType === 'UPLOAD'
                console.log('TaskDrawer: Is upload type?', isUploadType)
                return isUploadType
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

          {/* Footer with Send Button - Only show for upload type tasks, not authorize tasks */}
          {(() => {
            const taskType = (currentTask || task)?.type
            console.log('TaskDrawer: Footer check:', {
              taskType,
              currentTaskType: currentTask?.type,
              propTaskType: task?.type,
            })
            // Check for various possible upload type representations
            return taskType === 'upload' || taskType === 'UPLOAD'
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
                  variant="contained"
                  size="large"
                  disabled={uploadFiles.length === 0}
                  onClick={() => {
                    // Handle file submission here
                    setUploadFiles([])
                    onClose()
                  }}
                >
                  Submit {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}
                </Button>
              </Box>
            )}
        </Stack>
      ) : null}

      {/* Document Viewer Modal */}
      <DocumentViewer
        task={
          (currentTask || task) && (currentTask || task)?.type === 'signature'
            ? {
              id: (currentTask || task)?.id || '',
              task_id: (currentTask || task)?.taskId,
              title: (currentTask || task)?.title || 'Document',
              type: (currentTask || task)?.type,
              meeting_id: (currentTask || task)?.meetingId,
            }
            : null
        }
        onSuccess={handleDocumentViewerClose}
        // Legacy props for backward compatibility
        open={documentViewerOpen}
        onClose={handleDocumentViewerClose}
        pdfUrl={documentUrl || approvalDocumentUrl}
        title={approvalTitle || (currentTask || task)?.title || 'Document'}
        signatureAreas={signatureAreas}
        documentId={currentDocumentId}
        taskId={(currentTask || task)?.taskId || undefined}
      />

      {/* Approval Drawer */}
      <ApprovalDrawer
        open={approvalDrawerOpen}
        onClose={handleApprovalDrawerClose}
        title={approvalTitle}
        pdfUrl={approvalDocumentUrl}
        onApprove={handleApprove}
        onOpenFullscreen={handleOpenFullscreen}
        onAddComment={() => {
          // TODO: Implement comment addition logic
        }}
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
