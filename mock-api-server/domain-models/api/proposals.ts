import { type ApiClientReturnType, buildApiClient } from '../apiClient'

export async function listProposals(
  meetingId?: string
): Promise<ApiClientReturnType<any[]>> {
  try {
    const supabase = buildApiClient()
    let query = supabase.from('proposal').select('*')
    if (meetingId) query = query.eq('meeting_id', meetingId)
    query = query.order('proposal_number', { ascending: true })
    const { data, error } = await query
    if (error)
      return {
        data: undefined,
        error: { message: error.message, statusCode: 500 },
      }

    // Convert snake_case to camelCase for proposals
    const convertedProposals = (data || []).map(proposal => ({
      ...proposal,
      proposalNumber: proposal.proposal_number,
      proposalTitle: proposal.proposal_title,
      proposalType: proposal.proposal_type,
      proposalDescription: proposal.proposal_description,
      directorName: proposal.director_name,
      directorClass: proposal.director_class,
      directorTermYears: proposal.director_term_years,
      meetingId: proposal.meeting_id,
      totalVotesFor: proposal.total_votes_for,
      totalVotesAgainst: proposal.total_votes_against,
      totalVotesAbstain: proposal.total_votes_abstain,
      percentageFor: proposal.percentage_for,
      percentageAgainst: proposal.percentage_against,
      percentageAbstain: proposal.percentage_abstain,
      finalResult: proposal.final_result,
      createdAt: proposal.created_at,
      updatedAt: proposal.updated_at
    }))

    return { data: convertedProposals, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch proposals',
        statusCode: 500,
      },
    }
  }
}

export async function createProposal(body: any): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase
      .from('proposal')
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
        message: error instanceof Error ? error.message : 'Failed to create proposal',
        statusCode: 500,
      },
    }
  }
}

export async function getProposalById(id: string): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase
      .from('proposal')
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
        message: error instanceof Error ? error.message : 'Failed to fetch proposal',
        statusCode: 500,
      },
    }
  }
}

export async function updateProposal(
  id: string,
  body: any
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase
      .from('proposal')
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
        message: error instanceof Error ? error.message : 'Failed to update proposal',
        statusCode: 500,
      },
    }
  }
}
