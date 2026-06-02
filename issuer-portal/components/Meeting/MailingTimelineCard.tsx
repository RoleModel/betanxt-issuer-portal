'use client'

import { useSession } from 'next-auth/react'
import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
  timelineItemClasses,
} from '@mui/lab'
import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import Fade from '@mui/material/Fade'

import FeatureTile from '@/components/FeatureTile'
import BNFileUpload from '@/components/FileUpload/BNFileUpload'
import type { UploadFile } from '@/components/FileUpload/types'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'
import { parseLocalDate } from '@/utils/dateUtils'

type Document = components['schemas']['Document']
type UpdateMeetingRequest = components['schemas']['UpdateMeetingRequest']

export type MailingStatus =
  | 'Preparing for Mailing'
  | 'Proofing & Approval'
  | 'Mailing In Progress'
  | 'Mailing Completed'

interface WorkflowStep {
  label: MailingStatus
  paletteVar: string
  color?: string
}

interface MailingTimelineCardProps {
  currentStatus?: MailingStatus | null
  statusDate?: string | null
  meetingId?: string
  onStatusChange?: (newStatus: MailingStatus) => void
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    label: 'Preparing for Mailing',
    paletteVar: 'var(--mui-palette-statusPending-main)',
    color: 'var(--mui-palette-statusPending-contrastText)',
  },
  {
    label: 'Proofing & Approval',
    paletteVar: 'var(--mui-palette-statusProofing-main)',
    color: 'var(--mui-palette-statusProofing-contrastText)',
  },
  {
    label: 'Mailing In Progress',
    paletteVar: 'var(--mui-palette-statusProduction-main)',
    color: 'var(--mui-palette-statusProduction-contrastText)',
  },
  {
    label: 'Mailing Completed',
    paletteVar: 'var(--mui-palette-statusComplete-main)',
    color: 'var(--mui-palette-statusComplete-contrastText)',
  },
]

export default function MailingTimelineCard({
  currentStatus,
  statusDate,
  meetingId,
  onStatusChange,
}: MailingTimelineCardProps) {
  const { data: session } = useSession()
  const isCSM = session?.user?.type === 'CSM'

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<MailingStatus | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [localAffidavitDoc, setLocalAffidavitDoc] = useState<Document | null | undefined>(
    undefined
  )
  const [localStatus, setLocalStatus] = useState<MailingStatus | null | undefined>(undefined)

  const { data: affidavitDoc, isLoading: affidavitLoading } = useSWR<Document | null>(
    meetingId ? `/meetings/${meetingId}/affidavit-of-mailing` : null,
    async () => {
      if (!meetingId) return null
      const apiClient = await buildApiClient()
      const { data } = await apiClient.GET('/meetings/{meetingId}/documents', {
        params: { path: { meetingId }, query: { type: 'affidavit-of-mailing' } },
      })
      const docs = (data as unknown as Document[]) ?? []
      return docs.length > 0 ? docs[0] : null
    },
    { revalidateOnFocus: false }
  )

  const displayDoc = localAffidavitDoc === undefined ? affidavitDoc : localAffidavitDoc
  const hasAffidavit = !!displayDoc
  const isAffidavitLoading = localAffidavitDoc === undefined && affidavitLoading

  const displayStatus = localStatus === undefined ? currentStatus : localStatus

  const activeIndex = displayStatus
    ? WORKFLOW_STEPS.findIndex((s) => s.label === displayStatus)
    : -1

  const handleStatusStepClick = (step: WorkflowStep) => {
    if (!isCSM || !meetingId) return
    setPendingStatus(step.label)
    setStatusDialogOpen(true)
  }

  const handleStatusUpdate = async () => {
    if (!pendingStatus || !meetingId) return

    setIsUpdatingStatus(true)
    try {
      const apiClient = await buildApiClient()
      const body: UpdateMeetingRequest = { mailingStatus: pendingStatus }
      await apiClient.PUT('/meetings/{meetingId}', {
        params: { path: { meetingId } },
        body,
      })
      setLocalStatus(pendingStatus)
      onStatusChange?.(pendingStatus)
      setStatusDialogOpen(false)
      setPendingStatus(null)
    } catch {
      // Update failed; dialog stays open for retry
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const formattedDate = statusDate
    ? parseLocalDate(statusDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const handleFilesSelected = (_files: File[]) => {
    // Files are automatically added to the upload component state
  }

  const handleFileRemove = (_fileId: string) => {
    // File removal is handled by the upload component
  }

  const handleUpload = async (_files: File[]): Promise<void> => {
    return Promise.resolve()
  }

  const handleFileStateChange = (files: UploadFile[]) => {
    setUploadFiles(files)
  }

  const handleUploadSubmit = async () => {
    const completedFiles = uploadFiles.filter((f) => f.status === 'complete')
    if (completedFiles.length === 0 || !meetingId) return

    setIsUploading(true)
    try {
      const apiClient = await buildApiClient()

      if (displayDoc?.id) {
        await apiClient.DELETE('/documents/{id}', {
          params: { path: { id: displayDoc.id } },
        })
      }

      const file = completedFiles[0].file
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      const base64Data = await base64Promise

      const { data: createdDoc, error: createError } = await apiClient.POST(
        '/meetings/{meetingId}/documents',
        {
          params: { path: { meetingId } },
          body: {
            title: 'Affidavit of Mailing',
            type: 'affidavit-of-mailing',
            file: base64Data,
          },
        }
      )

      if (createError) {
        return
      }

      if (createdDoc) {
        setLocalAffidavitDoc(createdDoc as unknown as Document)
      }
      setUploadDialogOpen(false)
      setUploadFiles([])
    } catch {
      // Upload failed; dialog stays open for retry
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!displayDoc?.id || !meetingId) return

    setIsDeleting(true)
    try {
      const apiClient = await buildApiClient()
      await apiClient.DELETE('/documents/{id}', {
        params: { path: { id: displayDoc.id } },
      })

      await mutate(`/meetings/${meetingId}/affidavit-of-mailing`, null, {
        revalidate: false,
      })
      setLocalAffidavitDoc(null)
      setDeleteDialogOpen(false)
    } catch {
      // Delete failed; user can retry from the dialog
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = () => {
    if (!displayDoc?.id || !meetingId) return

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api'
    const downloadUrl = `${baseUrl}/documents/${displayDoc.id}/download`

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = displayDoc.title ?? 'affidavit-of-mailing.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const hasCompletedFiles = uploadFiles.some((f) => f.status === 'complete')

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <Stack spacing={hasAffidavit ? 2 : 0}>
      <Card sx={{ height: '100%' }}>
        <CardHeader
          title="Mailing Timeline"
          action={
            isCSM && meetingId ? (
              <Tooltip title="Click a step to update status">
                <EditIcon fontSize="small" color="action" sx={{ mt: 1.5, mr: 0.5 }} />
              </Tooltip>
            ) : undefined
          }
        />
        <CardContent sx={{ pt: 0 }}>
          <Timeline
            sx={{
              p: 0,
              m: 0,
              [`& .${timelineItemClasses.root}:before`]: {
                flex: 0,
                padding: 0,
              },
            }}
          >
            {WORKFLOW_STEPS.map((step, index) => {
              const isCompleted = activeIndex >= 0 && index <= activeIndex
              const isCurrent = index === activeIndex
              const isLast = index === WORKFLOW_STEPS.length - 1

              const isClickable = isCSM && meetingId && !isUpdatingStatus

              return (
                <TimelineItem
                  key={step.label}
                  onClick={() => isClickable && handleStatusStepClick(step)}
                  sx={
                    isClickable
                      ? {
                          cursor: 'pointer',
                          borderRadius: 1,
                          mx: -1,
                          px: 1,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }
                      : undefined
                  }
                >
                  <TimelineSeparator
                    sx={{
                      marginBottom: '-0.5rem',
                    }}
                  >
                    <TimelineDot
                      variant={isCompleted ? 'filled' : 'outlined'}
                      sx={{
                        mt: 1,
                        bgcolor: isCompleted ? step.paletteVar : 'transparent',
                        borderColor: step.paletteVar,
                      }}
                    />
                    {!isLast && (
                      <TimelineConnector
                        sx={{
                          bgcolor: isCompleted
                            ? step.paletteVar
                            : (theme) => theme.vars.palette.divider,
                        }}
                      />
                    )}
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: 0.8, px: 2 }}>
                    {isCurrent ? (
                      <>
                        {formattedDate && (
                          <Typography
                            variant="body3"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 0.25 }}
                          >
                            {formattedDate}
                          </Typography>
                        )}
                        <Chip
                          icon={
                            isLast && isCompleted ? (
                              <CheckCircleIcon
                                sx={{
                                  '--mui-palette-Chip-defaultIconColor':
                                    'var(--mui-palette-success-contrastText)',
                                  fontSize: 16,
                                  boxSizing: 'content-box',
                                }}
                              />
                            ) : undefined
                          }
                          label={step.label}
                          size="small"
                          sx={{
                            bgcolor:
                              isLast && isCompleted
                                ? 'var(--mui-palette-success-main)'
                                : step.paletteVar,
                            color:
                              isLast && isCompleted
                                ? 'var(--mui-palette-success-contrastText)'
                                : step.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        />
                      </>
                    ) : (
                      <Typography
                        variant="body3"
                        fontWeight={500}
                        color={isCompleted ? 'text.primary' : 'text.secondary'}
                      >
                        {step.label}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              )
            })}
          </Timeline>
        </CardContent>
      </Card>
      {hasAffidavit && displayDoc && (
        <Fade in={hasAffidavit}>
          <Stack spacing={1}>
            <FeatureTile
              variant="primary"
              title={'Mailing Affidavit'}
              titleVariant="h3"
              description={`Uploaded: ${formatDateTime(displayDoc.updatedAt) ?? formatDateTime(displayDoc.createdAt)}`}
              actionText={'Download'}
              onClick={handleDownload}
            />
          </Stack>
        </Fade>
      )}

      {isCSM && !hasAffidavit && !isAffidavitLoading && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardActionArea onClick={() => setUploadDialogOpen(true)} disabled={!isCSM}>
            <CardHeader
              avatar={<UploadFileIcon color="action" />}
              title="Upload Mailing Affidavit"
            />
            <CardContent sx={{ pt: 0 }}>
              <Typography variant="body3" color="text.secondary">
                Click to upload the Mailing Affidavit.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      )}
      {hasAffidavit && displayDoc && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardActions>
            <CheckCircleIcon color="success" />
            <Typography variant="body3" color="text.secondary" sx={{ flexGrow: 1 }}>
              Mailing Affidavit Uploaded
            </Typography>
            <IconButton color="error" onClick={() => setDeleteDialogOpen(true)}>
              <DeleteIcon />
            </IconButton>
          </CardActions>
        </Card>
      )}

      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Mailing Affidavit</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Upload the Mailing Affidavit PDF document.
          </DialogContentText>
          <BNFileUpload
            maxFiles={1}
            acceptedFileTypes={['.pdf']}
            onFilesSelected={handleFilesSelected}
            onFileRemove={handleFileRemove}
            onUpload={handleUpload}
            onFileStateChange={handleFileStateChange}
            multiple={false}
            uploadedFiles={uploadFiles}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!hasCompletedFiles || isUploading}
            onClick={handleUploadSubmit}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the Mailing Affidavit? You can upload a new
            version after deletion.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={statusDialogOpen}
        onClose={() => !isUpdatingStatus && setStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Update Mailing Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Set the mailing timeline status to{' '}
            <strong>{pendingStatus}</strong>?
          </DialogContentText>
          <Select
            fullWidth
            size="small"
            value={pendingStatus ?? ''}
            onChange={(e) => setPendingStatus(e.target.value as MailingStatus)}
          >
            {WORKFLOW_STEPS.map((s) => (
              <MenuItem key={s.label} value={s.label}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setStatusDialogOpen(false)
              setPendingStatus(null)
            }}
            disabled={isUpdatingStatus}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!pendingStatus || isUpdatingStatus}
            onClick={handleStatusUpdate}
            startIcon={isUpdatingStatus ? <CircularProgress size={16} /> : undefined}
          >
            {isUpdatingStatus ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
