import { type ApiClientReturnType, buildApiClient } from '../apiClient'

export async function listDocuments(opts?: {
  meetingId?: string
  type?: string
  status?: string
  page?: number
  limit?: number
}): Promise<ApiClientReturnType<any[]>> {
  try {
    const supabase = buildApiClient()
    let query = supabase.from('document').select('*')
    if (opts?.meetingId) query = query.eq('meeting_id', opts.meetingId)
    if (opts?.type) query = query.eq('type', opts.type)
    if (opts?.status) query = query.eq('status', opts.status)
    query = query.order('created_at', { ascending: false })
    const { data, error } = await query
    if (error)
      return {
        data: undefined,
        error: { message: error.message, statusCode: 500 },
      }
    return { data: data || [], error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch documents',
        statusCode: 500,
      },
    }
  }
}

export async function createDocument(body: any): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase
      .from('document')
      .insert([body])
      .select()
      .single()
    if (error)
      return {
        data: undefined,
        error: { message: error.message, statusCode: 500 },
      }
    return { data, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create document',
        statusCode: 500,
      },
    }
  }
}

export async function getDocumentById(id: string): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase
      .from('document')
      .select('*')
      .eq('id', id)
      .single()
    if (error)
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }
    return { data, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch document',
        statusCode: 500,
      },
    }
  }
}

export async function updateDocument(
  id: string,
  body: any
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase
      .from('document')
      .update({ ...body, updated_at: new Date().toISOString() })
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
    return { data, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update document',
        statusCode: 500,
      },
    }
  }
}
