import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useState } from 'react'

import type { components } from '@/types/api'
import { determineTaskStatus } from '@/utils/taskControl'
import { getDocumentTypeFromTask } from '@/utils/taskControl'

type Task = components['schemas']['Task']
type TaskStatus = components['schemas']['TaskStatus']

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'complete' | 'error'
  progress?: number
  error?: string
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
  setUploadFiles?: Dispatch<SetStateAction<UploadFile[]>>
}

export const useTaskSubmission = ({
  uploadDocument,
  updateTaskById,
  setUploadFiles,
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

      // Upload each file to document repository with progress tracking
      for (let i = 0; i < uploadFiles.length; i++) {
        const uploadFile = uploadFiles[i]

        // Update file status to uploading
        if (setUploadFiles) {
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'uploading' as const, progress: 0 }
                : f
            )
          )
        }

        try {
          const documentType = getDocumentTypeFromTask(taskToSubmit as Task)
          const uploadPath = await uploadDocument(
            uploadFile.file,
            documentType,
            meetingId,
            uploadFile.file.name,
            taskIdToUse
          )

          if (uploadPath === null) {
            // Update file status to error
            if (setUploadFiles) {
              setUploadFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id
                    ? { ...f, status: 'error' as const, error: 'Upload failed' }
                    : f
                )
              )
            }
            throw new Error(`Failed to upload file: ${uploadFile.file.name}`)
          }

          // Update file status to complete
          if (setUploadFiles) {
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, status: 'complete' as const, progress: 100 }
                  : f
              )
            )
          }
        } catch (error) {
          // Update file status to error
          if (setUploadFiles) {
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, status: 'error' as const, error: 'Upload failed' }
                  : f
              )
            )
          }
          throw error
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
    [uploadDocument, updateTaskById, setUploadFiles]
  )

  return {
    isSubmittingTask,
    setIsSubmittingTask,
    submitRegularFiles,
  }
}
