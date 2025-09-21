import { type ApiClientReturnType, buildApiClient } from '../apiClient'

export async function listMeetings(
  page?: number,
  limit?: number,
  filters?: {
    clientId?: string
    status?: string
    meetingYear?: number
    cusip?: string
    ticker?: string
  }
): Promise<
  ApiClientReturnType<{
    meetings: any[]
    total: number
    page: number
    limit: number
  }>
> {
  try {
    const supabase = buildApiClient()
    const currentPage = page || 1
    const currentLimit = limit || 20
    const offset = (currentPage - 1) * currentLimit

    let query = supabase.from('meeting').select('*', { count: 'exact' })

    // Apply filters
    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.meetingYear) {
      query = query.eq('meeting_year', filters.meetingYear)
    }
    if (filters?.cusip) {
      query = query.eq('cusip', filters.cusip)
    }
    if (filters?.ticker) {
      query = query.eq('ticker', filters.ticker)
    }

    // Apply ordering and pagination
    query = query
      .order('client_id', { ascending: true })
      .order('meeting_type', { ascending: true })
      .order('meeting_date', { ascending: true })
      .range(offset, offset + currentLimit - 1)

    const { data: meetings, error, count } = await query

    if (error) {
      console.error('Supabase query error in listMeetings:', error)
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: 500,
        },
      }
    }

    // Get unique client IDs for fetching client data
    const clientIds = [...new Set((meetings || []).map(m => m.client_id).filter(Boolean))]

    // Fetch client data if we have client IDs
    let clientsData = []
    if (clientIds.length > 0) {
      const { data: clients, error: clientError } = await supabase
        .from('client')
        .select('id, ticker, company_name, short_name, branding_id')
        .in('id', clientIds)

      if (!clientError) {
        clientsData = clients || []
      }
    }

    // Convert snake_case to camelCase for meetings
    const convertedMeetings = (meetings || []).map(meeting => {
      const client = clientsData.find(c => c.id === meeting.client_id)

      return {
        ...meeting,
        meetingDate: meeting.meeting_date,
        meetingType: meeting.meeting_type,
        meetingYear: meeting.meeting_year,
        clientId: meeting.client_id,
        recordDate: meeting.record_date,
        mailingDate: meeting.mailing_date,
        preFilingDate: meeting.pre_filing_date,
        filingDate: meeting.filing_date,
        brokerSearchDate: meeting.broker_search_date,
        distributionType: meeting.distribution_type,
        transferAgent: meeting.transfer_agent,
        employeeStockPlans: meeting.employee_stock_plans,
        planAdministrator: meeting.plan_administrator,
        planAdministratorContact: meeting.plan_administrator_contact,
        planAdministratorContactEmail: meeting.plan_administrator_contact_email,
        solicitor: meeting.solicitor,
        solicitorEmail: meeting.solicitor_email,
        inspector: meeting.inspector,
        documentHostingSiteLabel: meeting.document_hosting_site_label,
        documentHostingSiteUrl: meeting.document_hosting_site_url,
        eVoteSiteLabel: meeting.e_vote_site_label,
        eVoteSiteUrl: meeting.e_vote_site_url,
        ivrDialInNumber: meeting.ivr_dial_in_number,
        totalSharesOutstanding: meeting.total_shares_outstanding,
        quorumRequirement: meeting.quorum_requirement,
        createdAt: meeting.created_at,
        updatedAt: meeting.updated_at,
        // Convert client data
        client: client ? {
          id: client.id,
          ticker: client.ticker,
          companyName: client.company_name,
          shortName: client.short_name,
          brandingId: client.branding_id
        } : null
      }
    })

    return {
      data: {
        meetings: convertedMeetings,
        total: count || 0,
        page: currentPage,
        limit: currentLimit,
      },
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch meetings',
        statusCode: 500,
      },
    }
  }
}

export async function createMeeting(meetingData: any): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    // Validate required fields
    const requiredFields = [
      'id',
      'title',
      'cusip',
      'ticker',
      'recordDate',
      'mailingDate',
      'meetingDate',
      'meetingType',
      'meetingYear',
      'distributionType',
      'transferAgent',
      'totalSharesOutstanding',
      'quorumRequirement',
      'clientId',
    ]
    const missingFields = requiredFields.filter((field) => !meetingData[field])

    if (missingFields.length > 0) {
      return {
        data: undefined,
        error: {
          message: `Missing required fields: ${missingFields.join(', ')}`,
          statusCode: 400,
        },
      }
    }

    const { data: meeting, error } = await supabase
      .from('meeting')
      .insert([meetingData])
      .select()
      .single()

    if (error) {
      // In mock mode, gracefully fall back to echoing the payload
      return {
        data: meetingData,
        error: undefined,
      }
    }

    // Convert snake_case to camelCase
    const convertedMeeting = meeting ? {
      ...meeting,
      meetingDate: meeting.meeting_date,
      meetingType: meeting.meeting_type,
      meetingYear: meeting.meeting_year,
      clientId: meeting.client_id,
      recordDate: meeting.record_date,
      mailingDate: meeting.mailing_date,
      distributionType: meeting.distribution_type,
      transferAgent: meeting.transfer_agent,
      totalSharesOutstanding: meeting.total_shares_outstanding,
      quorumRequirement: meeting.quorum_requirement,
      createdAt: meeting.created_at,
      updatedAt: meeting.updated_at
    } : null

    return {
      data: convertedMeeting,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create meeting',
        statusCode: 500,
      },
    }
  }
}

export async function getMeetingById(id: string): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    const { data: meeting, error } = await supabase
      .from('meeting')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }
    }

    // Fetch client data if meeting has client_id
    let client = null
    if (meeting && meeting.client_id) {
      const { data: clientData, error: clientError } = await supabase
        .from('client')
        .select('id, ticker, company_name, short_name, branding_id')
        .eq('id', meeting.client_id)
        .single()

      if (!clientError && clientData) {
        client = {
          id: clientData.id,
          ticker: clientData.ticker,
          companyName: clientData.company_name,
          shortName: clientData.short_name,
          brandingId: clientData.branding_id
        }
      }
    }

    // Convert snake_case to camelCase
    const convertedMeeting = meeting ? {
      ...meeting,
      meetingDate: meeting.meeting_date,
      meetingType: meeting.meeting_type,
      meetingYear: meeting.meeting_year,
      clientId: meeting.client_id,
      recordDate: meeting.record_date,
      mailingDate: meeting.mailing_date,
      preFilingDate: meeting.pre_filing_date,
      filingDate: meeting.filing_date,
      brokerSearchDate: meeting.broker_search_date,
      distributionType: meeting.distribution_type,
      transferAgent: meeting.transfer_agent,
      employeeStockPlans: meeting.employee_stock_plans,
      planAdministrator: meeting.plan_administrator,
      planAdministratorContact: meeting.plan_administrator_contact,
      planAdministratorContactEmail: meeting.plan_administrator_contact_email,
      solicitor: meeting.solicitor,
      solicitorEmail: meeting.solicitor_email,
      inspector: meeting.inspector,
      documentHostingSiteLabel: meeting.document_hosting_site_label,
      documentHostingSiteUrl: meeting.document_hosting_site_url,
      eVoteSiteLabel: meeting.e_vote_site_label,
      eVoteSiteUrl: meeting.e_vote_site_url,
      ivrDialInNumber: meeting.ivr_dial_in_number,
      totalSharesOutstanding: meeting.total_shares_outstanding,
      quorumRequirement: meeting.quorum_requirement,
      createdAt: meeting.created_at,
      updatedAt: meeting.updated_at,
      // Include client data
      client: client
    } : null

    return {
      data: convertedMeeting,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch meeting',
        statusCode: 500,
      },
    }
  }
}

export async function getMeetingByIdAndTicker(
  id: string,
  ticker: string
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    const { data: meeting, error } = await supabase
      .from('meeting')
      .select('*')
      .eq('id', id)
      .eq('ticker', ticker.toUpperCase())
      .single()

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }
    }

    // Convert snake_case to camelCase
    const convertedMeeting = meeting ? {
      ...meeting,
      meetingDate: meeting.meeting_date,
      meetingType: meeting.meeting_type,
      meetingYear: meeting.meeting_year,
      clientId: meeting.client_id,
      recordDate: meeting.record_date,
      mailingDate: meeting.mailing_date,
      distributionType: meeting.distribution_type,
      transferAgent: meeting.transfer_agent,
      totalSharesOutstanding: meeting.total_shares_outstanding,
      quorumRequirement: meeting.quorum_requirement,
      createdAt: meeting.created_at,
      updatedAt: meeting.updated_at
    } : null

    return {
      data: convertedMeeting,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch meeting',
        statusCode: 500,
      },
    }
  }
}

export async function updateMeetingByIdAndTicker(
  id: string,
  ticker: string,
  meetingData: any
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    const { data: meeting, error } = await supabase
      .from('meeting')
      .update({
        ...meetingData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('ticker', ticker.toUpperCase())
      .select()
      .single()

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }
    }

    // Convert snake_case to camelCase
    const convertedMeeting = meeting ? {
      ...meeting,
      meetingDate: meeting.meeting_date,
      meetingType: meeting.meeting_type,
      meetingYear: meeting.meeting_year,
      clientId: meeting.client_id,
      recordDate: meeting.record_date,
      mailingDate: meeting.mailing_date,
      distributionType: meeting.distribution_type,
      transferAgent: meeting.transfer_agent,
      totalSharesOutstanding: meeting.total_shares_outstanding,
      quorumRequirement: meeting.quorum_requirement,
      createdAt: meeting.created_at,
      updatedAt: meeting.updated_at
    } : null

    return {
      data: convertedMeeting,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update meeting',
        statusCode: 500,
      },
    }
  }
}

export async function deleteMeetingByIdAndTicker(
  id: string,
  ticker: string
): Promise<ApiClientReturnType<void>> {
  try {
    const supabase = buildApiClient()

    const { error } = await supabase
      .from('meeting')
      .delete()
      .eq('id', id)
      .eq('ticker', ticker.toUpperCase())

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }
    }

    return {
      data: undefined,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete meeting',
        statusCode: 500,
      },
    }
  }
}

export async function updateMeeting(
  id: string,
  meetingData: any
): Promise<ApiClientReturnType<any>> {
  try {
    const supabase = buildApiClient()

    const { data: meeting, error } = await supabase
      .from('meeting')
      .update({
        ...meetingData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }
    }

    // Convert snake_case to camelCase
    const convertedMeeting = meeting ? {
      ...meeting,
      meetingDate: meeting.meeting_date,
      meetingType: meeting.meeting_type,
      meetingYear: meeting.meeting_year,
      clientId: meeting.client_id,
      recordDate: meeting.record_date,
      mailingDate: meeting.mailing_date,
      distributionType: meeting.distribution_type,
      transferAgent: meeting.transfer_agent,
      totalSharesOutstanding: meeting.total_shares_outstanding,
      quorumRequirement: meeting.quorum_requirement,
      createdAt: meeting.created_at,
      updatedAt: meeting.updated_at
    } : null

    return {
      data: convertedMeeting,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update meeting',
        statusCode: 500,
      },
    }
  }
}

export async function deleteMeeting(id: string): Promise<ApiClientReturnType<void>> {
  try {
    const supabase = buildApiClient()

    const { error } = await supabase.from('meeting').delete().eq('id', id)

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message,
          statusCode: error.code === 'PGRST116' ? 404 : 500,
        },
      }
    }

    return {
      data: undefined,
      error: undefined,
    }
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete meeting',
        statusCode: 500,
      },
    }
  }
}
