import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'
import type { Database } from '@/utils/supabase/database.types'

// Use generated types from OpenAPI schema
type Meeting = components['schemas']['Meeting']
type CreateMeetingRequest = components['schemas']['CreateMeetingRequest']
type UpdateMeetingRequest = components['schemas']['UpdateMeetingRequest']
type Phase = components['schemas']['Phase']

// Helper type for backend responses
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

type MeetingRow = Database['public']['Tables']['meeting']['Row']
type MeetingRowWithRelations = Omit<MeetingRow, 'client'> & {
  client?: MeetingRow['client'] | Meeting['client']
}

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

// Transform snake_case database fields to camelCase API fields
function transformMeeting(dbMeeting: MeetingRowWithRelations): Meeting {
  return {
    id: dbMeeting.id,
    title: nullToUndefined(dbMeeting.title),
    cusip: nullToUndefined(dbMeeting.cusip),
    ticker: nullToUndefined(dbMeeting.ticker),
    preFilingDate: nullToUndefined(dbMeeting.pre_filing_date),
    filingDate: nullToUndefined(dbMeeting.filing_date),
    brokerSearchDate: nullToUndefined(dbMeeting.broker_search_date),
    recordDate: nullToUndefined(dbMeeting.record_date),
    mailingDate: nullToUndefined(dbMeeting.mailing_date),
    meetingDate: nullToUndefined(dbMeeting.meeting_date),
    meetingType: nullToUndefined(dbMeeting.meeting_type),
    meetingYear: nullToUndefined(dbMeeting.meeting_year),
    status: nullToUndefined(dbMeeting.status) as
      | 'ACTIVE'
      | 'COMPLETE'
      | 'ADJOURNED'
      | undefined,
    currentPhase: nullToUndefined(dbMeeting.current_phase),
    overallCompletion: nullToUndefined(dbMeeting.overall_completion),
    distributionType: nullToUndefined(dbMeeting.distribution_type),
    transferAgent: nullToUndefined(dbMeeting.transfer_agent),
    employeeStockPlans: nullToUndefined(dbMeeting.employee_stock_plans),
    planAdministrator: nullToUndefined(dbMeeting.plan_administrator),
    planAdministratorContact: nullToUndefined(dbMeeting.plan_administrator_contact),
    planAdministratorContactEmail: nullToUndefined(
      dbMeeting.plan_administrator_contact_email
    ),
    solicitor: nullToUndefined(dbMeeting.solicitor),
    solicitorEmail: nullToUndefined(dbMeeting.solicitor_email),
    inspector: nullToUndefined(dbMeeting.inspector),
    ivrDialInNumber: nullToUndefined(dbMeeting.ivr_dial_in_number),
    totalSharesOutstanding: nullToUndefined(dbMeeting.total_shares_outstanding),
    quorumRequirement: nullToUndefined(dbMeeting.quorum_requirement),
    clientId: nullToUndefined(dbMeeting.client_id),
    createdAt: nullToUndefined(dbMeeting.created_at),
    updatedAt: nullToUndefined(dbMeeting.updated_at),
    client:
      typeof dbMeeting.client === 'object' && dbMeeting.client !== null
        ? (dbMeeting.client as Meeting['client'])
        : undefined,
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

    const meetings = (data ?? []).map(transformMeeting)
    return {
      data: {
        meetings,
        pagination: {
          page: page || 1,
          limit: limit || meetings.length,
          total: meetings.length,
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

export async function createMeeting(
  meetingData: CreateMeetingRequest
): Promise<ApiResponse<Meeting>> {
  try {
    // Basic validation for required fields
    if (!meetingData.id || !meetingData.clientId || !meetingData.meetingType) {
      return {
        error: {
          message: 'Missing required fields: id, clientId, and meetingType are required',
          statusCode: 400,
        },
      }
    }

    const { data, error } = await supabase
      .from('meeting')
      .insert(meetingData)
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to create meeting', statusCode: 400 },
      }
    }

    return {
      data: transformMeeting(data as MeetingRowWithRelations),
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
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      // Check if it's a not found error
      if (error.code === 'PGRST116') {
        return {
          error: { message: 'Meeting not found', statusCode: 404 },
        }
      }
      return {
        error: { message: error.message || 'Failed to fetch meeting' },
      }
    }

    if (!data) {
      return {
        error: { message: 'Meeting not found', statusCode: 404 },
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
  _ticker: string
): Promise<ApiResponse<Meeting>> {
  // Use the standard getMeetingById and filter by ticker in the application layer
  return getMeetingById(id)
}

export async function updateMeetingByIdAndTicker(
  id: string,
  _ticker: string,
  meetingData: UpdateMeetingRequest
): Promise<ApiResponse<Meeting>> {
  // Use the standard updateMeeting - ticker validation should be handled in API layer
  return updateMeeting(id, meetingData)
}

export async function deleteMeetingByIdAndTicker(
  id: string,
  _ticker: string
): Promise<ApiResponse<void>> {
  // Use the standard deleteMeeting - ticker validation should be handled in API layer
  return deleteMeeting(id)
}

// Helper function for backward compatibility - delegates to phases API
export async function getMeetingPhases(meetingId: string): Promise<ApiResponse<Phase[]>> {
  // Import here to avoid circular dependency
  const { listPhases } = await import('./phases')
  return listPhases(meetingId)
}

export async function updateMeeting(
  id: string,
  meetingData: UpdateMeetingRequest
): Promise<ApiResponse<Meeting>> {
  try {
    const { data, error } = await supabase
      .from('meeting')
      .update(meetingData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to update meeting' },
      }
    }

    return {
      data: transformMeeting(data as MeetingRowWithRelations),
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
