import { type ApiClientReturnType, buildApiClient } from '../apiClient'

export async function listPhases(meetingId: string): Promise<ApiClientReturnType<any[]>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase
      .from('phase')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('order_index', { ascending: true })
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
        message: error instanceof Error ? error.message : 'Failed to fetch phases',
        statusCode: 500,
      },
    }
  }
}

export async function createPhase(
  meetingId: string,
  body: any
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase
      .from('phase')
      .insert([{ ...body, meeting_id: meetingId }])
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
        message: error instanceof Error ? error.message : 'Failed to create phase',
        statusCode: 500,
      },
    }
  }
}

export async function getPhaseById(id: string): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase.from('phase').select('*').eq('id', id).single()
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
        message: error instanceof Error ? error.message : 'Failed to fetch phase',
        statusCode: 500,
      },
    }
  }
}

export async function updatePhase(
  id: string,
  body: any
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase
      .from('phase')
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
        message: error instanceof Error ? error.message : 'Failed to update phase',
        statusCode: 500,
      },
    }
  }
}
