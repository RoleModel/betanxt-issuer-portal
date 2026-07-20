"use client";

import useSWR, { type Fetcher } from "swr";

import buildApiClient from "@/domain-models/apiClient";
import { asRecord, asString } from "@/utils/typeUtils";

interface BrokerVotingData {
  broker: string;
  for: number;
  against: number;
  abstain: number;
  total: number;
}

type BrokerVotingByProposal = Record<string, BrokerVotingData[]>;

interface ShareRangeData {
  range: string;
  positions: number;
  shares: number;
  percentVoted: number;
}

interface VoteStatusData {
  category: string;
  shareholders: number;
  shares: number;
  percentage: number;
}

interface VoteDistributionData {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface PositionsVotedData {
  registered: {
    voted: number;
    notVoted: number;
  };
  beneficial: {
    voted: number;
    notVoted: number;
  };
}

interface ReportsData {
  brokerVotingByProposal: BrokerVotingByProposal;
  shareRangePerformance: ShareRangeData[];
  nonDtcVoteStatus: VoteStatusData[];
  dtcVoteStatus: VoteStatusData[];
  voteDistribution: VoteDistributionData[];
  positionsVoted: PositionsVotedData;
  setKeys: string[];
  loading: boolean;
}

type ReportsKey = ["reports", string];

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const fetchReports: Fetcher<ReportsData, ReportsKey> = async ([
  _key,
  meetingId,
]: ReportsKey) => {
  const apiClient = await buildApiClient();

  const { data, error } = await apiClient.GET(
    "/meetings/{meetingId}/tabulation-report",
    {
      params: {
        path: { meetingId },
      },
    }
  );

  if (error || !data) {
    throw new Error("Failed to load tabulation report");
  }

  const report = asRecord(data) ?? {};

  const brokerVotingByProposal = _transformBrokerVoting(report.brokerVoting);
  const shareRangePerformance = _transformShareRangePerformance(
    report.shareRangePerformance
  );
  const nonDtcVoteStatus = _transformNonDtcVoteStatus(report.nonDtcVoteStatus);
  const dtcVoteStatus = _transformDtcVoteStatus(report.dtcVoteStatus);
  const voteDistribution = _transformVoteDistribution(report.voteDistribution);
  const positionsVoted = _transformPositionsVoted(report.positionsVoted);
  const setKeys = Array.isArray(report.setKeys)
    ? report.setKeys.map((key) => String(key))
    : [];

  return {
    brokerVotingByProposal,
    shareRangePerformance,
    nonDtcVoteStatus,
    dtcVoteStatus,
    voteDistribution,
    positionsVoted,
    setKeys,
    loading: false,
  };
};

function _transformBrokerVoting(brokerVoting: unknown): BrokerVotingByProposal {
  if (Array.isArray(brokerVoting)) {
    // Legacy flat array: expose under "proposal1" so BrokerVotingChart's
    // proposal<N> key mapping can still render it against older API builds.
    const normalized = _normalizeBrokerVotingEntries(brokerVoting);
    return normalized.length > 0 ? { proposal1: normalized } : {};
  }

  if (!brokerVoting || typeof brokerVoting !== "object") {
    return {};
  }

  const result: BrokerVotingByProposal = {};
  const rawData = asRecord(brokerVoting);
  if (!rawData) {
    return result;
  }

  Object.entries(rawData).forEach(([proposalId, brokers]) => {
    if (!Array.isArray(brokers)) return;

    const normalized = _normalizeBrokerVotingEntries(brokers);

    if (normalized.length > 0) {
      result[proposalId] = normalized;
    }
  });

  return result;
}

function _normalizeBrokerVotingEntries(entries: unknown[]): BrokerVotingData[] {
  return entries.reduce<BrokerVotingData[]>((acc, entry) => {
    const brokerRecord = asRecord(entry);
    if (!brokerRecord) return acc;

    const forVotes = toFiniteNumber(brokerRecord.sharesFor ?? brokerRecord.for);
    const againstVotes = toFiniteNumber(
      brokerRecord.sharesAgainst ?? brokerRecord.against
    );
    const abstainVotes = toFiniteNumber(
      brokerRecord.sharesAbstain ?? brokerRecord.abstain
    );

    // Ensure broker is always a string to prevent chart rendering errors
    const brokerName = asString(brokerRecord.broker);
    acc.push({
      broker: brokerName ?? "Unknown",
      for: forVotes,
      against: againstVotes,
      abstain: abstainVotes,
      total: forVotes + againstVotes + abstainVotes,
    });

    return acc;
  }, []);
}

function _transformShareRangePerformance(
  shareRangePerformance: unknown
): ShareRangeData[] {
  if (!Array.isArray(shareRangePerformance)) {
    return [];
  }

  return shareRangePerformance.reduce<ShareRangeData[]>((acc, item) => {
    const range = asRecord(item);
    if (!range) return acc;

    acc.push({
      range: asString(range.rangeLabel) ?? "",
      positions: toFiniteNumber(range.positionCount),
      shares: toFiniteNumber(range.totalShares),
      percentVoted: toFiniteNumber(range.percentVoted),
    });

    return acc;
  }, []);
}

function _transformNonDtcVoteStatus(
  nonDtcVoteStatus: unknown
): VoteStatusData[] {
  if (!nonDtcVoteStatus || typeof nonDtcVoteStatus !== "object") {
    return [];
  }

  const data = asRecord(nonDtcVoteStatus);
  if (!data) {
    return [];
  }

  const totalShares = toFiniteNumber(data.grandTotalShares);

  return [
    {
      category: "Not Voted",
      shareholders: toFiniteNumber(data.unvotedShareholders),
      shares: toFiniteNumber(data.unvotedShares),
      percentage:
        totalShares > 0
          ? (toFiniteNumber(data.unvotedShares) / totalShares) * 100
          : 0,
    },
    {
      category: "PRINT",
      shareholders: toFiniteNumber(data.printShareholders),
      shares: toFiniteNumber(data.printShares),
      percentage:
        totalShares > 0
          ? (toFiniteNumber(data.printShares) / totalShares) * 100
          : 0,
    },
    {
      category: "IVR",
      shareholders: toFiniteNumber(data.ivrShareholders),
      shares: toFiniteNumber(data.ivrShares),
      percentage:
        totalShares > 0
          ? (toFiniteNumber(data.ivrShares) / totalShares) * 100
          : 0,
    },
    {
      category: "WEB",
      shareholders: toFiniteNumber(data.webShareholders),
      shares: toFiniteNumber(data.webShares),
      percentage:
        totalShares > 0
          ? (toFiniteNumber(data.webShares) / totalShares) * 100
          : 0,
    },
    {
      category: "Voted Sub-Total",
      shareholders: toFiniteNumber(data.votedSubtotalShareholders),
      shares: toFiniteNumber(data.votedSubtotalShares),
      percentage:
        totalShares > 0
          ? (toFiniteNumber(data.votedSubtotalShares) / totalShares) * 100
          : 0,
    },
    {
      category: "Grand Total",
      shareholders: toFiniteNumber(data.grandTotalShareholders),
      shares: totalShares,
      percentage: 100,
    },
  ];
}

function _transformDtcVoteStatus(dtcVoteStatus: unknown): VoteStatusData[] {
  if (!dtcVoteStatus || typeof dtcVoteStatus !== "object") {
    return [];
  }

  const data = asRecord(dtcVoteStatus);
  if (!data) {
    return [];
  }

  const totalShares = toFiniteNumber(data.grandTotalShares);

  return [
    {
      category: "Not Voted",
      shareholders: toFiniteNumber(data.unvotedShareholders),
      shares: toFiniteNumber(data.unvotedShares),
      percentage:
        totalShares > 0
          ? (toFiniteNumber(data.unvotedShares) / totalShares) * 100
          : 0,
    },
    {
      category: "Voted",
      shareholders: toFiniteNumber(data.votedShareholders),
      shares: toFiniteNumber(data.votedShares),
      percentage:
        totalShares > 0
          ? (toFiniteNumber(data.votedShares) / totalShares) * 100
          : 0,
    },
    {
      category: "Grand Total",
      shareholders: toFiniteNumber(data.grandTotalShareholders),
      shares: totalShares,
      percentage: 100,
    },
  ];
}

function _transformVoteDistribution(
  voteDistribution: unknown
): VoteDistributionData[] {
  if (!voteDistribution || typeof voteDistribution !== "object") {
    return [];
  }

  const data = asRecord(voteDistribution);
  if (!data) {
    return [];
  }

  const colors = [
    "var(--mui-palette-chartSeries-1-main)",
    "var(--mui-palette-chartSeries-2-main)",
    "var(--mui-palette-chartSeries-3-main)",
    "var(--mui-palette-chartSeries-4-main)",
  ];

  return [
    {
      id: "dtc-voted",
      label: "DTC/CDS Voted",
      value: toFiniteNumber(data.dtcVotedShares),
      color: colors[0],
    },
    {
      id: "dtc-unvoted",
      label: "DTC/CDS Not Voted",
      value: toFiniteNumber(data.dtcUnvotedShares),
      color: colors[1],
    },
    {
      id: "non-dtc-voted",
      label: "Non-DTC Voted",
      value: toFiniteNumber(data.nonDtcVotedShares),
      color: colors[2],
    },
    {
      id: "non-dtc-unvoted",
      label: "Non-DTC Not Voted",
      value: toFiniteNumber(data.nonDtcUnvotedShares),
      color: colors[3],
    },
  ].filter((item) => item.value > 0);
}

function _transformPositionsVoted(positionsVoted: unknown): PositionsVotedData {
  if (!positionsVoted || typeof positionsVoted !== "object") {
    return {
      registered: { voted: 0, notVoted: 0 },
      beneficial: { voted: 0, notVoted: 0 },
    };
  }

  const data = asRecord(positionsVoted);
  if (!data) {
    return {
      registered: { voted: 0, notVoted: 0 },
      beneficial: { voted: 0, notVoted: 0 },
    };
  }

  // Handle actual API structure: {voted, unvoted, totalShares, votedShares}
  if (data.voted !== undefined && data.unvoted !== undefined) {
    const votedPositions = Math.round(toFiniteNumber(data.voted));
    const unvotedPositions = Math.round(toFiniteNumber(data.unvoted));

    // For now, assume all positions are treated as beneficial
    // until we have DTC/Non-DTC breakdown data
    return {
      registered: { voted: 0, notVoted: 0 },
      beneficial: {
        voted: votedPositions,
        notVoted: unvotedPositions,
      },
    };
  }

  // Original structure with dtc/non-dtc breakdown (legacy)
  return {
    registered: {
      voted: Math.round(toFiniteNumber(data.dtcVotedShares)),
      notVoted: Math.round(toFiniteNumber(data.dtcUnvotedShares)),
    },
    beneficial: {
      voted: Math.round(toFiniteNumber(data.nonDtcVotedShares)),
      notVoted: Math.round(toFiniteNumber(data.nonDtcUnvotedShares)),
    },
  };
}

export function useReports(meetingId?: string) {
  const { data, error, isLoading, isValidating } = useSWR<
    ReportsData,
    Error,
    ReportsKey | null
  >(meetingId ? ["reports", meetingId] : null, fetchReports, {
    dedupingInterval: 30_000,
    revalidateOnFocus: false,
    keepPreviousData: false, // Changed to false to prevent stale data issues
  });

  return {
    brokerVotingByProposal: data?.brokerVotingByProposal || {},
    shareRangePerformance: data?.shareRangePerformance || [],
    nonDtcVoteStatus: data?.nonDtcVoteStatus || [],
    dtcVoteStatus: data?.dtcVoteStatus || [],
    voteDistribution: data?.voteDistribution || [],
    positionsVoted: data?.positionsVoted || {
      registered: { voted: 0, notVoted: 0 },
      beneficial: { voted: 0, notVoted: 0 },
    },
    setKeys: data?.setKeys || [],
    loading: isLoading || isValidating,
    error,
  };
}
