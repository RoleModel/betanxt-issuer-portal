import { type ApiClientReturnType, buildApiClient } from '../apiClient'

export type KeyDate = { id: string; title: string; date: string | null; phaseNumber: number }

export async function listKeyDatesForMeeting(meetingId: string): Promise<ApiClientReturnType<KeyDate[]>> {
  try {
    const supabase = buildApiClient()

    // Fetch meeting for top-level dates
    const { data: meeting, error: meetingError } = await supabase
      .from('meeting')
      .select('*')
      .eq('id', meetingId)
      .single()

    if (meetingError) {
      return {
        data: undefined,
        error: { message: meetingError.message, statusCode: meetingError.code === 'PGRST116' ? 404 : 500 },
      }
    }

    // Fetch phases for phase-level key dates
    const { data: phases, error: phasesError } = await supabase
      .from('phase')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('order_index', { ascending: true })

    if (phasesError) {
      return {
        data: undefined,
        error: { message: phasesError.message, statusCode: 500 },
      }
    }

    const result: KeyDate[] = []

    // Include meeting-level dates as phaseNumber 0
    if (meeting.pre_filing_date) {
      result.push({ id: `${meeting.id}-prefiling`, title: 'Pre-Filing Date', date: meeting.pre_filing_date, phaseNumber: 0 })
    }
    if (meeting.filing_date) {
      result.push({ id: `${meeting.id}-filing`, title: 'Filing Date', date: meeting.filing_date, phaseNumber: 0 })
    }
    if (meeting.broker_search_date) {
      result.push({ id: `${meeting.id}-brokersearch`, title: 'Broker Search Date', date: meeting.broker_search_date, phaseNumber: 0 })
    }
    if (meeting.record_date) {
      result.push({ id: `${meeting.id}-record`, title: 'Record Date', date: meeting.record_date, phaseNumber: 0 })
    }
    if (meeting.mailing_date) {
      result.push({ id: `${meeting.id}-mailing`, title: 'Mailing Date', date: meeting.mailing_date, phaseNumber: 0 })
    }
    if (meeting.meeting_date) {
      result.push({ id: `${meeting.id}-meeting`, title: 'Meeting Date', date: meeting.meeting_date, phaseNumber: 0 })
    }

    // Phase-level key dates: expect JSONB key_dates with snake_case
    for (const phase of phases || []) {
      const pn = phase.order_index ?? 0
      const kd = phase.key_dates || {}
      if (kd.startDate || kd.start_date) {
        result.push({ id: `${phase.id}-start`, title: 'Start Date', date: kd.startDate || kd.start_date, phaseNumber: pn })
      }
      if (kd.endDate || kd.end_date) {
        result.push({ id: `${phase.id}-end`, title: 'End Date', date: kd.endDate || kd.end_date, phaseNumber: pn })
      }
      if (kd.dueDate || kd.due_date) {
        result.push({ id: `${phase.id}-due`, title: 'Due Date', date: kd.dueDate || kd.due_date, phaseNumber: pn })
      }
      if (kd.completionDate || kd.completion_date) {
        result.push({ id: `${phase.id}-completion`, title: 'Completion Date', date: kd.completionDate || kd.completion_date, phaseNumber: pn })
      }
    }

    // Filter out null dates
    const filtered = result.filter((d) => !!d.date)
    return { data: filtered, error: undefined }
  } catch (error) {
    return {
      data: undefined,
      error: { message: error instanceof Error ? error.message : 'Failed to fetch key dates', statusCode: 500 },
    }
  }
}


