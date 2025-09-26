import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'

// Use generated types from OpenAPI schema
type Meeting = components['schemas']['Meeting']
type CreateMeetingRequest = components['schemas']['CreateMeetingRequest']
type UpdateMeetingRequest = components['schemas']['UpdateMeetingRequest']

// Helper type for backend responses
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

// Transform snake_case database fields to camelCase API fields
function transformMeeting(dbMeeting: any): Meeting {
  return {
    id: dbMeeting.id,
    title: dbMeeting.title,
    cusip: dbMeeting.cusip,
    ticker: dbMeeting.ticker,
    preFilingDate: dbMeeting.pre_filing_date,
    filingDate: dbMeeting.filing_date,
    brokerSearchDate: dbMeeting.broker_search_date,
    recordDate: dbMeeting.record_date,
    mailingDate: dbMeeting.mailing_date,
    meetingDate: dbMeeting.meeting_date,
    meetingType: dbMeeting.meeting_type,
    meetingYear: dbMeeting.meeting_year,
    status: dbMeeting.status,
    currentPhase: dbMeeting.current_phase,
    overallCompletion: dbMeeting.overall_completion,
    distributionType: dbMeeting.distribution_type,
    transferAgent: dbMeeting.transfer_agent,
    employeeStockPlans: dbMeeting.employee_stock_plans,
    planAdministrator: dbMeeting.plan_administrator,
    planAdministratorContact: dbMeeting.plan_administrator_contact,
    planAdministratorContactEmail: dbMeeting.plan_administrator_contact_email,
    solicitor: dbMeeting.solicitor,
    solicitorEmail: dbMeeting.solicitor_email,
    inspector: dbMeeting.inspector,
    ivrDialInNumber: dbMeeting.ivr_dial_in_number,
    totalSharesOutstanding: dbMeeting.total_shares_outstanding,
    quorumRequirement: dbMeeting.quorum_requirement,
    clientId: dbMeeting.client_id,
    createdAt: dbMeeting.created_at,
    updatedAt: dbMeeting.updated_at,
    client: dbMeeting.client,
  }
}

export async function listMeetings(
  page?: number,
  limit?: number,
  filters?: {
    clientId?: string
    status?: components['schemas']['MeetingStatus']
    meetingYear?: number
    cusip?: string
    ticker?: string
  }
): Promise<
  ApiResponse<{ meetings?: Meeting[]; pagination?: components['schemas']['Pagination'] }>
> {
  try {
    let query = supabase.from('meeting').select('*')

    // Apply filters
    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.ticker) {
      query = query.eq('ticker', filters.ticker)
    }
    if (filters?.cusip) {
      query = query.eq('cusip', filters.cusip)
    }
    if (filters?.meetingYear) {
      const startDate = `${filters.meetingYear}-01-01`
      const endDate = `${filters.meetingYear}-12-31`
      query = query.gte('meeting_date', startDate).lte('meeting_date', endDate)
    }

    // Apply pagination
    if (page && limit) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)
    }

    const { data, error } = await query

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch meetings' },
      }
    }

    return {
      data: {
        meetings: data.map(transformMeeting),
        pagination: {
          page: page || 1,
          limit: limit || data.length,
          total: data.length,
        },
      },
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch meetings',
      },
    }
  }
}

export async function createMeeting(meetingData: unknown): Promise<ApiResponse<Meeting>> {
  try {
    const { data, error } = await supabase
      .from('meeting')
      .insert(meetingData as CreateMeetingRequest)
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to create meeting' },
      }
    }

    return {
      data: transformMeeting(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to create meeting',
      },
    }
  }
}

export async function getMeetingById(id: string): Promise<ApiResponse<Meeting>> {
  try {
    const { data, error } = await supabase
      .from('meeting')
      .select(
        `
        *,
        client:client_id (*)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch meeting' },
      }
    }

    return {
      data: transformMeeting(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch meeting',
      },
    }
  }
}

// Legacy functions for backwards compatibility - should be updated to use proper OpenAPI endpoints
export async function getMeetingByIdAndTicker(
  id: string,
  ticker: string
): Promise<ApiResponse<Meeting>> {
  // Use the standard getMeetingById and filter by ticker in the application layer
  return getMeetingById(id)
}

export async function updateMeetingByIdAndTicker(
  id: string,
  ticker: string,
  meetingData: UpdateMeetingRequest
): Promise<ApiResponse<Meeting>> {
  // Use the standard updateMeeting - ticker validation should be handled in API layer
  return updateMeeting(id, meetingData)
}

export async function deleteMeetingByIdAndTicker(
  id: string,
  ticker: string
): Promise<ApiResponse<void>> {
  // Use the standard deleteMeeting - ticker validation should be handled in API layer
  return deleteMeeting(id)
}

// Helper function for backward compatibility - delegates to phases API
export async function getMeetingPhases(meetingId: string): Promise<ApiResponse<any[]>> {
  // Import here to avoid circular dependency
  const { listPhases } = await import('./phases')
  return listPhases(meetingId)
}

export async function updateMeeting(
  id: string,
  meetingData: unknown
): Promise<ApiResponse<Meeting>> {
  try {
    const { data, error } = await supabase
      .from('meeting')
      .update(meetingData as UpdateMeetingRequest)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to update meeting' },
      }
    }

    return {
      data: transformMeeting(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to update meeting',
      },
    }
  }
}

export async function deleteMeeting(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase.from('meeting').delete().eq('id', id)

    if (error) {
      return {
        error: { message: error.message || 'Failed to delete meeting' },
      }
    }

    return {
      data: undefined,
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete meeting',
      },
    }
  }
}
