"use client";

import useSWR from "swr";

import type { HolderCategory } from "@/utils/holderCategory";
import type { ProposalVoting, VotingSummary } from "@/types/phases";
import buildApiClient from "@/domain-models/apiClient";
import {
  isRegisteredOnlyHolder,
  normalizeHolderCategory,
} from "@/utils/holderCategory";
import { asArray, asRecord, asString } from "@/utils/typeUtils";

// Type for normalized position with guaranteed fields
export interface NormalizedPosition {
  id: string;
  voteStatus: string;
  shares: number;
  sharesVoted: number;
  votingSource?: string;
  accountType: string;
  /** Normalized holder category; null when the API record carried no recognizable value (legacy data). */
  holderCategory: HolderCategory | null;
}

/** Vote counts per voting channel (WEB / PRINT / IVR), restricted to REGISTERED holders. */
export interface RegisteredVotingMethods {
  web: number;
  paper: number;
  phone: number;
}

// Type for normalized proposal
export interface NormalizedProposal {
  id: string;
  proposalNumber: number;
  title: string;
  proposalType?: string;
  recommendation?: string;
  directorName?: string;
  totalVotesFor: number;
  totalVotesAgainst: number;
  totalVotesAbstain: number;
}

const positionVoteValues = {
  abstain: "ABSTAIN",
  against: "AGAINST",
  for: "FOR",
  withhold: "WITHHOLD",
} as const;

type PositionVote =
  (typeof positionVoteValues)[keyof typeof positionVoteValues];

interface NormalizedPositionVote {
  positionId: string;
  proposalId: string;
  vote: PositionVote;
}

interface ProposalVoteCounts {
  for: number;
  against: number;
  abstain: number;
  total: number;
}

const fetchPositionVotesForMeeting = async (
  meetingId: string
): Promise<unknown[]> => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
  const response = await fetch(
    `${baseUrl}/position_votes?meetingId=${encodeURIComponent(meetingId)}&limit=10000`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch position votes");
  }

  const data: unknown = await response.json();
  return asArray(data);
};

/**
 * Normalizes a raw position record (snake_case or camelCase) into a
 * {@link NormalizedPosition}, including the holderCategory used for the
 * registered-only Voting Activity breakdown.
 */
const normalizePosition = (position: unknown): NormalizedPosition | null => {
  if (!position) {
    return null;
  }

  const record = asRecord(position);
  if (!record) {
    return null;
  }

  return {
    id: asString(record.id) || "",
    voteStatus:
      asString(record.voteStatus) || asString(record.vote_status) || "unvoted",
    shares: Number(record.shares) || 0,
    sharesVoted: Number(record.sharesVoted) || Number(record.shares_voted) || 0,
    votingSource:
      asString(record.votingSource) ||
      asString(record.voting_source) ||
      asString(record.source) ||
      undefined,
    accountType:
      asString(record.accountType) || asString(record.account_type) || "",
    holderCategory: normalizeHolderCategory(
      record.holderCategory ?? record.holder_category
    ),
  };
};

// Normalize proposal data to ensure consistent fields
const normalizeProposal = (proposal: unknown): NormalizedProposal | null => {
  if (!proposal) {
    return null;
  }

  const record = asRecord(proposal);
  if (!record) {
    return null;
  }

  return {
    id: asString(record.id) || "",
    proposalNumber:
      Number(record.proposalNumber) || Number(record.proposal_number) || 0,
    title:
      asString(record.proposalTitle) ||
      asString(record.title) ||
      asString(record.proposal_title) ||
      "",
    proposalType:
      asString(record.proposalType) ||
      asString(record.proposal_type) ||
      undefined,
    recommendation: asString(record.recommendation) || undefined,
    directorName:
      asString(record.directorName) ||
      asString(record.director_name) ||
      undefined,
    totalVotesFor:
      Number(record.totalVotesFor) || Number(record.total_votes_for) || 0,
    totalVotesAgainst:
      Number(record.totalVotesAgainst) ||
      Number(record.total_votes_against) ||
      0,
    totalVotesAbstain:
      Number(record.totalVotesAbstain) ||
      Number(record.total_votes_abstain) ||
      0,
  };
};

const toPositionVote = (value: string): PositionVote | null => {
  switch (value) {
    case positionVoteValues.abstain: {
      return positionVoteValues.abstain;
    }
    case positionVoteValues.against: {
      return positionVoteValues.against;
    }
    case positionVoteValues.for: {
      return positionVoteValues.for;
    }
    case positionVoteValues.withhold: {
      return positionVoteValues.withhold;
    }
    default: {
      return null;
    }
  }
};

const normalizePositionVote = (
  positionVote: unknown
): NormalizedPositionVote | null => {
  if (!positionVote) {
    return null;
  }

  const record = asRecord(positionVote);
  if (!record) {
    return null;
  }

  const vote = toPositionVote((asString(record.vote) || "").toUpperCase());

  if (vote === null) {
    return null;
  }

  return {
    positionId:
      asString(record.positionId) || asString(record.position_id) || "",
    proposalId:
      asString(record.proposalId) || asString(record.proposal_id) || "",
    vote,
  };
};

export interface UseVotingTabulationResult {
  proposals: ProposalVoting[];
  votingSummary: VotingSummary | null;
  /** Voting-method counts for REGISTERED holders only (Voting Activity chart, FR-001/FR-002); null until data loads. */
  registeredVotingMethods: RegisteredVotingMethods | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  uploadProposals: (proposals: unknown[]) => Promise<void>;
  previousYearsPercentages: number[];
}

interface VotingTabulationData {
  readonly proposals: ProposalVoting[];
  readonly previousYearsPercentages: number[];
  readonly registeredVotingMethods: RegisteredVotingMethods;
  readonly votingSummary: VotingSummary;
}

const fetchVotingData = async (
  meetingId: string
): Promise<VotingTabulationData> => {
  const apiClient = await buildApiClient();
  const previousYearsPercentages: number[] = [];

  if (meetingId) {
    const idParts = meetingId.split("-");

    if (idParts.length >= 4) {
      const currentYear = Number(idParts.at(-1));
      const baseId = idParts.slice(0, -1).join("-");

      const yearOffsets = [1, 2, 3, 4, 5];
      const previousYearResults = await Promise.all(
        yearOffsets.map(async (yearOffset): Promise<number | null> => {
          const previousMeetingId = `${baseId}-${currentYear - yearOffset}`;
          const previousPositionsResult = await apiClient.GET("/positions", {
            params: { query: { meetingId: previousMeetingId } },
          });
          const previousPositionsRaw = Array.isArray(
            previousPositionsResult.data
          )
            ? previousPositionsResult.data
            : asArray(asRecord(previousPositionsResult.data)?.positions);
          const previousPositions = previousPositionsRaw
            .map((position) => normalizePosition(position))
            .filter(
              (position): position is NormalizedPosition => position !== null
            );
          const previousTotalShares = previousPositions.reduce(
            (sum, position) => sum + position.shares,
            0
          );
          const previousVotedShares = previousPositions
            .filter((position) => position.voteStatus === "Voted")
            .reduce((sum, position) => sum + position.sharesVoted, 0);
          const previousPercentage =
            previousTotalShares > 0
              ? (previousVotedShares / previousTotalShares) * 100
              : 0;

          if (previousTotalShares > 0) {
            return Number(previousPercentage.toFixed(2));
          }
          return null;
        })
      );

      for (const previousPercentage of previousYearResults) {
        if (previousPercentage !== null) {
          previousYearsPercentages.push(previousPercentage);
        }
      }

      previousYearsPercentages.reverse();
    }
  }

  // Fetch proposals and positions in parallel
  const [proposalsResult, positionsResult] = await Promise.all([
    apiClient.GET("/meetings/{meetingId}/proposals", {
      params: { path: { meetingId } },
    }),
    apiClient.GET("/positions", {
      params: { query: { meetingId, limit: 5000 } },
    }),
  ]);

  if (proposalsResult.error) {
    throw new Error("Failed to fetch proposals");
  }

  const proposalsRaw = Array.isArray(proposalsResult.data)
    ? proposalsResult.data
    : asArray(asRecord(proposalsResult.data)?.proposals);
  const proposals = proposalsRaw
    .map((proposal) => normalizeProposal(proposal))
    .filter((proposal): proposal is NormalizedProposal => proposal !== null);

  const positionsRaw = Array.isArray(positionsResult.data)
    ? positionsResult.data
    : asArray(asRecord(positionsResult.data)?.positions);
  const positions = positionsRaw
    .map((position) => normalizePosition(position))
    .filter((position): position is NormalizedPosition => position !== null);
  const proposalIds = new Set(proposals.map((proposal) => proposal.id));
  const positionIdSet = new Set(positions.map((position) => position.id));
  const positionVotesRaw =
    positionIdSet.size > 0 ? await fetchPositionVotesForMeeting(meetingId) : [];

  const proposalVoteCounts = new Map<string, ProposalVoteCounts>();
  const normalizedVotes = positionVotesRaw
    .map((positionVote) => normalizePositionVote(positionVote))
    .filter(
      (positionVote): positionVote is NormalizedPositionVote =>
        positionVote !== null
    );

  for (const vote of normalizedVotes) {
    if (
      !proposalIds.has(vote.proposalId) ||
      !positionIdSet.has(vote.positionId)
    ) {
      continue;
    }

    const currentCounts = proposalVoteCounts.get(vote.proposalId) ?? {
      for: 0,
      against: 0,
      abstain: 0,
      total: 0,
    };

    if (vote.vote === "FOR") {
      currentCounts.for += 1;
    } else if (vote.vote === "ABSTAIN") {
      currentCounts.abstain += 1;
    } else {
      currentCounts.against += 1;
    }

    currentCounts.total += 1;
    proposalVoteCounts.set(vote.proposalId, currentCounts);
  }

  // Calculate voting summary
  const totalPositions = positions.length;
  const positionsVoted = positions.filter(
    (p) => p.voteStatus === "Voted"
  ).length;
  const totalShares = positions.reduce((sum, p) => sum + p.shares, 0);
  const sharesVoted = positions
    .filter((p) => p.voteStatus === "Voted")
    .reduce((sum, p) => sum + p.sharesVoted, 0);

  const percentageVoted =
    totalShares > 0 ? (sharesVoted / totalShares) * 100 : 0;

  // Count voting methods
  const webVotes = positions.filter((p) => p.votingSource === "WEB").length;
  const paperVotes = positions.filter((p) => p.votingSource === "PRINT").length;
  const phoneVotes = positions.filter((p) => p.votingSource === "IVR").length;

  // Registered-only voting methods (FR-001/FR-002 — Voting Activity chart)
  const registeredPositions = positions.filter(
    (p) =>
      isRegisteredOnlyHolder(p.holderCategory, p.accountType) &&
      p.voteStatus === "Voted"
  );
  const registeredVotingMethods: RegisteredVotingMethods = {
    web: registeredPositions.filter((p) => p.votingSource === "WEB").length,
    paper: registeredPositions.filter((p) => p.votingSource === "PRINT").length,
    phone: registeredPositions.filter((p) => p.votingSource === "IVR").length,
  };

  // Calculate real voting breakdown by aggregating all proposals
  let totalForShares = 0;
  let totalAgainstShares = 0;
  let totalAbstainShares = 0;

  for (const proposal of proposals) {
    const proposalFor = proposal.totalVotesFor;
    const proposalAgainst = proposal.totalVotesAgainst;
    const proposalAbstain = proposal.totalVotesAbstain;

    totalForShares += proposalFor;
    totalAgainstShares += proposalAgainst;
    totalAbstainShares += proposalAbstain;
  }

  // Use the aggregate totals for the chart (not averages)
  const forShares = totalForShares;
  const againstShares = totalAgainstShares;
  const abstainShares = totalAbstainShares;
  const withholdShares = 0; // No withhold in the actual data

  // Calculate total shares from actual voting data
  const totalVotingShares =
    forShares + againstShares + abstainShares + withholdShares;

  const votingBreakdown = {
    for: {
      shares: forShares,
      percentage:
        totalVotingShares > 0 ? (forShares / totalVotingShares) * 100 : 0,
    },
    against: {
      shares: againstShares,
      percentage:
        totalVotingShares > 0 ? (againstShares / totalVotingShares) * 100 : 0,
    },
    abstain: {
      shares: abstainShares,
      percentage:
        totalVotingShares > 0 ? (abstainShares / totalVotingShares) * 100 : 0,
    },
    withhold: {
      shares: withholdShares,
      percentage:
        totalVotingShares > 0 ? (withholdShares / totalVotingShares) * 100 : 0,
    },
  };

  const summary: VotingSummary = {
    totalSharesVoted: sharesVoted,
    totalSharesOutstanding: totalShares,
    percentageVoted: Math.round(percentageVoted * 100) / 100, // Round to 2 decimal places
    positionsVoted,
    totalPositions,
    lastUpdated: new Date().toISOString(),
    votingMethods: {
      web: webVotes,
      paper: paperVotes,
      phone: phoneVotes,
    },
    votingBreakdown,
  };

  // Transform proposals data for voting display
  const votingProposals: ProposalVoting[] = proposals.map((proposal) => {
    // Use actual voting data from the database
    const proposalForShares = proposal.totalVotesFor;
    const proposalAgainstShares = proposal.totalVotesAgainst;
    const proposalAbstainShares = proposal.totalVotesAbstain;

    const proposalTotalVoted =
      proposalForShares + proposalAgainstShares + proposalAbstainShares;

    const realVotingResults = {
      for: {
        shares: proposalForShares,
        percentage:
          proposalTotalVoted > 0
            ? (proposalForShares / proposalTotalVoted) * 100
            : 0,
      },
      against: {
        shares: proposalAgainstShares,
        percentage:
          proposalTotalVoted > 0
            ? (proposalAgainstShares / proposalTotalVoted) * 100
            : 0,
      },
      abstain: {
        shares: proposalAbstainShares,
        percentage:
          proposalTotalVoted > 0
            ? (proposalAbstainShares / proposalTotalVoted) * 100
            : 0,
      },
    };

    return {
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      description: proposal.title,
      proposalTitle: proposal.title,
      proposalType: proposal.proposalType,
      directorName: proposal.directorName,
      recommendation: proposal.recommendation,
      votingResults: realVotingResults,
      voteCounts: proposalVoteCounts.get(proposal.id),
      totalShares: proposalTotalVoted,
      status: "active" as const,
    };
  });

  // Sort proposals: director elections (1.xx) first in order, then other proposals (2, 3, etc.)
  const sortedProposals = [...votingProposals].sort((a, b) => {
    const aNumber = a.proposalNumber;
    const bNumber = b.proposalNumber;

    // Both are sub-proposals (e.g., 1.01, 1.02) - sort numerically
    const isAIsSubProposal = aNumber % 1 !== 0;
    const isBIsSubProposal = bNumber % 1 !== 0;

    // If both are sub-proposals or both are main proposals, sort numerically
    if (isAIsSubProposal === isBIsSubProposal) {
      return aNumber - bNumber;
    }

    // Sub-proposals (1.01, 1.02) come before main proposals with same integer part
    // e.g., 1.01 < 1.02 < 2 < 3
    const aInt = Math.floor(aNumber);
    const bInt = Math.floor(bNumber);

    if (aInt !== bInt) {
      return aInt - bInt;
    }

    // Same integer part: sub-proposals come after their parent
    // e.g., for proposal 1: 1.01, 1.02 should come after 1 but before 2
    return isAIsSubProposal ? 1 : -1;
  });

  return {
    proposals: sortedProposals,
    votingSummary: summary,
    registeredVotingMethods,
    previousYearsPercentages,
  };
};

export const useVotingTabulation = (
  meetingId?: string
): UseVotingTabulationResult => {
  const resolvedMeetingId = meetingId ?? "";
  const { data, error, isLoading, mutate } = useSWR<VotingTabulationData>(
    resolvedMeetingId.length > 0 ? `/voting/${resolvedMeetingId}` : null,
    async () => await fetchVotingData(resolvedMeetingId),
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 2000,
    }
  );

  const uploadProposals = async (proposals: unknown[]) => {
    if (meetingId === undefined || meetingId.length === 0) {
      throw new Error("Meeting ID is required");
    }

    const requiredMeetingId: string = meetingId;
    const apiClient = await buildApiClient();

    // Upload each proposal concurrently
    const proposalRecords = proposals
      .map((proposal) => asRecord(proposal))
      .filter(
        (proposalRecord): proposalRecord is Record<string, unknown> =>
          proposalRecord !== null
      );

    await Promise.all(
      proposalRecords.map(async (proposalRecord) => {
        await apiClient.POST("/meetings/{meetingId}/proposals", {
          params: { path: { meetingId: requiredMeetingId } },
          body: {
            proposalNumber: Number(proposalRecord.proposalNumber) || 0,
            proposalTitle: asString(proposalRecord.proposalTitle) || "",
            proposalType: asString(proposalRecord.proposalType) || "",
            proposalSubtype:
              asString(proposalRecord.proposalSubtype) || undefined,
            directorName: asString(proposalRecord.directorName) || undefined,
            recommendation: asString(proposalRecord.recommendation) || "",
          },
        });
      })
    );

    // Refresh the data
    await mutate();
  };

  return {
    proposals: data?.proposals || [],
    votingSummary: data?.votingSummary || null,
    registeredVotingMethods: data?.registeredVotingMethods || null,
    loading: isLoading,
    error: error ? error.message : null,
    refetch: () => void mutate(),
    uploadProposals,
    previousYearsPercentages: data?.previousYearsPercentages || [],
  };
};
