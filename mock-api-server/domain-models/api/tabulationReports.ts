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

interface BrokerVotingEntry {
  broker: string
  sharesFor: number
  sharesAgainst: number
  sharesAbstain: number
}

interface ShareRangePerformanceEntry {
  rangeLabel: string
  positionCount: number
  totalShares: number
  percentVoted: number
}

interface NonDtcVoteStatus {
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

interface DtcVoteStatus {
  unvotedShareholders: number
  unvotedShares: number
  votedShareholders: number
  votedShares: number
  grandTotalShareholders: number
  grandTotalShares: number
}

interface VoteDistribution {
  dtcVotedShares: number
  dtcUnvotedShares: number
  nonDtcVotedShares: number
  nonDtcUnvotedShares: number
}

interface PositionsVoted {
  voted: number
  unvoted: number
  totalShares: number
  votedShares: number
}

// Transformed API response type
export interface TabulationReport {
  id: string
  meetingId: string
  setKeys: string[]
  brokerVoting: BrokerVotingEntry[]
  shareRangePerformance: ShareRangePerformanceEntry[]
  nonDtcVoteStatus: NonDtcVoteStatus
  dtcVoteStatus: DtcVoteStatus
  voteDistribution: VoteDistribution
  positionsVoted: PositionsVoted
  lastCalculatedAt: string
  createdAt: string
  updatedAt: string
}

const CSV_POSITION_TOTALS_BY_MEETING_ID: Record<string, number> = {
  'wen-annual-meeting-2025': 17950,
  'wen-annual-meeting-2026': 5677,
  'payc-annual-meeting-2025': 3522,
  'wwd-annual-meeting-2025': 3521,
  'elvn-annual-meeting-2025': 20,
}

const FUTURE_MEETING_IDS = new Set(['wen-annual-meeting-2026'])

const emptyNonDtcVoteStatus: NonDtcVoteStatus = {
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
}

const emptyDtcVoteStatus: DtcVoteStatus = {
  unvotedShareholders: 0,
  unvotedShares: 0,
  votedShareholders: 0,
  votedShares: 0,
  grandTotalShareholders: 0,
  grandTotalShares: 0,
}

const emptyVoteDistribution: VoteDistribution = {
  dtcVotedShares: 0,
  dtcUnvotedShares: 0,
  nonDtcVotedShares: 0,
  nonDtcUnvotedShares: 0,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function toFiniteNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toIsoString(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
}

function normalizeBrokerVoting(field: unknown): BrokerVotingEntry[] {
  const parsed = parseJsonField<unknown>(field, [])
  const rawEntries = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed)
      ? Object.values(parsed).flatMap((value) => (Array.isArray(value) ? value : []))
      : []

  return rawEntries.reduce<BrokerVotingEntry[]>((entries, entry) => {
    if (!isRecord(entry)) {
      return entries
    }

    const broker = typeof entry.broker === 'string' ? entry.broker : 'Unknown'
    entries.push({
      broker,
      sharesFor: toFiniteNumber(entry.sharesFor ?? entry.for),
      sharesAgainst: toFiniteNumber(entry.sharesAgainst ?? entry.against),
      sharesAbstain: toFiniteNumber(entry.sharesAbstain ?? entry.abstain),
    })

    return entries
  }, [])
}

function normalizeShareRangePerformance(field: unknown): ShareRangePerformanceEntry[] {
  return parseJsonField<unknown[]>(field, []).reduce<ShareRangePerformanceEntry[]>(
    (ranges, entry) => {
      if (!isRecord(entry)) {
        return ranges
      }

      ranges.push({
        rangeLabel: typeof entry.rangeLabel === 'string' ? entry.rangeLabel : '',
        positionCount: toFiniteNumber(entry.positionCount),
        totalShares: toFiniteNumber(entry.totalShares),
        percentVoted: toFiniteNumber(entry.percentVoted),
      })

      return ranges
    },
    []
  )
}

function normalizeNonDtcVoteStatus(field: unknown): NonDtcVoteStatus {
  const status = parseJsonField<Partial<NonDtcVoteStatus>>(field, emptyNonDtcVoteStatus)

  return {
    unvotedShareholders: toFiniteNumber(status.unvotedShareholders),
    unvotedShares: toFiniteNumber(status.unvotedShares),
    printShareholders: toFiniteNumber(status.printShareholders),
    printShares: toFiniteNumber(status.printShares),
    ivrShareholders: toFiniteNumber(status.ivrShareholders),
    ivrShares: toFiniteNumber(status.ivrShares),
    webShareholders: toFiniteNumber(status.webShareholders),
    webShares: toFiniteNumber(status.webShares),
    votedSubtotalShareholders: toFiniteNumber(status.votedSubtotalShareholders),
    votedSubtotalShares: toFiniteNumber(status.votedSubtotalShares),
    grandTotalShareholders: toFiniteNumber(status.grandTotalShareholders),
    grandTotalShares: toFiniteNumber(status.grandTotalShares),
  }
}

function normalizeDtcVoteStatus(field: unknown): DtcVoteStatus {
  const status = parseJsonField<Partial<DtcVoteStatus>>(field, emptyDtcVoteStatus)

  return {
    unvotedShareholders: toFiniteNumber(status.unvotedShareholders),
    unvotedShares: toFiniteNumber(status.unvotedShares),
    votedShareholders: toFiniteNumber(status.votedShareholders),
    votedShares: toFiniteNumber(status.votedShares),
    grandTotalShareholders: toFiniteNumber(status.grandTotalShareholders),
    grandTotalShares: toFiniteNumber(status.grandTotalShares),
  }
}

function normalizeVoteDistribution(field: unknown): VoteDistribution {
  const distribution = parseJsonField<Partial<VoteDistribution>>(
    field,
    emptyVoteDistribution
  )

  return {
    dtcVotedShares: toFiniteNumber(distribution.dtcVotedShares),
    dtcUnvotedShares: toFiniteNumber(distribution.dtcUnvotedShares),
    nonDtcVotedShares: toFiniteNumber(distribution.nonDtcVotedShares),
    nonDtcUnvotedShares: toFiniteNumber(distribution.nonDtcUnvotedShares),
  }
}

function normalizePositionsVoted(field: unknown): PositionsVoted {
  const positionsVoted = parseJsonField<Partial<PositionsVoted>>(field, {
    voted: 0,
    unvoted: 0,
    totalShares: 0,
    votedShares: 0,
  })

  return {
    voted: toFiniteNumber(positionsVoted.voted),
    unvoted: toFiniteNumber(positionsVoted.unvoted),
    totalShares: toFiniteNumber(positionsVoted.totalShares),
    votedShares: toFiniteNumber(positionsVoted.votedShares),
  }
}

function normalizeReportTotals(report: TabulationReport): TabulationReport {
  const expectedPositionTotal = CSV_POSITION_TOTALS_BY_MEETING_ID[report.meetingId]
  const statusTotalShares =
    report.nonDtcVoteStatus.grandTotalShares + report.dtcVoteStatus.grandTotalShares

  const normalizedReport = {
    ...report,
    positionsVoted: {
      ...report.positionsVoted,
      totalShares: statusTotalShares || report.positionsVoted.totalShares,
      votedShares:
        report.voteDistribution.dtcVotedShares +
          report.voteDistribution.nonDtcVotedShares || report.positionsVoted.votedShares,
    },
  }

  if (expectedPositionTotal && expectedPositionTotal > report.positionsVoted.voted) {
    normalizedReport.positionsVoted.unvoted =
      expectedPositionTotal - normalizedReport.positionsVoted.voted
  }

  normalizedReport.dtcVoteStatus.unvotedShares = Math.max(
    normalizedReport.dtcVoteStatus.grandTotalShares -
      normalizedReport.dtcVoteStatus.votedShares,
    0
  )
  normalizedReport.nonDtcVoteStatus.unvotedShares = Math.max(
    normalizedReport.nonDtcVoteStatus.grandTotalShares -
      normalizedReport.nonDtcVoteStatus.votedSubtotalShares,
    0
  )
  normalizedReport.voteDistribution = {
    dtcVotedShares: normalizedReport.dtcVoteStatus.votedShares,
    dtcUnvotedShares: normalizedReport.dtcVoteStatus.unvotedShares,
    nonDtcVotedShares: normalizedReport.nonDtcVoteStatus.votedSubtotalShares,
    nonDtcUnvotedShares: normalizedReport.nonDtcVoteStatus.unvotedShares,
  }
  normalizedReport.positionsVoted.votedShares =
    normalizedReport.voteDistribution.dtcVotedShares +
    normalizedReport.voteDistribution.nonDtcVotedShares

  return normalizedReport
}

function zeroFutureMeetingVotes(report: TabulationReport): TabulationReport {
  if (!FUTURE_MEETING_IDS.has(report.meetingId)) {
    return report
  }

  const totalShares = report.positionsVoted.totalShares
  const positionTotal = CSV_POSITION_TOTALS_BY_MEETING_ID[report.meetingId] ?? 0

  return {
    ...report,
    nonDtcVoteStatus: {
      ...report.nonDtcVoteStatus,
      printShareholders: 0,
      printShares: 0,
      ivrShareholders: 0,
      ivrShares: 0,
      webShareholders: 0,
      webShares: 0,
      votedSubtotalShareholders: 0,
      votedSubtotalShares: 0,
      unvotedShareholders: report.nonDtcVoteStatus.grandTotalShareholders,
      unvotedShares: report.nonDtcVoteStatus.grandTotalShares,
    },
    dtcVoteStatus: {
      ...report.dtcVoteStatus,
      votedShareholders: 0,
      votedShares: 0,
      unvotedShareholders: report.dtcVoteStatus.grandTotalShareholders,
      unvotedShares: report.dtcVoteStatus.grandTotalShares,
    },
    voteDistribution: {
      dtcVotedShares: 0,
      dtcUnvotedShares: report.dtcVoteStatus.grandTotalShares,
      nonDtcVotedShares: 0,
      nonDtcUnvotedShares: report.nonDtcVoteStatus.grandTotalShares,
    },
    positionsVoted: {
      voted: 0,
      unvoted: positionTotal,
      totalShares,
      votedShares: 0,
    },
  }
}

// Transform snake_case database fields to camelCase API fields
function transformTabulationReport(dbReport: TabulationReportRow): TabulationReport {
  const report = normalizeReportTotals({
    id: dbReport.id,
    meetingId: dbReport.meeting_id,
    setKeys: dbReport.set_keys || [],
    brokerVoting: normalizeBrokerVoting(dbReport.broker_voting),
    shareRangePerformance: normalizeShareRangePerformance(
      dbReport.share_range_performance
    ),
    nonDtcVoteStatus: normalizeNonDtcVoteStatus(dbReport.non_dtc_vote_status),
    dtcVoteStatus: normalizeDtcVoteStatus(dbReport.dtc_vote_status),
    voteDistribution: normalizeVoteDistribution(dbReport.vote_distribution),
    positionsVoted: normalizePositionsVoted(dbReport.positions_voted),
    lastCalculatedAt: toIsoString(dbReport.last_calculated_at),
    createdAt: toIsoString(dbReport.created_at),
    updatedAt: toIsoString(dbReport.updated_at),
  })

  return zeroFutureMeetingVotes(report)
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
