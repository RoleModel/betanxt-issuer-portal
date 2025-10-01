import type { components } from '@/types/api'

type TaskStatus = components['schemas']['TaskStatus']

/**
 * Determines the appropriate task status after submission based on task type
 */
export const determineTaskStatus = (taskTitle: string): TaskStatus => {
  const title = taskTitle.toLowerCase()

  if (title.includes('broadridge') || title.includes('ics access')) {
    return 'PENDING_AUTHORIZATION'
  }

  if (title.includes('transfer agent')) {
    return 'SUBMITTED_AWAITING_RECORD_DATE'
  }

  if (title.includes('plan file request')) {
    return 'SUBMITTED_AWAITING_RECORD_DATE'
  }

  if (title.includes('proxy statement') || title.includes('draft')) {
    return 'PENDING_AUTHORIZATION'
  }

  return 'PENDING_AUTHORIZATION'
}

/**
 * Statuses that count as "completed" for meeting completion calculation
 */
export const COMPLETED_STATUSES: TaskStatus[] = [
  'COMPLETE',
  'AUTHORIZED',
  'SUBMITTED_AWAITING_RECORD_DATE',
  'WAITING_FOR_FORM_RETURN',
  'REQUEST_FORM_TO_FOLLOW',
  'PENDING_AUTHORIZATION',
]

/**
 * Statuses that indicate a signed document exists for the task
 */
export const SIGNED_DOCUMENT_STATUSES: TaskStatus[] = [
  'PENDING_AUTHORIZATION',
  'AUTHORIZED',
  'COMPLETE',
  'SUBMITTED_AWAITING_RECORD_DATE',
  'WAITING_FOR_FORM_RETURN',
]

/**
 * Check if a task status indicates a signed document exists
 */
export const hasSignedDocumentStatus = (status?: string | null): boolean => {
  if (!status) return false
  return SIGNED_DOCUMENT_STATUSES.includes(status as TaskStatus)
}

/**
 * Get the appropriate action button label based on task state
 */
export const getTaskActionButtonLabel = (
  taskTitle: string,
  hasSignedDocument: boolean
): string => {
  const titleLower = taskTitle.toLowerCase()
  const isFormTask =
    titleLower.includes('form') ||
    titleLower.includes('broadridge') ||
    titleLower.includes('plan file') ||
    titleLower.includes('transfer agent')

  if (hasSignedDocument) {
    return isFormTask ? 'View Form' : 'View Document'
  }

  return 'Sign Form'
}

/**
 * Calculate overall completion percentage based on tasks
 */
export const calculateOverallCompletion = (
  tasks: Array<{ status?: string | null }>,
  completedStatuses: TaskStatus[] = COMPLETED_STATUSES
): number => {
  if (tasks.length === 0) return 0

  const completedTasks = tasks.filter((t) =>
    completedStatuses.includes(t.status as TaskStatus)
  ).length

  return Math.round((completedTasks / tasks.length) * 100)
}
