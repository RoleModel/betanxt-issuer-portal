import { type ApiClientReturnType, buildApiClient } from '../apiClient'

export async function listPositionVotes(opts?: {
  positionId?: string
  proposalId?: string
}): Promise<ApiClientReturnType<any[]>> {
  try {
    const supabase = buildApiClient()
    let query = supabase.from('position_vote').select('*')
    if (opts?.positionId) query = query.eq('position_id', opts.positionId)
    if (opts?.proposalId) query = query.eq('proposal_id', opts.proposalId)
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
        message:
          error instanceof Error ? error.message : 'Failed to fetch position votes',
        statusCode: 500,
      },
    }
  }
}

export async function createPositionVote(body: any): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase
      .from('position_vote')
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
        message:
          error instanceof Error ? error.message : 'Failed to create position vote',
        statusCode: 500,
      },
    }
  }
}
