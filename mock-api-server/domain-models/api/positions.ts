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
    accountId: dbPosition.account_id,
    shares: dbPosition.shares,
    sharesVoted: dbPosition.shares_voted,
    voteStatus: dbPosition.vote_status,
    votingSource: dbPosition.voting_source,
    createdAt: dbPosition.created_at,
    updatedAt: dbPosition.updated_at,
    account: dbPosition.account,
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
      query = query.eq('vote_status', params.voteStatus)
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
  body: CreatePositionRequest
): Promise<ApiResponse<Position>> {
  try {
    const { data, error } = await supabase
      .from('position')
      .insert({
        meeting_id: body.meetingId,
        account_id: body.accountId,
        shares: body.shares,
        shares_voted: body.sharesVoted,
        vote_status: body.voteStatus,
        voting_source: body.votingSource,
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
  body: UpdatePositionRequest
): Promise<ApiResponse<Position>> {
  try {
    const updateData: any = {}
    if (body.meetingId !== undefined) updateData.meeting_id = body.meetingId
    if (body.accountId !== undefined) updateData.account_id = body.accountId
    if (body.shares !== undefined) updateData.shares = body.shares
    if (body.sharesVoted !== undefined) updateData.shares_voted = body.sharesVoted
    if (body.voteStatus !== undefined) updateData.vote_status = body.voteStatus
    if (body.votingSource !== undefined) updateData.voting_source = body.votingSource

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
