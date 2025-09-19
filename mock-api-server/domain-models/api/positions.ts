import { type ApiClientReturnType, buildApiClient } from '../apiClient'

export async function listPositions(params: {
  meetingId?: string
  cusip?: string
  accountType?: string
  voteStatus?: string
  page?: number
  limit?: number
  order?: string
  offset?: number
}): Promise<ApiClientReturnType<any[]>> {
  try {
    const supabase = buildApiClient()
    const page = params.page || 1
    const limit = params.limit || 50
    const offset = params.offset ?? (page - 1) * limit

    let query = supabase.from('position').select('*', { count: 'exact' })

    if (params.meetingId) query = query.eq('meeting_id', params.meetingId)
    if (params.cusip) query = query.eq('cusip', params.cusip)
    if (params.accountType) query = query.eq('account_type', params.accountType)
    if (params.voteStatus) query = query.eq('vote_status', params.voteStatus)

    // Apply ordering if provided (e.g., "shares.desc" or "name.asc")
    let orderedQuery = query
    if (params.order) {
      const [column, direction] = params.order.split('.')
      orderedQuery = orderedQuery.order(column, { ascending: direction !== 'desc' })
    } else {
      orderedQuery = orderedQuery.order('shares', { ascending: false })
    }

    const { data, error } = await orderedQuery.range(offset, offset + limit - 1)

    if (error)
      return {
        data: undefined,
        error: { message: error.message, statusCode: 500 },
      }

    // Convert snake_case to camelCase
    const convertedData = (data || []).map(item => ({
      ...item,
      meetingId: item.meeting_id,
      voteStatus: item.vote_status,
      accountType: item.account_type,
      setKey: item.set_key,
      accountNumber: item.account_number,
      sharesVoted: item.shares_voted,
      dateVoted: item.date_voted
    }))

    return { data: convertedData, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch positions',
        statusCode: 500,
      },
    }
  }
}

export async function createPosition(body: any): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()
    const { data, error } = await supabase
      .from('position')
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
        message: error instanceof Error ? error.message : 'Failed to create position',
        statusCode: 500,
      },
    }
  }
}
