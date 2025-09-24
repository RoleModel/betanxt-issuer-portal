import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'

// Use generated types from OpenAPI schema
type Task = components['schemas']['Task']
type CreateTaskRequest = components['schemas']['CreateTaskRequest']
type UpdateTaskRequest = components['schemas']['UpdateTaskRequest']

// Helper type for backend responses
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

// Transform snake_case database fields to camelCase API fields
function transformTask(dbTask: any): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    dueDate: dbTask.due_date,
    owner: dbTask.owner,
    status: dbTask.status,
    meetingId: dbTask.meeting_id,
    phaseId: dbTask.phase_id,
    phaseNumber: dbTask.phase_number,
    type: dbTask.type,
    documentId: dbTask.document_id,
    links: dbTask.links,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
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
  body: unknown
): Promise<ApiResponse<Task>> {
  try {
    const request = body as CreateTaskRequest
    const { data, error } = await supabase
      .from('task')
      .insert({
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
  body: unknown
): Promise<ApiResponse<Task>> {
  try {
    const request = body as UpdateTaskRequest
    const updateData: any = {}
    if (request.title !== undefined) updateData.title = request.title
    if (request.description !== undefined) updateData.description = request.description
    if (request.dueDate !== undefined) updateData.due_date = request.dueDate
    if (request.owner !== undefined) updateData.owner = request.owner
    if (request.status !== undefined) updateData.status = request.status
    if (request.phaseNumber !== undefined) updateData.phase_number = request.phaseNumber
    if (request.type !== undefined) updateData.type = request.type
    if (request.documentId !== undefined) updateData.document_id = request.documentId
    if (request.links !== undefined) updateData.links = request.links

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
