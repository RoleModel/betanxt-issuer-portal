import { type ApiClientReturnType, buildApiClient } from '../apiClient'

export async function listTasks(
  meetingId?: string,
  opts?: { phaseId?: string; status?: string }
): Promise<ApiClientReturnType<any[]>> {
  try {
    const supabase = buildApiClient()
    let query = supabase.from('task').select('*')
    if (meetingId) query = query.eq('meeting_id', meetingId)
    if (opts?.phaseId) query = query.eq('phase_id', opts.phaseId)
    if (opts?.status) query = query.eq('status', opts.status)
    query = query.order('phase_number', { ascending: true })
    const { data, error } = await query
    if (error)
      return {
        data: undefined,
        error: { message: error.message, statusCode: 500 },
      }
    // Convert snake_case from DB to camelCase expected by app
    const converted = (data || []).map((t: any) => ({
      ...t,
      taskId: t.task_id,
      meetingId: t.meeting_id,
      phaseId: t.phase_id,
      phaseNumber: t.phase_number,
      dueDate: t.due_date,
      documentId: t.document_id ?? null,
      createdAt: t.created_at ?? null,
      updatedAt: t.updated_at ?? null,
      status: t.status?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) || t.status, // Transform NEEDS_AUTHORIZATION to Needs Authorization
    }))
    return { data: converted, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch tasks',
        statusCode: 500,
      },
    }
  }
}

export async function createTask(meetingId: string, body: any): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const payload = { ...body, meeting_id: body.meeting_id || meetingId }
    const { data, error } = await supabase.from('task').insert([payload]).select().single()
    if (error)
      return {
        data: undefined,
        error: { message: error.message, statusCode: 500 },
      }
    // Convert to camelCase on return
    const converted = data
      ? {
        ...data,
        taskId: data.task_id,
        meetingId: data.meeting_id,
        phaseId: data.phase_id,
        phaseNumber: data.phase_number,
        dueDate: data.due_date,
        documentId: data.document_id ?? null,
        createdAt: data.created_at ?? null,
        updatedAt: data.updated_at ?? null,
      }
      : null
    return { data: converted, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create task',
        statusCode: 500,
      },
    }
  }
}

export async function getTaskById(id: string): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase.from('task').select('*').eq('id', id).single()
    if (error)
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }

    // Convert snake_case from DB to camelCase expected by app (same as listTasks)
    const converted = {
      ...data,
      taskId: data.task_id,
      meetingId: data.meeting_id,
      phaseId: data.phase_id,
      phaseNumber: data.phase_number,
      dueDate: data.due_date,
      documentId: data.document_id ?? null,
      createdAt: data.created_at ?? null,
      updatedAt: data.updated_at ?? null,
    }

    return { data: converted, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch task',
        statusCode: 500,
      },
    }
  }
}

export async function updateTask(
  id: string,
  body: any
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    // Convert camelCase to snake_case for database
    const dbPayload = {
      title: body.title,
      description: body.description,
      type: body.type,
      status: body.status,
      phase_number: body.phaseNumber, // Convert phaseNumber to phase_number
      due_date: body.dueDate,
      owner: body.owner,
      updated_at: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(dbPayload).forEach(key => {
      if (dbPayload[key as keyof typeof dbPayload] === undefined) {
        delete dbPayload[key as keyof typeof dbPayload]
      }
    })

    const { data, error } = await supabase
      .from('task')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single()
    if (error)
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }

    // Convert snake_case back to camelCase for frontend (same as other functions)
    const converted = {
      ...data,
      taskId: data.task_id,
      meetingId: data.meeting_id,
      phaseId: data.phase_id,
      phaseNumber: data.phase_number,
      dueDate: data.due_date,
      documentId: data.document_id ?? null,
      createdAt: data.created_at ?? null,
      updatedAt: data.updated_at ?? null,
    }

    return { data: converted, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update task',
        statusCode: 500,
      },
    }
  }
}
