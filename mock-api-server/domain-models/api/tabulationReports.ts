import { supabase } from '@/utils/supabase/client'

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

// Manual type definition for tabulation_report based on database schema
interface TabulationReportRow {
  id: string
  meeting_id: string
  set_keys: string[]
  broker_voting: unknown // JSONB
  share_range_performance: unknown // JSONB
  non_dtc_vote_status: unknown // JSONB
  dtc_vote_status: unknown // JSONB
  vote_distribution: unknown // JSONB
  positions_voted: unknown // JSONB
  last_calculated_at: string
  created_at: string
  updated_at: string
}

// Transformed API response type
export interface TabulationReport {
  id: string
  meetingId: string
  setKeys: string[]
  brokerVoting: Record<
    string,
    {
      broker: string
      for: number
      against: number
      abstain: number
    }[]
  >
  shareRangePerformance: {
    rangeLabel: string
    positionCount: number
    totalShares: number
    percentVoted: number
  }[]
  nonDtcVoteStatus: {
    unvotedShareholders: number
    unvotedShares: number
    printShareholders: number
    printShares: number
    ivrShareholders: number
    ivrShares: number
    webShareholders: number
    webShares: number
    votedSubtotalShareholders: number
    votedSubtotalShares: number
    grandTotalShareholders: number
    grandTotalShares: number
  }
  dtcVoteStatus: {
    unvotedShareholders: number
    unvotedShares: number
    votedShareholders: number
    votedShares: number
    grandTotalShareholders: number
    grandTotalShares: number
  }
  voteDistribution: {
    dtcVotedShares: number
    dtcUnvotedShares: number
    nonDtcVotedShares: number
    nonDtcUnvotedShares: number
  }
  positionsVoted: {
    voted: number
    unvoted: number
    totalShares: number
    votedShares: number
  }
  lastCalculatedAt: string
  createdAt: string
  updatedAt: string
}

// Helper to parse JSONB string fields (Supabase returns some JSONB as strings)
function parseJsonField<T>(field: unknown, fallback: T): T {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T
    } catch {
      return fallback
    }
  }
  if (field && typeof field === 'object') {
    return field as T
  }
  return fallback
}

// Transform snake_case database fields to camelCase API fields
function transformTabulationReport(dbReport: TabulationReportRow): TabulationReport {
  const positionsVoted = parseJsonField(dbReport.positions_voted, {
    voted: 0,
    unvoted: 0,
    totalShares: 0,
    votedShares: 0,
  })

  return {
    id: dbReport.id,
    meetingId: dbReport.meeting_id,
    setKeys: dbReport.set_keys || [],
    brokerVoting: parseJsonField<
      Record<
        string,
        {
          broker: string
          for: number
          against: number
          abstain: number
        }[]
      >
    >(dbReport.broker_voting, {}),
    shareRangePerformance: parseJsonField<
      {
        rangeLabel: string
        positionCount: number
        totalShares: number
        percentVoted: number
      }[]
    >(dbReport.share_range_performance, []),
    nonDtcVoteStatus: parseJsonField(dbReport.non_dtc_vote_status, {
      unvotedShareholders: 0,
      unvotedShares: 0,
      printShareholders: 0,
      printShares: 0,
      ivrShareholders: 0,
      ivrShares: 0,
      webShareholders: 0,
      webShares: 0,
      votedSubtotalShareholders: 0,
      votedSubtotalShares: 0,
      grandTotalShareholders: 0,
      grandTotalShares: 0,
    }),
    dtcVoteStatus: parseJsonField(dbReport.dtc_vote_status, {
      unvotedShareholders: 0,
      unvotedShares: 0,
      votedShareholders: 0,
      votedShares: 0,
      grandTotalShareholders: 0,
      grandTotalShares: 0,
    }),
    voteDistribution: parseJsonField(dbReport.vote_distribution, {
      dtcVotedShares: 0,
      dtcUnvotedShares: 0,
      nonDtcVotedShares: 0,
      nonDtcUnvotedShares: 0,
    }),
    positionsVoted: {
      voted: positionsVoted.voted ?? 0,
      unvoted: positionsVoted.unvoted ?? 0,
      totalShares: parseFloat(String(positionsVoted.totalShares)) || 0,
      votedShares: parseFloat(String(positionsVoted.votedShares)) || 0,
    },
    lastCalculatedAt: dbReport.last_calculated_at,
    createdAt: dbReport.created_at,
    updatedAt: dbReport.updated_at,
  }
}

export async function getTabulationReport(
  meetingId: string
): Promise<ApiResponse<TabulationReport>> {
  try {
    const { data, error } = await supabase
      .from('tabulation_report')
      .select('*')
      .eq('meeting_id', meetingId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return {
          error: {
            message: `No tabulation report found for meeting ${meetingId}`,
            statusCode: 404,
          },
        }
      }
      return {
        error: {
          message: error.message ?? 'Failed to fetch tabulation report',
          statusCode: 500,
        },
      }
    }

    return {
      data: transformTabulationReport(data as TabulationReportRow),
    }
  } catch (error) {
    return {
      error: {
        message:
          error instanceof Error ? error.message : 'Failed to fetch tabulation report',
        statusCode: 500,
      },
    }
  }
}
