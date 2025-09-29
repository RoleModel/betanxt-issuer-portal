import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'
import type { Database } from '@/utils/supabase/database.types'
import { randomUUID } from 'crypto'

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

// Use generated types from OpenAPI schema
type Phase = components['schemas']['Phase']
type CreatePhaseRequest = components['schemas']['CreatePhaseRequest']
type UpdatePhaseRequest = components['schemas']['UpdatePhaseRequest']
type PhaseRow = Database['public']['Tables']['phase']['Row']
type PhaseUpdate = Database['public']['Tables']['phase']['Update']

// Helper type for backend responses
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

// Transform snake_case database fields to camelCase API fields
function transformPhase(dbPhase: PhaseRow): Phase {
  return {
    id: dbPhase.id,
    meetingId: nullToUndefined(dbPhase.meeting_id),
    name: nullToUndefined(dbPhase.name),
    orderIndex: nullToUndefined(dbPhase.order_index),
    status: nullToUndefined(dbPhase.status) as 'IN_PROGRESS' | 'COMPLETE' | undefined,
    keyDates: dbPhase.key_dates ? JSON.parse(dbPhase.key_dates) : undefined,
    createdAt: nullToUndefined(dbPhase.created_at),
    updatedAt: nullToUndefined(dbPhase.updated_at),
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
  body: CreatePhaseRequest
): Promise<ApiResponse<Phase>> {
  try {
    const request = body
    const { data, error } = await supabase
      .from('phase')
      .insert({
        id: randomUUID(),
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
      data: transformPhase(data as PhaseRow),
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
  body: UpdatePhaseRequest
): Promise<ApiResponse<Phase>> {
  try {
    const request = body
    const updateData: Partial<PhaseUpdate> = {}
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
      data: transformPhase(data as PhaseRow),
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
