'use client'

import { Box, Checkbox, FormControlLabel, Link, Stack } from '@mui/material'

import type { components } from '@/domain-models/generated-schema'

import { getStoragePublicUrl } from '@/utils/documentUtils'
import { getTaskActionButtonLabel } from '@/utils/taskControl'
import { findSignedDocumentForTask } from '@/utils/taskDrawer/documentMatching'
import type { TaskLink } from '@/utils/taskLinks'
import { isDTCCAuthorizationTask } from '@/utils/taskTransformers'

type Task = components['schemas']['Task']
type Document = components['schemas']['Document']

interface TaskActionsProps {
  task: Task
  taskLinks: TaskLink[]
  hasSignedDocument: boolean
  checkingSignedDocument: boolean
  dtccAuthorized: boolean
  onLinkClick: (link: TaskLink) => void
  onDtccAuthorizationChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  getDocumentsByMeeting: (meetingId: string) => Promise<Document[]>
  setDocumentUrl: (url: string) => void
  setCurrentDocumentId: (id: string) => void
  setSignatureAreas: (areas: never[]) => void
  setDocumentViewerOpen: (open: boolean) => void
}

const TaskActions: React.FC<TaskActionsProps> = ({
  task,
  taskLinks,
  hasSignedDocument,
  checkingSignedDocument,
  dtccAuthorized,
  onLinkClick,
  onDtccAuthorizationChange,
  getDocumentsByMeeting,
  setDocumentUrl,
  setCurrentDocumentId,
  setSignatureAreas,
  setDocumentViewerOpen,
}) => {

  // Only show actions for issuer-owned tasks, but allow authorize links for BetaNXT/DFIN tasks
  if (!taskLinks.length) {
    return null
  }

  // For BetaNXT/DFIN tasks, only show authorize links and DTCC authorization
  const isBetaNXTOrDFIN = ['BetaNXT', 'DFIN'].includes(task.owner ?? '')
  if (isBetaNXTOrDFIN) {
    const hasAuthorizeLinks = taskLinks.some(link => link.action === 'authorize')
    const isDTCCTask = isDTCCAuthorizationTask(task)

    if (!hasAuthorizeLinks && !isDTCCTask) {
      return null
    }
  }

  const handleViewSignedDocument = async () => {
    if (!task.meetingId) return

    const meetingDocuments = await getDocumentsByMeeting(task.meetingId)
    const signedDoc = findSignedDocumentForTask(task, meetingDocuments)

    if (signedDoc?.filePath) {
      const documentUrl = getStoragePublicUrl(signedDoc.filePath)
      setDocumentUrl(documentUrl)
      setCurrentDocumentId(signedDoc.id ?? '')
      setSignatureAreas([])
      setDocumentViewerOpen(true)
    } else {
      console.error('[TaskActions] Document search failed:', {
        taskId: task.id,
        taskIdField: task.taskId,
        taskTitle: task.title,
        taskStatus: task.status,
        meetingId: task.meetingId,
        documentsFound: meetingDocuments.length,
        documentTypes: meetingDocuments.map((d) => ({
          id: d.id,
          type: d.type,
          title: d.title,
          taskId: d.taskId,
        })),
      })
      alert(
        `No signed document found for this task.\n\nTask: ${task.title}\nStatus: ${task.status}\n\nPlease check the browser console for details.`
      )
    }
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
      {taskLinks
        .filter(link => {
          // For BetaNXT/DFIN tasks, only show authorize links
          if (isBetaNXTOrDFIN) {
            return link.action === 'authorize'
          }
          return true
        })
        .map((link, linkIndex) => {
          // Don't render signature buttons while checking for signed documents
          if (checkingSignedDocument && link.action === 'signature') {
            return null
          }

          // For signature tasks that have a signed document, show "View" button instead
          // But don't show for tasks that are pending authorization
          if (hasSignedDocument && link.action === 'signature') {
            // Don't show view button for tasks pending authorization
            if (task.status === 'PENDING_AUTHORIZATION') {
              return null
            }

            const viewLabel = getTaskActionButtonLabel(task.title ?? '', true)

            return (
              <Link
                sx={{ cursor: 'pointer' }}
                key={linkIndex}
                onClick={handleViewSignedDocument}
              >
                {viewLabel}
              </Link>
            )
          }

          // Skip upload action buttons - handled by dropzone in TaskDrawer
          if (link.action === 'upload') {
            return null
          }

          // Make sign, download, and authorize actions clickable
          // Signature and download actions can work without URLs (handled by form handlers)
          const isClickable = (
            link.action === 'signature' ||
            link.action === 'download' ||
            (link.url && link.action === 'authorize')
          )


          return isClickable ? (
            <Link
              key={linkIndex}
              onClick={() => onLinkClick(link)}
              sx={{ cursor: 'pointer' }}
            >
              {link.label}
            </Link>
          ) : null
        })}

      {/* DTCC Authorization Checkbox */}
      {isDTCCAuthorizationTask(task) && (
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                color="secondary"
                checked={dtccAuthorized}
                onChange={onDtccAuthorizationChange}
                size="small"
              />
            }
            label="Authorization confirmed"
          />
        </Box>
      )}
    </Stack>
  )
}

export default TaskActions
