import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'

// Use generated types from OpenAPI schema
type Proposal = components['schemas']['Proposal']
type CreateProposalRequest = components['schemas']['CreateProposalRequest']
type UpdateProposalRequest = components['schemas']['UpdateProposalRequest']

// Helper type for consistent response format
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

export async function listProposals(
  meetingId: string,
  proposalType?: string
): Promise<ApiResponse<Proposal[]>> {
  try {
    let query = supabase
      .from('proposal')
      .select('*')
      .eq('meeting_id', meetingId)

    if (proposalType) {
      query = query.eq('proposal_type', proposalType)
    }

    const { data, error } = await query

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message || 'Failed to fetch proposals',
          statusCode: 500,
        },
      }
    }

    // Transform database rows to API response format
    const proposals: Proposal[] = (data || []).map((row: any) => ({
      id: row.id,
      proposalNumber: row.proposal_number,
      proposalTitle: row.proposal_title,
      description: row.description,
      directorName: row.director_name,
      proposalType: row.proposal_type,
      meetingId: row.meeting_id,
      orderIndex: row.order_index,
      totalVotesFor: row.total_votes_for,
      totalVotesAgainst: row.total_votes_against,
      totalVotesAbstain: row.total_votes_abstain,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return {
      data: proposals,
      error: undefined,
    }
  } catch (err) {
    return {
      data: undefined,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        statusCode: 500,
      },
    }
  }
}

export async function createProposal(
  meetingId: string,
  body: CreateProposalRequest
): Promise<ApiResponse<Proposal>> {
  try {
    const { data, error } = await supabase
      .from('proposal')
      .insert({
        meeting_id: meetingId,
        proposal_number: body.proposalNumber,
        proposal_title: body.proposalTitle,
        description: body.description,
        director_name: body.directorName,
        proposal_type: body.proposalType,
        order_index: body.orderIndex,
      })
      .select()
      .single()

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message || 'Failed to create proposal',
          statusCode: 400,
        },
      }
    }

    // Transform database row to API response format
    const proposal: Proposal = {
      id: data.id,
      proposalNumber: data.proposal_number,
      proposalTitle: data.proposal_title,
      description: data.description,
      directorName: data.director_name,
      proposalType: data.proposal_type,
      meetingId: data.meeting_id,
      orderIndex: data.order_index,
      totalVotesFor: data.total_votes_for,
      totalVotesAgainst: data.total_votes_against,
      totalVotesAbstain: data.total_votes_abstain,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return {
      data: proposal,
      error: undefined,
    }
  } catch (err) {
    return {
      data: undefined,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        statusCode: 500,
      },
    }
  }
}

export async function getProposalById(id: string): Promise<ApiResponse<Proposal>> {
  try {
    const { data, error } = await supabase
      .from('proposal')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message || 'Failed to fetch proposal',
          statusCode: 404,
        },
      }
    }

    // Transform database row to API response format
    const proposal: Proposal = {
      id: data.id,
      proposalNumber: data.proposal_number,
      proposalTitle: data.proposal_title,
      description: data.description,
      directorName: data.director_name,
      proposalType: data.proposal_type,
      meetingId: data.meeting_id,
      orderIndex: data.order_index,
      totalVotesFor: data.total_votes_for,
      totalVotesAgainst: data.total_votes_against,
      totalVotesAbstain: data.total_votes_abstain,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return {
      data: proposal,
      error: undefined,
    }
  } catch (err) {
    return {
      data: undefined,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        statusCode: 500,
      },
    }
  }
}

export async function updateProposal(
  id: string,
  body: UpdateProposalRequest
): Promise<ApiResponse<Proposal>> {
  try {
    const { data, error } = await supabase
      .from('proposal')
      .update({
        proposal_number: body.proposalNumber,
        proposal_title: body.proposalTitle,
        description: body.description,
        director_name: body.directorName,
        proposal_type: body.proposalType,
        order_index: body.orderIndex,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message || 'Failed to update proposal',
          statusCode: 400,
        },
      }
    }

    // Transform database row to API response format
    const proposal: Proposal = {
      id: data.id,
      proposalNumber: data.proposal_number,
      proposalTitle: data.proposal_title,
      description: data.description,
      directorName: data.director_name,
      proposalType: data.proposal_type,
      meetingId: data.meeting_id,
      orderIndex: data.order_index,
      totalVotesFor: data.total_votes_for,
      totalVotesAgainst: data.total_votes_against,
      totalVotesAbstain: data.total_votes_abstain,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return {
      data: proposal,
      error: undefined,
    }
  } catch (err) {
    return {
      data: undefined,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        statusCode: 500,
      },
    }
  }
}
