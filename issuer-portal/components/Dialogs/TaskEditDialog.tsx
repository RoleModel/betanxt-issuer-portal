'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import BNFileDropzone from '@/components/file-upload/BNFileDropzone'

import { useDocuments } from '@/hooks/useDocuments'
import { useTasks } from '@/hooks/useTasks'
import type { Task, Document } from '@/types/api'
import { TaskLink as BaseTaskLink } from '@/utils/taskLinks'
import { getStoragePublicUrl } from '@/utils/documentUtils'

// Task status type - matches the status options used in the component
type TaskStatus = 'Complete' | 'Shares Balanced' | 'Mailing Complete' | 'Ordered' | 'Authorized' | 'Approved to Send' | 'Approved' | 'Submitted' | 'Active' | 'Received' | 'Reached' | 'Pending Approval' | 'Pending' | 'Delayed' | '1/3 Reviews Complete' | 'Awaiting Review' | 'Pending Client Review' | 'Making Revisions' | '3 of 5 Materials Uploaded' | 'Shares Imbalanced' | 'Access Needed' | 'Need Authorization' | 'New' | 'Mailing' | 'In Edit Process' | 'Request form to follow' | 'In Progress' | 'Incomplete' | 'Awaiting Materials' | 'Awaiting Draft' | 'Awaiting Form' | 'Not Uploaded' | 'Draft' | 'No' | 'N/A'

type TaskType = 'upload' | 'signature' | 'external' | 'authorize' | 'approve'
type LinkAction = 'download' | 'upload' | 'sign' | 'authorize' | 'external'

interface TaskLink extends BaseTaskLink {
  id?: string // Add id field for editing purposes
}

interface TaskEditDialogProps {
  open: boolean
  onClose: () => void
  task: Task | null
  onTaskUpdated: (updatedTask: Task) => void
  onRefresh?: () => void
  enableLinkEditing?: boolean
}

const statusOptions: TaskStatus[] = [
  // Positive/Success statuses (green)
  'Complete',
  'Shares Balanced',
  'Mailing Complete',
  'Ordered',
  'Authorized',
  'Approved to Send',
  'Approved',
  'Submitted',
  'Active',
  'Received',
  'Reached',
  // Warning/Pending statuses (yellow/orange)
  'Pending Approval',
  'Pending',
  'Delayed',
  '1/3 Reviews Complete',
  'Awaiting Review',
  'Pending Client Review',
  'Making Revisions',
  '3 of 5 Materials Uploaded',
  // Error/Action needed statuses (red)
  'Shares Imbalanced',
  'Access Needed',
  'Need Authorization',
  // Info/In Progress statuses (blue)
  'New',
  'Mailing',
  'In Edit Process',
  'Request form to follow',
  'In Progress',
  // Neutral/Default statuses (grey)
  'Incomplete',
  'Awaiting Materials',
  'Awaiting Draft',
  'Awaiting Form',
  'Not Uploaded',
  'Draft',
  'No',
  'N/A',
]

const typeOptions: TaskType[] = [
  'upload',
  'signature',
  'external',
  'authorize',
  'approve',
]

const actionOptions: LinkAction[] = [
  'download',
  'upload',
  'sign',
  'authorize',
  'external',
]

export const TaskEditDialog: React.FC<TaskEditDialogProps> = ({
  open,
  onClose,
  task,
  onTaskUpdated,
  onRefresh,
  enableLinkEditing = false,
}) => {
  // Use our hooks instead of direct Supabase calls
  const { updateTaskById } = useTasks()
  const { createNewDocument } = useDocuments()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Incomplete' as TaskStatus,
    type: '' as TaskType | '',
    phase: 1 as number, // Use phase number instead of phase_id
    due_date: '',
    assignee: '',
  })

  const [links, setLinks] = useState<TaskLink[]>([])

  // Document management state - using document masters (templates)
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('')
  const [uploadingFile, setUploadingFile] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to convert display date to YYYY-MM-DD format
  const convertToDbDate = (displayDate: string): string => {
    if (!displayDate) return ''

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) {
      return displayDate
    }

    // Convert from "Sep 10" or similar format to YYYY-MM-DD
    try {
      const currentYear = new Date().getFullYear()
      const date = new Date(`${displayDate}, ${currentYear}`)
      if (isNaN(date.getTime())) return ''

      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  // Memoize initial form data calculation - much simpler now with direct phase_number
  const initialFormData = useMemo(() => {
    if (!task) return null
    return {
      title: task.title || '',
      description: task.description || '',
      status: (task.status as TaskStatus) || 'Incomplete',
      type: (task.type as TaskType) || '',
      phase: task.phase_number || 1,
      due_date: convertToDbDate(task.dueDate || ''),
      assignee: task.assignee || '',
    }
  }, [task])

  // Memoize initial links calculation
  const initialLinks = useMemo(() => {
    if (!task || !enableLinkEditing || !task.links) return []
    return task.links.map((link, index) => ({
      id: `link-${index}`, // Generate a temporary ID for editing
      label: link.label,
      url: link.url || '',
      action: link.action as LinkAction,
    }))
  }, [task, enableLinkEditing])

  // Load available document masters (templates) - now using API
  const loadAvailableDocuments = useCallback(async () => {
    try {
      // TODO: Implement document masters API endpoint
      // For now, just return empty array to avoid Supabase dependency
      setAvailableDocuments([])
    } catch {
      setError('Failed to load document templates')
    }
  }, [])

  // Initialize form data when task changes
  useEffect(() => {
    if (initialFormData) {
      setFormData(initialFormData)
    }
    setLinks(initialLinks)
    setError(null)

    // Load available documents when modal opens
    if (open) {
      loadAvailableDocuments()
    }
  }, [initialFormData, initialLinks, open, loadAvailableDocuments])

  // Set current document when task loads
  useEffect(() => {
    if (task && 'document' in task) {
      setSelectedDocumentId(String(task.document) || '')
    }
  }, [task])

  const handleChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }))
    }

  // Link management functions
  const handleAddLink = useCallback(() => {
    setLinks((prev) => [...prev, { label: '', url: '', action: 'external' }])
  }, [])

  const handleRemoveLink = useCallback((index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleLinkChange = useCallback(
    (index: number, field: keyof TaskLink, value: string) => {
      setLinks((prev) =>
        prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
      )
    },
    []
  )

  // Handle file upload with BNFileDropzone
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const file = files[0] // Only handle one file for signature tasks
      if (!file || !task) return

      setUploadingFile(true)
      setError(null)

      try {
        // Get meeting ID for document creation
        const meetingId = task.meeting_id || 'extraordinary-2023' // fallback

        // Create document using our hook instead of direct Supabase
        const documentData = new FormData()
        documentData.append('file', file)
        documentData.append('title', file.name.replace(/\.[^/.]+$/, ''))
        documentData.append('description', `Uploaded document for task: ${task.title}`)
        documentData.append('type', 'signature')
        documentData.append('status', 'draft')

        const newDocument = await createNewDocument(meetingId, documentData)
        if (!newDocument) {
          throw new Error('Failed to create document')
        }

        // Refresh available documents and select the new one
        await loadAvailableDocuments()
        setSelectedDocumentId(newDocument.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload file')
      } finally {
        setUploadingFile(false)
      }
    },
    [task, loadAvailableDocuments, createNewDocument]
  )

  // Handle file upload rejections
  const handleFileRejections = useCallback((rejections: { errors: { code: string }[] }[]) => {
    if (rejections.length > 0) {
      const rejection = rejections[0]
      if (rejection.errors?.some((e) => e.code === 'file-too-large')) {
        setError('File is too large. Please upload a file smaller than 5MB.')
      } else if (rejection.errors?.some((e) => e.code === 'file-invalid-type')) {
        setError('Invalid file type. Please upload a PDF file.')
      } else {
        setError('File upload failed. Please try again.')
      }
    }
  }, [])

  const handleSave = async () => {
    if (!task) return

    setLoading(true)
    setError(null)

    try {
      // Prepare comprehensive task updates
      const taskUpdates = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        type: formData.type || null,
        phaseNumber: formData.phase,
        dueDate: formData.due_date || null,
        assignee: formData.assignee || null,
        document: selectedDocumentId || null,
      }

      // Add links if link editing is enabled
      if (enableLinkEditing) {
        const linksToSave = links
          .filter((link) => link.label.trim()) // Only save links with labels
          .map((link) => ({
            label: link.label,
            url: link.url || undefined,
            action: link.action || undefined,
          }))
        taskUpdates.links = linksToSave
      }

      // Update using hook
      await updateTaskById(task.id, taskUpdates)

      // Note: Meeting completion update would be handled automatically by the context

      // Create updated task object for callback
      const finalTask = {
        ...task,
        ...taskUpdates,
        id: task.id,
      }

      onTaskUpdated(finalTask)
      if (onRefresh) onRefresh() // Refresh the parent component data
      onClose()
    } catch (err) {
      let errorMessage = 'Failed to update task'
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof err.message === 'string'
      ) {
        errorMessage = err.message
      } else if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = useCallback(() => {
    if (initialFormData) {
      setFormData(initialFormData)
    }
    setLinks(initialLinks)
    setError(null)
    onClose()
  }, [initialFormData, initialLinks, onClose])

  if (!task) return null

  // Show loading state if form data isn't ready yet
  if (!initialFormData) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography>Loading...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          Edit Task
          <IconButton
            onClick={handleCancel}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Task Title"
            size="small"
            value={formData.title}
            onChange={handleChange('title')}
            margin="normal"
            required
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Description"
            size="small"
            value={formData.description}
            onChange={handleChange('description')}
            margin="normal"
            multiline
            rows={3}
            variant="outlined"
          />

          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              select
              label="Status"
              size="small"
              value={formData.status}
              onChange={handleChange('status')}
              variant="outlined"
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              select
              label="Type"
              size="small"
              value={formData.type}
              onChange={handleChange('type')}
              variant="outlined"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {typeOptions.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              select
              label="Phase"
              size="small"
              value={formData.phase}
              onChange={handleChange('phase')}
              variant="outlined"
              required
            >
              {Array.from({ length: 8 }, (_, i) => i + 1).map((phaseNumber) => (
                <MenuItem key={phaseNumber} value={phaseNumber}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: `var(--mui-palette-phase-${phaseNumber - 1}-main)`,
                        flexShrink: 0,
                      }}
                    />
                    Phase {phaseNumber}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Due Date"
              size="small"
              type="date"
              value={formData.due_date}
              onChange={handleChange('due_date')}
              variant="outlined"
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              fullWidth
              label="Assignee"
              size="small"
              value={formData.assignee}
              onChange={handleChange('assignee')}
              variant="outlined"
            />
          </Box>

          {/* Document Management Section - Only show for signature tasks */}
          {formData.type === 'signature' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 500, mb: 2 }}>
                Document
              </Typography>

              {/* Current Document Selection */}
              <TextField
                fullWidth
                select
                label="Select Document"
                size="small"
                value={selectedDocumentId}
                onChange={(e) => setSelectedDocumentId(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {availableDocuments.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id}>
                    <Box>
                      <Typography variant="body2">{doc.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {doc.template_file_path} • {doc.type}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              {/* Current Document Info */}
              {selectedDocumentId && (
                <Box sx={{ mb: 2 }}>
                  {(() => {
                    const selectedDoc = availableDocuments.find(
                      (d) => d.id === selectedDocumentId
                    )
                    if (!selectedDoc) return null

                    return (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>{selectedDoc.title}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Template: {selectedDoc.template_file_path} • Type:{' '}
                          {selectedDoc.type}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Storage URL:{' '}
                          {selectedDoc.template_file_path
                            ? getStoragePublicUrl(selectedDoc.template_file_path)
                            : 'No file path'}
                        </Typography>
                      </Alert>
                    )
                  })()}
                </Box>
              )}

              {/* Upload New Document */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Or upload a new document:
              </Typography>

              <Box sx={{ height: 120 }}>
                <BNFileDropzone
                  onFilesSelected={handleFilesSelected}
                  onFileRejections={handleFileRejections}
                  maxFiles={1}
                  multiple={false}
                  acceptedFileTypes={['.pdf']}
                  disabled={uploadingFile}
                  linkText={uploadingFile ? 'Uploading...' : 'Upload PDF'}
                />
              </Box>
            </Box>
          )}

          {/* Conditional Link Editing Section */}
          {enableLinkEditing && (
            <Box sx={{ mt: 3 }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 500 }}>
                  Links
                </Typography>
                <Button startIcon={<AddIcon />} onClick={handleAddLink} variant="text">
                  Add Link
                </Button>
              </Box>

              {links.length === 0 ? (
                <Typography variant="body3" color="text.secondary">
                  No links added yet
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {links.map((link, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <Box flex={1}>
                            <Box display="flex" gap={2} sx={{ mb: 2 }}>
                              <TextField
                                label="Link Label"
                                value={link.label}
                                onChange={(e) =>
                                  handleLinkChange(index, 'label', e.target.value)
                                }
                                size="small"
                                fullWidth
                                required
                              />
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel id="action-label">Action</InputLabel>
                                <Select
                                  labelId="action-label"
                                  size="small"
                                  value={link.action || ''}
                                  label="Action"
                                  onChange={(e) =>
                                    handleLinkChange(index, 'action', e.target.value)
                                  }
                                >
                                  {actionOptions.map((action) => (
                                    <MenuItem key={action} value={action}>
                                      {action.charAt(0).toUpperCase() + action.slice(1)}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                            <TextField
                              label="URL (optional)"
                              value={link.url || ''}
                              onChange={(e) =>
                                handleLinkChange(index, 'url', e.target.value)
                              }
                              size="small"
                              fullWidth
                              placeholder="https://..."
                            />
                          </Box>
                          <IconButton
                            onClick={() => handleRemoveLink(index)}
                            size="small"
                            color="error"
                            sx={{ mt: 0.5 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {error && (
            <Typography
              color="error"
              variant="body2"
              sx={{ mt: 2, p: 1, background: 'error.light', borderRadius: 1 }}
            >
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} variant="outlined" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !formData.title.trim()}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TaskEditDialog
