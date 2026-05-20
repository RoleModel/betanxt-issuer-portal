import type { components } from '@/types/api'
import { syncTabulationReportTotalShares } from '@/domain-models/api/tabulationReports'
import { supabase } from '@/utils/supabase/client'
import type { Database } from '@/utils/supabase/database.types'

// Use generated types from OpenAPI schema
type Meeting = components['schemas']['Meeting']
type CreateMeetingRequest = components['schemas']['CreateMeetingRequest']
type UpdateMeetingRequest = components['schemas']['UpdateMeetingRequest']
type Phase = components['schemas']['Phase']

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

type MeetingRow = Database['public']['Tables']['meeting']['Row'] & {
  cutoff_date?: string | null
}
type ClientRow = Database['public']['Tables']['clients']['Row']
type MeetingRowWithRelations = Omit<MeetingRow, 'client'> & {
  client?: ClientRow | Meeting['client'] | string | null
}

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

// Transform raw Supabase client row (snake_case) to the camelCase OpenAPI shape.
// The `clients` secondary query returns snake_case keys; this ensures the API
// response always matches the `Clients` schema regardless of how the data arrived.
function transformClientSummary(raw: unknown): Meeting['client'] {
  if (typeof raw !== 'object' || raw === null) return undefined
  const c = raw as Record<string, unknown>
  const isActive = c.isActive ?? c.is_active

  return {
    id: typeof c.id === 'string' ? c.id : undefined,
    ticker: typeof c.ticker === 'string' ? c.ticker : undefined,
    companyName:
      typeof c.companyName === 'string'
        ? c.companyName
        : typeof c.company_name === 'string'
          ? c.company_name
          : undefined,
    shortName:
      typeof c.shortName === 'string'
        ? c.shortName
        : typeof c.short_name === 'string'
          ? c.short_name
          : undefined,
    industry: typeof c.industry === 'string' ? c.industry : null,
    description: typeof c.description === 'string' ? c.description : null,
    website: typeof c.website === 'string' ? c.website : null,
    primaryContact:
      typeof c.primaryContact === 'string'
        ? c.primaryContact
        : typeof c.primary_contact === 'string'
          ? c.primary_contact
          : null,
    primaryContactEmail:
      typeof c.primaryContactEmail === 'string'
        ? c.primaryContactEmail
        : typeof c.primary_contact_email === 'string'
          ? c.primary_contact_email
          : null,
    isActive: typeof isActive === 'boolean' ? isActive : true,
    brandingId:
      typeof c.brandingId === 'number'
        ? c.brandingId
        : typeof c.branding_id === 'number'
          ? c.branding_id
          : null,
    createdAt: typeof c.createdAt === 'string' ? c.createdAt : undefined,
    updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : undefined,
  }
}

// Transform snake_case database fields to camelCase API fields
function transformMeeting(dbMeeting: MeetingRowWithRelations): Meeting {
  return {
    id: nullToUndefined(dbMeeting.id),
    title: nullToUndefined(dbMeeting.title),
    cusip: nullToUndefined(dbMeeting.cusip),
    ticker: nullToUndefined(dbMeeting.ticker),
    preFilingDate: nullToUndefined(dbMeeting.pre_filing_date),
    filingDate: nullToUndefined(dbMeeting.filing_date),
    brokerSearchDate: nullToUndefined(dbMeeting.broker_search_date),
    recordDate: nullToUndefined(dbMeeting.record_date),
    mailingDate: nullToUndefined(dbMeeting.mailing_date),
    meetingDate: nullToUndefined(dbMeeting.meeting_date),
    cutoffDate: nullToUndefined(dbMeeting.cutoff_date),
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
    transferAgentConfirmed: dbMeeting.transfer_agent_confirmed,
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
    brokerNonVote: nullToUndefined(dbMeeting.broker_non_vote),
    mailingStatus: nullToUndefined(dbMeeting.mailing_status),
    clientId: nullToUndefined(dbMeeting.client_id),
    createdAt: nullToUndefined(dbMeeting.created_at),
    updatedAt: nullToUndefined(dbMeeting.updated_at),
    client: transformClientSummary(dbMeeting.client),
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
    let query = supabase.from('meeting').select('*', { count: 'exact' })

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

    const { data, error, count } = await query

    if (error) {
      return {
        error: { message: error.message ?? 'Failed to fetch meetings' },
      }
    }

    const rows = data ?? []

    // Fetch client data for all unique client_ids and attach manually.
    // A direct FK join is not available because the schema has no FK constraints.
    const uniqueClientIds = [
      ...new Set(
        rows
          .map((row) => row.client_id)
          .filter((clientId): clientId is string => typeof clientId === 'string')
      ),
    ]
    const clientMap = new Map<string, ClientRow>()

    if (uniqueClientIds.length > 0) {
      const { data: clientsData } = await supabase
        .from('clients')
        .select(
          'id, ticker, company_name, short_name, industry, description, website, primary_contact, primary_contact_email, is_active, branding_id, created_at, updated_at'
        )
        .in('id', uniqueClientIds)

      for (const c of clientsData ?? []) {
        if (c.id) {
          clientMap.set(c.id, c)
        }
      }
    }

    const meetings = rows.map((row) => {
      const client = row.client_id ? clientMap.get(row.client_id) : undefined
      return transformMeeting({ ...row, client: client ?? null })
    })

    return {
      data: {
        meetings,
        pagination: {
          page: page || 1,
          limit: limit || meetings.length,
          // Use the exact count from Supabase so pagination loops fetch all pages correctly
          total: count ?? meetings.length,
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
        error: { message: error.message ?? 'Failed to create meeting', statusCode: 400 },
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
        error: { message: error.message ?? 'Failed to fetch meeting' },
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
    // Transform camelCase to snake_case for database
    const dbUpdate: Record<string, unknown> = {}
    if (meetingData.title !== undefined) dbUpdate.title = meetingData.title
    if (meetingData.cusip !== undefined) dbUpdate.cusip = meetingData.cusip
    if (meetingData.brokerSearchDate !== undefined)
      dbUpdate.broker_search_date = meetingData.brokerSearchDate
    if (meetingData.recordDate !== undefined)
      dbUpdate.record_date = meetingData.recordDate
    if (meetingData.mailingDate !== undefined)
      dbUpdate.mailing_date = meetingData.mailingDate
    if (meetingData.meetingDate !== undefined)
      dbUpdate.meeting_date = meetingData.meetingDate
    if (meetingData.cutoffDate !== undefined)
      dbUpdate.cutoff_date = meetingData.cutoffDate
    if (meetingData.meetingType !== undefined)
      dbUpdate.meeting_type = meetingData.meetingType
    if (meetingData.status !== undefined) dbUpdate.status = meetingData.status
    if (meetingData.currentPhase !== undefined)
      dbUpdate.current_phase = meetingData.currentPhase
    if (meetingData.overallCompletion !== undefined)
      dbUpdate.overall_completion = meetingData.overallCompletion
    if (meetingData.distributionType !== undefined)
      dbUpdate.distribution_type = meetingData.distributionType
    if (meetingData.transferAgent !== undefined)
      dbUpdate.transfer_agent = meetingData.transferAgent
    if (meetingData.employeeStockPlans !== undefined)
      dbUpdate.employee_stock_plans = meetingData.employeeStockPlans
    if (meetingData.planAdministrator !== undefined)
      dbUpdate.plan_administrator = meetingData.planAdministrator
    if (meetingData.planAdministratorContact !== undefined)
      dbUpdate.plan_administrator_contact = meetingData.planAdministratorContact
    if (meetingData.planAdministratorContactEmail !== undefined)
      dbUpdate.plan_administrator_contact_email =
        meetingData.planAdministratorContactEmail
    if (meetingData.solicitor !== undefined) dbUpdate.solicitor = meetingData.solicitor
    if (meetingData.solicitorEmail !== undefined)
      dbUpdate.solicitor_email = meetingData.solicitorEmail
    if (meetingData.ivrDialInNumber !== undefined)
      dbUpdate.ivr_dial_in_number = meetingData.ivrDialInNumber
    if (meetingData.totalSharesOutstanding !== undefined)
      dbUpdate.total_shares_outstanding = meetingData.totalSharesOutstanding
    if (meetingData.quorumRequirement !== undefined)
      dbUpdate.quorum_requirement = meetingData.quorumRequirement
    if (meetingData.brokerNonVote !== undefined)
      dbUpdate.broker_non_vote = meetingData.brokerNonVote
    if (meetingData.mailingStatus !== undefined)
      dbUpdate.mailing_status = meetingData.mailingStatus

    const { data, error } = await supabase
      .from('meeting')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message ?? 'Failed to update meeting' },
      }
    }

    const updated = transformMeeting(data as MeetingRowWithRelations)

    // Keep the tabulation report's total-share counts in sync when the CSM
    // edits totalSharesOutstanding so the dashboard reflects it immediately.
    if (
      meetingData.totalSharesOutstanding !== undefined &&
      meetingData.totalSharesOutstanding !== null
    ) {
      await syncTabulationReportTotalShares(id, Number(meetingData.totalSharesOutstanding))
    }

    return { data: updated }
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
        error: { message: error.message ?? 'Failed to delete meeting' },
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
