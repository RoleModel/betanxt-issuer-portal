import type { components } from '@/domain-models/generated-schema'

import type { Task } from '@/types/api-exports'

type ApiTask = components['schemas']['Task']

/**
 * Transform an API task response to our internal Task type
 * This ensures consistent task object structure across all components
 */
export function transformApiTaskToTask(apiTask: ApiTask | null | undefined): Task | null {
  if (!apiTask) return null

  return {
    id: apiTask.id ?? '',
    taskId: (apiTask.taskId || apiTask.id) ?? '',
    title: apiTask.title ?? '',
    description: apiTask.description || null,
    owner: apiTask.owner ?? 'BetaNXT',
    dueDate: apiTask.dueDate || null,
    status: apiTask.status ?? 'INCOMPLETE',
    meetingId: apiTask.meetingId ?? '',
    phaseId: apiTask.phaseId ?? '',
    phaseNumber: apiTask.phaseNumber ?? 0,
    type: (apiTask.type ?? 'external') as Task['type'],
    documentId: apiTask.documentId || undefined,
    links: apiTask.links || null,
    createdAt: apiTask.createdAt || undefined,
    updatedAt: apiTask.updatedAt || undefined,
  }
}

/**
 * Transform multiple API tasks to our internal Task type
 */
export function transformApiTasksToTasks(apiTasks: ApiTask[]): Task[] {
  return apiTasks
    .map(transformApiTaskToTask)
    .filter((task): task is Task => task !== null)
}

/**
 * Transform our internal Task type back to API format
 */
export function transformTaskToApiTask(task: Task | null | undefined): ApiTask | null {
  if (!task) return null

  return {
    id: task.id,
    taskId: task.taskId || task.id,
    title: task.title,
    description: task.description,
    owner: task.owner,
    dueDate: task.dueDate,
    status: task.status,
    meetingId: task.meetingId,
    phaseId: task.phaseId,
    phaseNumber: task.phaseNumber,
    type: task.type,
    documentId: task.documentId,
    links: task.links,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

/**
 * Determine if a task is a DTCC Authorization task
 */
export function isDTCCAuthorizationTask(task: Task | null | undefined): boolean {
  if (!task?.title) return false
  return task.title.includes('DTCC') && task.title.includes('Authorization')
}

/**
 * Determine if a task is owned by the issuer (not BetaNXT or DFIN)
 */
export function isIssuerOwnedTask(task: Task | null | undefined): boolean {
  if (!task?.owner) return false
  return !['BetaNXT', 'DFIN'].includes(task.owner)
}

/**
 * Get the appropriate status for a DTCC Authorization task based on checkbox state
 */
export function getDTCCAuthorizationStatus(isChecked: boolean): Task['status'] {
  return isChecked ? 'AUTHORIZED' : 'NEEDS_AUTHORIZATION'
}
