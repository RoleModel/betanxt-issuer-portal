/**
 * Task Control Utility
 * Centralized logic for task-specific behaviors and display rules
 */

import type { components } from '@/domain-models/generated-schema'

type Task = components['schemas']['Task']
type TaskStatus = components['schemas']['TaskStatus']

/**
 * Task type definitions for special handling
 */
export const TASK_TYPES = {
  // Phase 4 Delivery Tasks (BetaNXT owned)
  PROXY_MATERIALS: 'proxy materials',
  TABULATION_REPORTS: 'tabulation',
  VOTING_RESULTS: 'voting results',
  FINAL_RESULTS: 'final',

  // Document Upload Tasks
  DRAFT_PROXY_STATEMENT: 'draft proxy statement',
  PROXY_CARD: 'proxy card',
  NOTICE_ACCESS: 'notice',
  VOTING_INSTRUCTION: 'voting instruction',

  // Form Tasks
  TRANSFER_AGENT: 'transfer agent',
  PLAN_FILE: 'plan file',
  BROADRIDGE: 'broadridge',
} as const

/**
 * Get the normalized task type from a task title
 */
export const getTaskType = (title: string): string => {
  const normalized = title.toLowerCase()

  // Check each task type
  for (const [_key, value] of Object.entries(TASK_TYPES)) {
    if (normalized.includes(value)) {
      return value
    }
  }

  return 'other'
}

/**
 * Determine if a task should show a status chip
 */
export const shouldShowStatusChip = (task: Task): boolean => {
  const title = (task.title || '').toLowerCase()

  // Hide status chip for Phase 4 delivery tasks
  const hideForTasks = [
    TASK_TYPES.PROXY_MATERIALS,
    TASK_TYPES.TABULATION_REPORTS,
    TASK_TYPES.VOTING_RESULTS,
    TASK_TYPES.FINAL_RESULTS,
  ]

  return !hideForTasks.some((taskType) => title.includes(taskType))
}

/**
 * Get the appropriate date label for a task
 */
export const getDateLabel = (task: Task, formattedDate: string): string => {
  const title = (task.title || '').toLowerCase()

  if (title.includes(TASK_TYPES.PROXY_MATERIALS)) {
    return `Expected Delivery ${formattedDate}`
  }

  if (title.includes(TASK_TYPES.TABULATION_REPORTS)) {
    return `Expected Available ${formattedDate}`
  }

  if (title.includes(TASK_TYPES.VOTING_RESULTS)) {
    return `Expected Delivery ${formattedDate}`
  }

  if (title.includes(TASK_TYPES.FINAL_RESULTS)) {
    return `Expected to be Posted ${formattedDate}`
  }

  // Default: just return the date
  return formattedDate
}

/**
 * Map task title to proper document type for uploads
 */
export const getDocumentTypeFromTask = (task: Task): string => {
  const title = (task.title || '').toLowerCase()

  if (title.includes(TASK_TYPES.DRAFT_PROXY_STATEMENT)) return 'draft-proxy-statement'
  if (title.includes(TASK_TYPES.PROXY_CARD)) return 'proxy-card'
  if (title.includes(TASK_TYPES.NOTICE_ACCESS) && title.includes('access'))
    return 'notice-access-form'
  if (title.includes(TASK_TYPES.VOTING_INSTRUCTION)) return 'voting-instruction-form'
  if (title.includes(TASK_TYPES.TRANSFER_AGENT)) return 'transfer-agent-request'
  if (title.includes(TASK_TYPES.PLAN_FILE)) return 'plan-file-request'
  if (title.includes(TASK_TYPES.BROADRIDGE)) return 'broadridge-form'

  // Fallback to task type or 'upload'
  return task.type || 'upload'
}

/**
 * Determine if a task should be visible in a given phase
 */
export const shouldShowTaskInPhase = (
  task: Task,
  currentPhase: number,
  excludeOwners: string[] = ['BetaNXT', 'DFIN']
): boolean => {
  // Special case: Phase 4 includes BetaNXT delivery tasks
  if (currentPhase === 4) {
    if (task.owner === 'BetaNXT' && task.phaseNumber === 4) {
      return true
    }
  }

  // Exclude specified owners for other phases
  if (excludeOwners.includes(task.owner || '')) {
    return false
  }

  return true
}

/**
 * Phase 2 carry-over task titles
 */
export const PHASE_2_CARRYOVER_TASKS = [
  'DTCC authorization',
  'Plan File Request form',
  'Transfer Agent Registered File Request Form',
  'Broadridge/ICS Access',
  'Draft Proxy Statement',
  'Proxy Card',
  'Notice and Access (NAA) Form',
  '10-K print-ready PDF',
] as const

/**
 * Check if a task should be synced across phases
 */
export const isCarryoverTask = (taskTitle: string): boolean => {
  const normalizedTitle = taskTitle.toLowerCase().trim()
  return PHASE_2_CARRYOVER_TASKS.some(
    (carryoverTask) => normalizedTitle.includes(carryoverTask.toLowerCase())
  )
}

/**
 * Sync task status across phases for carryover tasks
 * Returns array of task IDs that were updated
 */
export const syncCarryoverTaskStatus = async (
  updatedTask: Task,
  allTasks: Task[],
  updateTaskFn: (taskId: string, updates: { status: TaskStatus }) => Promise<void>
): Promise<string[]> => {
  // Only sync if this is a carryover task
  if (!updatedTask.title || !isCarryoverTask(updatedTask.title)) {
    return []
  }

  // Find all tasks with the same title in the same meeting (but different phase)
  const tasksToSync = allTasks.filter(
    (task) =>
      task.id !== updatedTask.id && // Don't update the task that was just updated
      task.title === updatedTask.title &&
      task.meetingId === updatedTask.meetingId &&
      task.phaseNumber !== updatedTask.phaseNumber // Only sync across different phases
  )

  // Update all matching tasks with the new status
  const updatedIds: string[] = []
  for (const task of tasksToSync) {
    if (task.id && updatedTask.status) {
      try {
        await updateTaskFn(task.id, { status: updatedTask.status as TaskStatus })
        updatedIds.push(task.id)
      } catch (error) {
        console.error(`Failed to sync task ${task.id}:`, error)
      }
    }
  }

  return updatedIds
}

/**
 * Determines the appropriate task status after submission based on task type
 */
export const determineTaskStatus = (taskTitle: string): TaskStatus => {
  const title = taskTitle.toLowerCase()

  // Tasks requiring review after upload
  if (
    title.includes('notice and access') ||
    title.includes('notice & access') ||
    title.includes('proxy card') ||
    (title.includes('proxy statement') && title.includes('draft'))
  ) {
    return 'AWAITING_REVIEW'
  }

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
  'AWAITING_REVIEW',
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
