import { useCallback, useState } from 'react'

import type { components } from '@/types/api'
import { determineTaskStatus } from '@/utils/taskDrawer/taskStatus'

type TaskStatus = components['schemas']['TaskStatus']

interface UploadFile {
  id: string
  file: File
}

interface TaskToSubmit {
  id?: string
  meetingId?: string
  meeting_id?: string
  title?: string
  type?: string
}

interface UseTaskSubmissionProps {
  uploadDocument?: (
    file: File,
    documentType: string,
    meetingId?: string,
    documentTitle?: string,
    taskId?: string
  ) => Promise<string | null>
  updateTaskById: (taskId: string, updates: { status: TaskStatus }) => Promise<void>
}

export const useTaskSubmission = ({
  uploadDocument,
  updateTaskById,
}: UseTaskSubmissionProps) => {
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)

  const submitRegularFiles = useCallback(
    async (
      uploadFiles: UploadFile[],
      taskToSubmit: TaskToSubmit
    ): Promise<TaskStatus> => {
      if (!uploadDocument || !taskToSubmit.meetingId) {
        throw new Error('Missing required dependencies for file upload')
      }

      const meetingId =
        typeof taskToSubmit.meetingId === 'string'
          ? taskToSubmit.meetingId
          : taskToSubmit.meeting_id
      const taskIdToUse =
        typeof taskToSubmit.id === 'string' ? taskToSubmit.id : undefined

      if (!meetingId) {
        throw new Error('Meeting ID is required for file upload')
      }

      // Upload each file to document repository
      for (const uploadFile of uploadFiles) {
        const documentType = taskToSubmit.type || 'upload'
        const uploadPath = await uploadDocument(
          uploadFile.file,
          documentType,
          meetingId,
          uploadFile.file.name,
          taskIdToUse
        )
        if (uploadPath === null) {
          throw new Error(`Failed to upload file: ${uploadFile.file.name}`)
        }
      }

      // Determine appropriate status based on task type
      const newStatus = determineTaskStatus(taskToSubmit.title || '')

      // Update task status
      if (taskToSubmit.id) {
        await updateTaskById(taskToSubmit.id, { status: newStatus })
      }

      return newStatus
    },
    [uploadDocument, updateTaskById]
  )

  return {
    isSubmittingTask,
    setIsSubmittingTask,
    submitRegularFiles,
  }
}
