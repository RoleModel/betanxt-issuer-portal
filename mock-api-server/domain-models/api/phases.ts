import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'

// Use generated types from OpenAPI schema
type Phase = components['schemas']['Phase']
type CreatePhaseRequest = components['schemas']['CreatePhaseRequest']
type UpdatePhaseRequest = components['schemas']['UpdatePhaseRequest']

// Helper type for backend responses
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

// Transform snake_case database fields to camelCase API fields
function transformPhase(dbPhase: any): Phase {
  return {
    id: dbPhase.id,
    meetingId: dbPhase.meeting_id,
    name: dbPhase.name,
    orderIndex: dbPhase.order_index,
    status: dbPhase.status,
    keyDates: dbPhase.key_dates,
    createdAt: dbPhase.created_at,
    updatedAt: dbPhase.updated_at,
  }
}

export async function listPhases(
  meetingId: string,
  opts?: { status?: string }
): Promise<ApiResponse<Phase[]>> {
  try {
    let query = supabase.from('phase').select('*').eq('meeting_id', meetingId)

    // Apply filters
    if (opts?.status) {
      query = query.eq('status', opts.status)
    }

    // Order by order_index
    query = query.order('order_index', { ascending: true })

    const { data, error } = await query

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch phases' },
      }
    }

    return {
      data: data.map(transformPhase),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch phases',
      },
    }
  }
}

export async function createPhase(
  meetingId: string,
  body: unknown
): Promise<ApiResponse<Phase>> {
  try {
    const request = body as CreatePhaseRequest
    const { data, error } = await supabase
      .from('phase')
      .insert({
        meeting_id: meetingId,
        name: request.name,
        order_index: request.orderIndex,
        status: 'NOT_STARTED',
        key_dates: request.keyDates ? JSON.stringify(request.keyDates) : null,
      })
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to create phase' },
      }
    }

    return {
      data: transformPhase(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to create phase',
      },
    }
  }
}

export async function getPhaseById(id: string): Promise<ApiResponse<Phase>> {
  try {
    const { data, error } = await supabase.from('phase').select('*').eq('id', id).single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch phase' },
      }
    }

    return {
      data: transformPhase(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch phase',
      },
    }
  }
}

export async function updatePhase(
  id: string,
  body: unknown
): Promise<ApiResponse<Phase>> {
  try {
    const request = body as UpdatePhaseRequest
    const updateData: any = {}
    if (request.name !== undefined) updateData.name = request.name
    if (request.orderIndex !== undefined) updateData.order_index = request.orderIndex
    if (request.status !== undefined) updateData.status = request.status
    if (request.keyDates !== undefined)
      updateData.key_dates = JSON.stringify(request.keyDates)

    const { data, error } = await supabase
      .from('phase')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to update phase' },
      }
    }

    return {
      data: transformPhase(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to update phase',
      },
    }
  }
}

// Helper function for backward compatibility
export async function listPhasesByMeetingId(
  meetingId: string
): Promise<ApiResponse<Phase[]>> {
  return listPhases(meetingId)
}
