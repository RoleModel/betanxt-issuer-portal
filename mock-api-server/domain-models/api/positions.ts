import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'

// Use generated types from OpenAPI schema
type Position = components['schemas']['Position']
type CreatePositionRequest = components['schemas']['CreatePositionRequest']
type UpdatePositionRequest = components['schemas']['UpdatePositionRequest']

// Helper type for backend responses
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

// Transform snake_case database fields to camelCase API fields
function transformPosition(dbPosition: any): Position {
  return {
    id: dbPosition.id,
    meetingId: dbPosition.meeting_id,
    cusip: dbPosition.cusip,
    accountType: dbPosition.account_type,
    setKey: dbPosition.set_key,
    name: dbPosition.name,
    accountNumber: dbPosition.account_number,
    controlNumber: dbPosition.control_number,
    voteStatus: dbPosition.vote_status,
    shares: dbPosition.shares,
    sharesVoted: dbPosition.shares_voted,
    source: dbPosition.source,
    dateVoted: dbPosition.date_voted,
    createdAt: dbPosition.created_at,
    updatedAt: dbPosition.updated_at,
  }
}

export async function listPositions(params?: {
  meetingId?: string
  cusip?: string
  accountType?: string
  voteStatus?: string
  page?: number
  limit?: number
  order?: string
  offset?: number
  select?: string
}): Promise<ApiResponse<{ positions: Position[] }>> {
  try {
    let query = supabase.from('position').select('*')

    // Apply filters
    if (params?.meetingId) {
      query = query.eq('meeting_id', params.meetingId)
    }
    if (params?.voteStatus) {
      query = query.eq('vote_status', params.voteStatus as any)
    }

    // Apply pagination
    if (params?.limit) {
      const offset = params?.offset || 0
      query = query.range(offset, offset + params.limit - 1)
    }

    // Apply ordering
    if (params?.order) {
      const [column, direction] = params.order.split('.')
      query = query.order(column, { ascending: direction !== 'desc' })
    }

    const { data, error } = await query

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch positions' },
      }
    }

    return {
      data: {
        positions: data.map(transformPosition),
      },
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch positions',
      },
    }
  }
}

export async function createPosition(
  body: unknown
): Promise<ApiResponse<Position>> {
  try {
    const request = body as CreatePositionRequest
    const { data, error } = await supabase
      .from('position')
      .insert({
        meeting_id: request.meetingId,
        cusip: request.cusip,
        account_type: request.accountType,
        set_key: request.setKey,
        name: request.name,
        account_number: request.accountNumber,
        control_number: request.controlNumber,
        vote_status: request.voteStatus,
        shares: request.shares,
        shares_voted: request.sharesVoted || 0,
        source: request.source,
        date_voted: request.dateVoted,
      })
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to create position' },
      }
    }

    return {
      data: transformPosition(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to create position',
      },
    }
  }
}

export async function getPositionById(id: string): Promise<ApiResponse<Position>> {
  try {
    const { data, error } = await supabase
      .from('position')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch position' },
      }
    }

    return {
      data: transformPosition(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch position',
      },
    }
  }
}

export async function updatePosition(
  id: string,
  body: unknown
): Promise<ApiResponse<Position>> {
  try {
    const request = body as UpdatePositionRequest
    const updateData: any = {}
    if (request.name !== undefined) updateData.name = request.name
    if (request.accountNumber !== undefined) updateData.account_number = request.accountNumber
    if (request.controlNumber !== undefined) updateData.control_number = request.controlNumber
    if (request.shares !== undefined) updateData.shares = request.shares
    if (request.sharesVoted !== undefined) updateData.shares_voted = request.sharesVoted
    if (request.voteStatus !== undefined) updateData.vote_status = request.voteStatus
    if (request.source !== undefined) updateData.source = request.source
    if (request.dateVoted !== undefined) updateData.date_voted = request.dateVoted

    const { data, error } = await supabase
      .from('position')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to update position' },
      }
    }

    return {
      data: transformPosition(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to update position',
      },
    }
  }
}
