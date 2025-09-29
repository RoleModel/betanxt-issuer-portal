import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'
import type { Database } from '@/utils/supabase/database.types'
import { randomUUID } from 'crypto'

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

// Use generated types from OpenAPI schema
type Task = components['schemas']['Task']
type CreateTaskRequest = components['schemas']['CreateTaskRequest']
type UpdateTaskRequest = components['schemas']['UpdateTaskRequest']
type TaskRow = Database['public']['Tables']['task']['Row']
type TaskUpdate = Database['public']['Tables']['task']['Update']

// Helper type for backend responses
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

// Transform snake_case database fields to camelCase API fields
function transformTask(dbTask: TaskRow): Task {
  return {
    id: dbTask.id,
    title: nullToUndefined(dbTask.title),
    description: nullToUndefined(dbTask.description),
    dueDate: nullToUndefined(dbTask.due_date),
    owner: nullToUndefined(dbTask.owner),
    status: nullToUndefined(dbTask.status) as 'COMPLETE' | 'INCOMPLETE' | 'CANCELLED' | 'NEEDS_AUTHORIZATION' | 'AUTHORIZED' | 'PENDING_AUTHORIZATION' | 'WAITING_FOR_FORM_RETURN' | 'AUTHORIZATION_NEEDED' | 'SUBMITTED_AWAITING_RECORD_DATE' | 'REQUEST_FORM_TO_FOLLOW' | undefined,
    meetingId: nullToUndefined(dbTask.meeting_id),
    phaseId: nullToUndefined(dbTask.phase_id),
    phaseNumber: nullToUndefined(dbTask.phase_number),
    type: nullToUndefined(dbTask.type),
    documentId: nullToUndefined(dbTask.document_id),
    links: dbTask.links as Record<string, never> | null,
    createdAt: nullToUndefined(dbTask.created_at),
    updatedAt: nullToUndefined(dbTask.updated_at),
  }
}

export async function listTasks(
  meetingId: string,
  opts?: { phaseId?: string; status?: string; owner?: string }
): Promise<ApiResponse<Task[]>> {
  try {
    let query = supabase.from('task').select('*').eq('meeting_id', meetingId)

    // Apply filters
    if (opts?.phaseId) {
      query = query.eq('phase_id', opts.phaseId)
    }
    if (opts?.status) {
      query = query.eq('status', opts.status)
    }
    if (opts?.owner) {
      query = query.eq('owner', opts.owner)
    }

    const { data, error } = await query

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch tasks' },
      }
    }

    return {
      data: data.map(transformTask),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch tasks',
      },
    }
  }
}

export async function createTask(
  meetingId: string,
  body: CreateTaskRequest
): Promise<ApiResponse<Task>> {
  try {
    const request = body
    const { data, error } = await supabase
      .from('task')
      .insert({
        id: randomUUID(),
        meeting_id: meetingId,
        task_id: request.taskId,
        title: request.title,
        description: request.description,
        due_date: request.dueDate,
        owner: request.owner,
        status: 'TODO',
        phase_id: request.phaseId,
        phase_number: request.phaseNumber,
        type: request.type,
        document_id: request.documentId,
        links: request.links,
      })
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to create task' },
      }
    }

    return {
      data: transformTask(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to create task',
      },
    }
  }
}

export async function getTaskById(id: string): Promise<ApiResponse<Task>> {
  try {
    const { data, error } = await supabase.from('task').select('*').eq('id', id).single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch task' },
      }
    }

    return {
      data: transformTask(data),
    }
  } catch (error) {
    return {
      error: { message: error instanceof Error ? error.message : 'Failed to fetch task' },
    }
  }
}

export async function updateTask(
  id: string,
  body: UpdateTaskRequest
): Promise<ApiResponse<Task>> {
  try {
    const request = body
    const updateData: Partial<TaskUpdate> = {
      updated_at: new Date().toISOString(),
    }
    if (request.title !== undefined) updateData.title = request.title
    if (request.description !== undefined) updateData.description = request.description
    if (request.dueDate !== undefined) updateData.due_date = request.dueDate
    if (request.owner !== undefined) updateData.owner = request.owner
    if (request.status !== undefined) updateData.status = request.status
    if (request.phaseNumber !== undefined) updateData.phase_number = request.phaseNumber
    if (request.type !== undefined) updateData.type = request.type
    if (request.documentId !== undefined) updateData.document_id = request.documentId
    if (request.links !== undefined) updateData.links = request.links ?? null

    const { data, error } = await supabase
      .from('task')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to update task' },
      }
    }

    return {
      data: transformTask(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to update task',
      },
    }
  }
}

// Helper function for backward compatibility
export async function listTasksByMeetingId(
  meetingId: string
): Promise<ApiResponse<Task[]>> {
  return listTasks(meetingId)
}
