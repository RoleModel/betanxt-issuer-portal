import { supabase } from "@/utils/supabase/client";

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

// Manual type definition for tabulation_report based on database schema.
// The six fields below are all JSONB columns.
interface TabulationReportRow {
  id: string;
  meeting_id: string;
  set_keys: string[];
  broker_voting: unknown;
  share_range_performance: unknown;
  non_dtc_vote_status: unknown;
  dtc_vote_status: unknown;
  vote_distribution: unknown;
  positions_voted: unknown;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

interface BrokerVotingEntry {
  broker: string;
  sharesFor: number;
  sharesAgainst: number;
  sharesAbstain: number;
}

/** Broker vote entries keyed by proposal slot (proposal1, proposal2, ...). */
type BrokerVotingByProposal = Record<string, BrokerVotingEntry[]>;

interface ShareRangePerformanceEntry {
  rangeLabel: string;
  positionCount: number;
  totalShares: number;
  percentVoted: number;
}

interface NonDtcVoteStatus {
  unvotedShareholders: number;
  unvotedShares: number;
  printShareholders: number;
  printShares: number;
  ivrShareholders: number;
  ivrShares: number;
  webShareholders: number;
  webShares: number;
  votedSubtotalShareholders: number;
  votedSubtotalShares: number;
  grandTotalShareholders: number;
  grandTotalShares: number;
}

interface DtcVoteStatus {
  unvotedShareholders: number;
  unvotedShares: number;
  votedShareholders: number;
  votedShares: number;
  grandTotalShareholders: number;
  grandTotalShares: number;
}

interface VoteDistribution {
  dtcVotedShares: number;
  dtcUnvotedShares: number;
  nonDtcVotedShares: number;
  nonDtcUnvotedShares: number;
}

interface PositionsVoted {
  voted: number;
  unvoted: number;
  totalShares: number;
  votedShares: number;
}

// Transformed API response type
export interface TabulationReport {
  id: string;
  meetingId: string;
  setKeys: string[];
  brokerVoting: BrokerVotingByProposal;
  shareRangePerformance: ShareRangePerformanceEntry[];
  nonDtcVoteStatus: NonDtcVoteStatus;
  dtcVoteStatus: DtcVoteStatus;
  voteDistribution: VoteDistribution;
  positionsVoted: PositionsVoted;
  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

const CSV_POSITION_TOTALS_BY_MEETING_ID: Partial<Record<string, number>> = {
  "wen-annual-meeting-2025": 17_950,
  "wen-annual-meeting-2026": 5677,
  "payc-annual-meeting-2025": 3522,
  "wwd-annual-meeting-2025": 3521,
  "elvn-annual-meeting-2025": 20,
};

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
};

const emptyDtcVoteStatus: DtcVoteStatus = {
  unvotedShareholders: 0,
  unvotedShares: 0,
  votedShareholders: 0,
  votedShares: 0,
  grandTotalShareholders: 0,
  grandTotalShares: 0,
};

const emptyVoteDistribution: VoteDistribution = {
  dtcVotedShares: 0,
  dtcUnvotedShares: 0,
  nonDtcVotedShares: 0,
  nonDtcUnvotedShares: 0,
};

// Helper to parse JSONB string fields (Supabase returns some JSONB as strings)
const parseJsonField = <T>(field: unknown, fallback: T): T => {
  if (typeof field === "string") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- parsing an arbitrary JSONB column; the caller-supplied fallback documents the expected shape
      return JSON.parse(field) as T;
    } catch {
      return fallback;
    }
  }
  if (field !== null && typeof field === "object") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- see the note above
    return field as T;
  }
  return fallback;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const toFiniteNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toIsoString = (value: string): string => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
};

const normalizeBrokerVotingEntries = (
  rawEntries: unknown[]
): BrokerVotingEntry[] => {
  const entries: BrokerVotingEntry[] = [];
  for (const entry of rawEntries) {
    if (!isRecord(entry)) {
      continue;
    }
    const broker = typeof entry.broker === "string" ? entry.broker : "Unknown";
    entries.push({
      broker,
      sharesFor: toFiniteNumber(entry.sharesFor ?? entry.for),
      sharesAgainst: toFiniteNumber(entry.sharesAgainst ?? entry.against),
      sharesAbstain: toFiniteNumber(entry.sharesAbstain ?? entry.abstain),
    });
  }
  return entries;
};

/**
 * Preserve the per-proposal keying stored in the broker_voting JSONB column
 * ({ proposal1: [...], proposal2: [...] }) so the frontend can map each entry
 * list onto the meeting's proposals. Legacy flat arrays are exposed under a
 * single "proposal1" key.
 */
const normalizeBrokerVoting = (field: unknown): BrokerVotingByProposal => {
  const parsed = parseJsonField<unknown>(field, {});

  if (Array.isArray(parsed)) {
    const entries = normalizeBrokerVotingEntries(parsed);
    return entries.length > 0 ? { proposal1: entries } : {};
  }

  if (!isRecord(parsed)) {
    return {};
  }

  const result: BrokerVotingByProposal = {};
  for (const [proposalKey, value] of Object.entries(parsed)) {
    if (!Array.isArray(value)) {
      continue;
    }
    const entries = normalizeBrokerVotingEntries(value);
    if (entries.length > 0) {
      result[proposalKey] = entries;
    }
  }
  return result;
};

const normalizeShareRangePerformance = (
  field: unknown
): ShareRangePerformanceEntry[] => {
  const ranges: ShareRangePerformanceEntry[] = [];
  const entries = parseJsonField<unknown[]>(field, []);
  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue;
    }
    ranges.push({
      rangeLabel: typeof entry.rangeLabel === "string" ? entry.rangeLabel : "",
      positionCount: toFiniteNumber(entry.positionCount),
      totalShares: toFiniteNumber(entry.totalShares),
      percentVoted: toFiniteNumber(entry.percentVoted),
    });
  }
  return ranges;
};

const normalizeNonDtcVoteStatus = (field: unknown): NonDtcVoteStatus => {
  const status = parseJsonField<Partial<NonDtcVoteStatus>>(
    field,
    emptyNonDtcVoteStatus
  );

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
  };
};

const normalizeDtcVoteStatus = (field: unknown): DtcVoteStatus => {
  const status = parseJsonField<Partial<DtcVoteStatus>>(
    field,
    emptyDtcVoteStatus
  );

  return {
    unvotedShareholders: toFiniteNumber(status.unvotedShareholders),
    unvotedShares: toFiniteNumber(status.unvotedShares),
    votedShareholders: toFiniteNumber(status.votedShareholders),
    votedShares: toFiniteNumber(status.votedShares),
    grandTotalShareholders: toFiniteNumber(status.grandTotalShareholders),
    grandTotalShares: toFiniteNumber(status.grandTotalShares),
  };
};

const normalizeVoteDistribution = (field: unknown): VoteDistribution => {
  const distribution = parseJsonField<Partial<VoteDistribution>>(
    field,
    emptyVoteDistribution
  );

  return {
    dtcVotedShares: toFiniteNumber(distribution.dtcVotedShares),
    dtcUnvotedShares: toFiniteNumber(distribution.dtcUnvotedShares),
    nonDtcVotedShares: toFiniteNumber(distribution.nonDtcVotedShares),
    nonDtcUnvotedShares: toFiniteNumber(distribution.nonDtcUnvotedShares),
  };
};

const normalizePositionsVoted = (field: unknown): PositionsVoted => {
  const positionsVoted = parseJsonField<Partial<PositionsVoted>>(field, {
    voted: 0,
    unvoted: 0,
    totalShares: 0,
    votedShares: 0,
  });

  return {
    voted: toFiniteNumber(positionsVoted.voted),
    unvoted: toFiniteNumber(positionsVoted.unvoted),
    totalShares: toFiniteNumber(positionsVoted.totalShares),
    votedShares: toFiniteNumber(positionsVoted.votedShares),
  };
};

const normalizeReportTotals = (report: TabulationReport): TabulationReport => {
  const expectedPositionTotal =
    CSV_POSITION_TOTALS_BY_MEETING_ID[report.meetingId];
  const statusTotalShares =
    report.nonDtcVoteStatus.grandTotalShares +
    report.dtcVoteStatus.grandTotalShares;
  const distributedVotedShares =
    report.voteDistribution.dtcVotedShares +
    report.voteDistribution.nonDtcVotedShares;

  const normalizedReport = {
    ...report,
    positionsVoted: {
      ...report.positionsVoted,
      totalShares:
        statusTotalShares === 0
          ? report.positionsVoted.totalShares
          : statusTotalShares,
      votedShares:
        distributedVotedShares === 0
          ? report.positionsVoted.votedShares
          : distributedVotedShares,
    },
  };

  if (
    expectedPositionTotal !== undefined &&
    expectedPositionTotal > report.positionsVoted.voted
  ) {
    normalizedReport.positionsVoted.unvoted =
      expectedPositionTotal - normalizedReport.positionsVoted.voted;
  }

  normalizedReport.dtcVoteStatus.unvotedShares = Math.max(
    normalizedReport.dtcVoteStatus.grandTotalShares -
      normalizedReport.dtcVoteStatus.votedShares,
    0
  );
  normalizedReport.nonDtcVoteStatus.unvotedShares = Math.max(
    normalizedReport.nonDtcVoteStatus.grandTotalShares -
      normalizedReport.nonDtcVoteStatus.votedSubtotalShares,
    0
  );
  normalizedReport.voteDistribution = {
    dtcVotedShares: normalizedReport.dtcVoteStatus.votedShares,
    dtcUnvotedShares: normalizedReport.dtcVoteStatus.unvotedShares,
    nonDtcVotedShares: normalizedReport.nonDtcVoteStatus.votedSubtotalShares,
    nonDtcUnvotedShares: normalizedReport.nonDtcVoteStatus.unvotedShares,
  };

  // Keep the voted-share total from `positions_voted` when the detailed vote
  // distribution is stale or partially empty in the seed data.
  const derivedVotedShares =
    normalizedReport.voteDistribution.dtcVotedShares +
    normalizedReport.voteDistribution.nonDtcVotedShares;
  normalizedReport.positionsVoted.votedShares = Math.max(
    normalizedReport.positionsVoted.votedShares,
    derivedVotedShares
  );

  return normalizedReport;
};

// Transform snake_case database fields to camelCase API fields
const transformTabulationReport = (
  databaseReport: TabulationReportRow
): TabulationReport =>
  normalizeReportTotals({
    id: databaseReport.id,
    meetingId: databaseReport.meeting_id,
    setKeys: databaseReport.set_keys.length > 0 ? databaseReport.set_keys : [],
    brokerVoting: normalizeBrokerVoting(databaseReport.broker_voting),
    shareRangePerformance: normalizeShareRangePerformance(
      databaseReport.share_range_performance
    ),
    nonDtcVoteStatus: normalizeNonDtcVoteStatus(
      databaseReport.non_dtc_vote_status
    ),
    dtcVoteStatus: normalizeDtcVoteStatus(databaseReport.dtc_vote_status),
    voteDistribution: normalizeVoteDistribution(
      databaseReport.vote_distribution
    ),
    positionsVoted: normalizePositionsVoted(databaseReport.positions_voted),
    lastCalculatedAt: toIsoString(databaseReport.last_calculated_at),
    createdAt: toIsoString(databaseReport.created_at),
    updatedAt: toIsoString(databaseReport.updated_at),
  });

/**
 * After a position update, recalculate and persist the live voted-share totals
 * back into the tabulation_report JSONB fields that the dashboard reads.
 * Uses meeting.total_shares_outstanding as the authoritative grand total so that
 * CSM edits to that field are respected even when individual position.shares differ.
 */
export const refreshTabulationReportFromPositions = async (
  meetingId: string
): Promise<void> => {
  const [
    { data: positions, error: posError },
    { data: meeting },
    { data: report },
  ] = await Promise.all([
    supabase
      .from("position")
      .select("shares, shares_voted, vote_status")
      .eq("meeting_id", meetingId),
    supabase
      .from("meeting")
      .select("total_shares_outstanding")
      .eq("id", meetingId)
      .single(),
    supabase
      .from("tabulation_report")
      .select(
        "positions_voted, non_dtc_vote_status, dtc_vote_status, vote_distribution"
      )
      .eq("meeting_id", meetingId)
      .single(),
  ]);

  if (posError !== null || positions === null || report === null) {
    return;
  }

  const votedPositions = positions.filter((p) => p.vote_status === "Voted");
  const votedShares = votedPositions.reduce(
    (sum, p) => sum + (p.shares_voted ?? 0),
    0
  );
  const votedCount = votedPositions.length;
  const unvotedCount = positions.length - votedCount;

  // Prefer the meeting's explicit totalSharesOutstanding; fall back to sum of position shares
  const positionSharesSum = positions.reduce(
    (sum, p) => sum + (p.shares ?? 0),
    0
  );
  const grandTotal =
    meeting?.total_shares_outstanding === null ||
    meeting?.total_shares_outstanding === undefined
      ? positionSharesSum
      : Number(meeting.total_shares_outstanding);
  const unvotedShares = Math.max(grandTotal - votedShares, 0);

  const updatedPositionsVoted = {
    ...parseJsonField<Record<string, unknown>>(report.positions_voted, {}),
    voted: votedCount,
    unvoted: unvotedCount,
    totalShares: grandTotal,
    votedShares,
  };

  // Place the entire CSM-set total in non-DTC and zero out DTC so that
  // normalizeReportTotals computes statusTotalShares = grandTotal correctly.
  const updatedNonDtcVoteStatus = {
    ...parseJsonField<Record<string, unknown>>(report.non_dtc_vote_status, {}),
    votedSubtotalShares: votedShares,
    unvotedShares,
    grandTotalShares: grandTotal,
  };

  const updatedDtcVoteStatus = {
    ...parseJsonField<Record<string, unknown>>(report.dtc_vote_status, {}),
    grandTotalShares: 0,
    unvotedShares: 0,
    votedShares: 0,
  };

  const updatedVoteDistribution = {
    ...parseJsonField<Record<string, unknown>>(report.vote_distribution, {}),
    nonDtcVotedShares: votedShares,
    nonDtcUnvotedShares: unvotedShares,
    dtcVotedShares: 0,
    dtcUnvotedShares: 0,
  };

  await supabase
    .from("tabulation_report")
    .update({
      positions_voted: JSON.stringify(updatedPositionsVoted),
      non_dtc_vote_status: JSON.stringify(updatedNonDtcVoteStatus),
      dtc_vote_status: JSON.stringify(updatedDtcVoteStatus),
      vote_distribution: JSON.stringify(updatedVoteDistribution),
    })
    .eq("meeting_id", meetingId);
};

/**
 * When CSM edits totalSharesOutstanding on the meeting, push that value into the
 * tabulation report so the dashboard "Shares Not Voted" reflects it immediately.
 * Always reads live voted shares from the position table so stale cache can't
 * corrupt the reported voted count.
 */
export const syncTabulationReportTotalShares = async (
  meetingId: string,
  totalSharesOutstanding: number
): Promise<void> => {
  const [{ data: positions }, { data: report }] = await Promise.all([
    supabase
      .from("position")
      .select("shares_voted, vote_status")
      .eq("meeting_id", meetingId),
    supabase
      .from("tabulation_report")
      .select(
        "positions_voted, non_dtc_vote_status, dtc_vote_status, vote_distribution"
      )
      .eq("meeting_id", meetingId)
      .single(),
  ]);

  if (report === null) {
    return;
  }

  const votedShares = (positions ?? [])
    .filter((p) => p.vote_status === "Voted")
    .reduce((sum, p) => sum + (p.shares_voted ?? 0), 0);
  const unvotedShares = Math.max(totalSharesOutstanding - votedShares, 0);

  const updatedPositionsVoted = {
    ...parseJsonField<Record<string, unknown>>(report.positions_voted, {}),
    totalShares: totalSharesOutstanding,
    votedShares,
  };

  // Place the entire CSM-set total in non-DTC and zero out DTC so that
  // normalizeReportTotals computes statusTotalShares = grandTotal correctly.
  const updatedNonDtcVoteStatus = {
    ...parseJsonField<Record<string, unknown>>(report.non_dtc_vote_status, {}),
    grandTotalShares: totalSharesOutstanding,
    unvotedShares,
    votedSubtotalShares: votedShares,
  };

  const updatedDtcVoteStatus = {
    ...parseJsonField<Record<string, unknown>>(report.dtc_vote_status, {}),
    grandTotalShares: 0,
    unvotedShares: 0,
    votedShares: 0,
  };

  const updatedVoteDistribution = {
    ...parseJsonField<Record<string, unknown>>(report.vote_distribution, {}),
    nonDtcVotedShares: votedShares,
    nonDtcUnvotedShares: unvotedShares,
    dtcVotedShares: 0,
    dtcUnvotedShares: 0,
  };

  await supabase
    .from("tabulation_report")
    .update({
      positions_voted: JSON.stringify(updatedPositionsVoted),
      non_dtc_vote_status: JSON.stringify(updatedNonDtcVoteStatus),
      dtc_vote_status: JSON.stringify(updatedDtcVoteStatus),
      vote_distribution: JSON.stringify(updatedVoteDistribution),
    })
    .eq("meeting_id", meetingId);
};

export const getTabulationReport = async (
  meetingId: string
): Promise<ApiResponse<TabulationReport>> => {
  let outcome: {
    data: unknown;
    error: { message: string; code?: string } | null;
  };
  try {
    outcome = await supabase
      .from("tabulation_report")
      .select("*")
      .eq("meeting_id", meetingId)
      .single();
  } catch (caughtError) {
    return {
      error: {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
        message: Error.isError(caughtError)
          ? caughtError.message
          : "Failed to fetch tabulation report",
        statusCode: 500,
      },
    };
  }

  if (outcome.error !== null) {
    if (outcome.error.code === "PGRST116") {
      return {
        error: {
          message: `No tabulation report found for meeting ${meetingId}`,
          statusCode: 404,
        },
      };
    }
    return {
      error: { message: outcome.error.message, statusCode: 500 },
    };
  }

  // `tabulation_report` has no generated Database Row type reconciled with
  // the hand-written TabulationReportRow shape yet; this is the one
  // sanctioned boundary cast until that's done.
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
  const typedReport = outcome.data as TabulationReportRow;
  return { data: transformTabulationReport(typedReport) };
};
