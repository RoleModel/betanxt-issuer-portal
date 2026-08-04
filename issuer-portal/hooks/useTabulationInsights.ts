/* eslint-disable sonarjs/max-union-size */
/* eslint-disable unicorn/no-unreadable-new-expression */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
/* eslint-disable compat/compat */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { components } from "@/domain-models/generated-schema";
import type { ProposalVoting, VotingSummary } from "@/types/phases";
import type { QuorumGaugeViewModel } from "@/utils/quorum";
import type { HolderCategory } from "@/utils/holderCategory";
import buildApiClient from "@/domain-models/apiClient";
import {
  getHolderTypeFromCategory,
  normalizeHolderCategory,
} from "@/utils/holderCategory";
import { buildQuorumGaugeModel } from "@/utils/quorum";
import { asArray, asRecord, asString } from "@/utils/typeUtils";

export interface TabulationPosition {
  id: string;
  cusip: string;
  accountType: string;
  /** Normalized holder category; null when the API record carried no recognizable value (legacy data). */
  holderCategory: HolderCategory | null;
  setKey: string;
  name: string;
  accountNumber: string;
  accountEmail: string | null;
  voteStatus: string;
  controlNumber: string;
  shares: number;
  sharesVoted: number;
  source: string;
  dateVoted: string | null;
  sentBy: string | null;
  /** US state code for geographic distribution; null when unknown. */
  state: string | null;
  /** Country code for geographic distribution; null when unknown. */
  country: string | null;
}

interface PositionVoteRecord {
  positionId: string;
  proposalId: string;
  vote: "FOR" | "AGAINST" | "ABSTAIN" | "WITHHOLD";
  sharesVoting: number;
}

const voteMatrixSources = [
  { key: "WEB", label: "Web" },
  { key: "PRINT", label: "Print" },
  { key: "IVR", label: "IVR" },
  { key: "SOLICITOR", label: "Solicitor" },
] as const;

type VoteMatrixSource = (typeof voteMatrixSources)[number]["label"];

export interface VoteMatrixRow {
  against: number;
  abstain: number;
  for: number;
  holderType: "Beneficial" | "Registered";
  source: VoteMatrixSource;
  withhold: number;
}

export interface VoteMatrixProposal {
  readonly proposalId: string;
  readonly proposalLabel: string;
  /** Numeric agenda ordering used by proposal selectors. */
  readonly proposalNumber: number;
  readonly rows: readonly VoteMatrixRow[];
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

interface ProposalRecord {
  id: string;
  proposalNumber: number;
  proposalTitle: string;
  proposalType?: string;
  recommendation?: string;
  directorName?: string;
  totalVotesFor: number;
  totalVotesAgainst: number;
  totalVotesAbstain: number;
}

export interface TabulationFilters {
  searchQuery: string;
  voteStatus: "All" | "Voted" | "Unvoted";
  holderType: "all" | "beneficial" | "registered";
  accountType: string;
  setKey: string;
  directorProposalId: string;
  controlNumber: string;
  accountNumber: string;
  positionName: string;
  shareLow: string;
  shareHigh: string;
}

interface DirectorOption {
  id: string;
  label: string;
}

interface TabulationInsightsResult {
  loading: boolean;
  proposals: ProposalVoting[];
  filteredPositions: TabulationPosition[];
  summary: VotingSummary | null;
  quorumGauge: QuorumGaugeViewModel | null;
  filters: TabulationFilters;
  setFilters: Dispatch<SetStateAction<TabulationFilters>>;
  accountTypes: string[];
  setKeys: string[];
  directors: DirectorOption[];
  voteMatrixProposals: readonly VoteMatrixProposal[];
  meetingTitle: string;
  clientTicker: string;
}

const DEFAULT_FILTERS: TabulationFilters = {
  searchQuery: "",
  voteStatus: "All",
  holderType: "all",
  accountType: "",
  setKey: "",
  directorProposalId: "",
  controlNumber: "",
  accountNumber: "",
  positionName: "",
  shareLow: "",
  shareHigh: "",
};

const isActiveFilterValue = (value: string): boolean =>
  value !== "" && value !== "All" && value !== "all";

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  const parsed = asString(value);
  if (parsed) {
    return parsed;
  }
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return String(value);
  }
  return "";
};

const toNullableString = (value: unknown): string | null => {
  const parsed = toStringValue(value);
  return parsed || null;
};

/**
 * Converts a raw `/positions` API record (snake_case or camelCase) into a
 * {@link TabulationPosition}, normalizing holderCategory to one of the known
 * categories (or null) and surfacing state/country for geographic features.
 */
const normalizePosition = (value: unknown): TabulationPosition | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    id: toStringValue(record.id),
    cusip: toStringValue(record.cusip),
    accountType: toStringValue(record.account_type ?? record.accountType),
    holderCategory: normalizeHolderCategory(
      record.holder_category ?? record.holderCategory
    ),
    setKey: toStringValue(record.set_key ?? record.setKey),
    name: toStringValue(record.name),
    accountNumber: toStringValue(record.account_number ?? record.accountNumber),
    accountEmail: toNullableString(record.account_email ?? record.accountEmail),
    voteStatus: toStringValue(record.vote_status ?? record.voteStatus),
    controlNumber: toStringValue(record.control_number ?? record.controlNumber),
    shares: toFiniteNumber(record.shares),
    sharesVoted: toFiniteNumber(record.shares_voted ?? record.sharesVoted),
    source: toStringValue(record.source ?? record.votingSource),
    dateVoted: toNullableString(record.date_voted ?? record.dateVoted),
    sentBy: toNullableString(record.sent_by ?? record.sentBy),
    state: toNullableString(record.state),
    country: toNullableString(record.country),
  };
};

const normalizeProposal = (value: unknown): ProposalRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    id: toStringValue(record.id),
    proposalNumber: toFiniteNumber(
      record.proposalNumber ?? record.proposal_number
    ),
    proposalTitle: toStringValue(
      record.proposalTitle ?? record.proposal_title ?? record.title
    ),
    proposalType:
      toNullableString(record.proposalType ?? record.proposal_type) ??
      undefined,
    recommendation: toNullableString(record.recommendation) ?? undefined,
    directorName:
      toNullableString(record.directorName ?? record.director_name) ??
      undefined,
    totalVotesFor: toFiniteNumber(
      record.totalVotesFor ?? record.total_votes_for
    ),
    totalVotesAgainst: toFiniteNumber(
      record.totalVotesAgainst ?? record.total_votes_against
    ),
    totalVotesAbstain: toFiniteNumber(
      record.totalVotesAbstain ?? record.total_votes_abstain
    ),
  };
};

const normalizePositionVote = (value: unknown): PositionVoteRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const vote = toStringValue(record.vote).toUpperCase();
  if (!["FOR", "AGAINST", "ABSTAIN", "WITHHOLD"].includes(vote)) {
    return null;
  }

  return {
    positionId: toStringValue(record.positionId ?? record.position_id),
    proposalId: toStringValue(record.proposalId ?? record.proposal_id),
    vote: vote as PositionVoteRecord["vote"],
    sharesVoting: toFiniteNumber(record.sharesVoting ?? record.shares_voting),
  };
};

const buildProposalVoting = (
  proposal: ProposalRecord,
  voteCounts?: ProposalVoteCounts
): ProposalVoting => {
  const totalVotes =
    proposal.totalVotesFor +
    proposal.totalVotesAgainst +
    proposal.totalVotesAbstain;

  return {
    proposalId: proposal.id,
    proposalNumber: proposal.proposalNumber,
    description: proposal.proposalTitle,
    proposalTitle: proposal.proposalTitle,
    proposalType: proposal.proposalType,
    directorName: proposal.directorName,
    recommendation: proposal.recommendation,
    votingResults: {
      for: {
        shares: proposal.totalVotesFor,
        percentage:
          totalVotes > 0 ? (proposal.totalVotesFor / totalVotes) * 100 : 0,
      },
      against: {
        shares: proposal.totalVotesAgainst,
        percentage:
          totalVotes > 0 ? (proposal.totalVotesAgainst / totalVotes) * 100 : 0,
      },
      abstain: {
        shares: proposal.totalVotesAbstain,
        percentage:
          totalVotes > 0 ? (proposal.totalVotesAbstain / totalVotes) * 100 : 0,
      },
    },
    voteCounts,
    totalShares: totalVotes,
    status: "active",
  };
};

/**
 * Maps a position to the broad registered/beneficial split used by holder-type
 * filters: REGISTERED and PLAN count as registered, BENEFICIAL and NOBO as
 * beneficial, with the legacy accountType fallback when holderCategory is null.
 */
const getHolderType = (
  position: TabulationPosition
): "beneficial" | "registered" =>
  getHolderTypeFromCategory(position.holderCategory, position.accountType);

const createVoteMatrixRows = (): VoteMatrixRow[] => {
  const rows: VoteMatrixRow[] = [];

  for (const holderType of ["Registered", "Beneficial"] as const) {
    for (const source of voteMatrixSources) {
      rows.push({
        against: 0,
        abstain: 0,
        for: 0,
        holderType,
        source: source.label,
        withhold: 0,
      });
    }
  }

  return rows;
};

const buildVotingSummary = (parameters: {
  positions: TabulationPosition[];
  proposals: ProposalVoting[];
  totalSharesOutstanding: number;
  representedShares: number;
}): VotingSummary => {
  const { positions, proposals, totalSharesOutstanding, representedShares } =
    parameters;

  let forShares = 0;
  let againstShares = 0;
  let abstainShares = 0;

  for (const proposal of proposals) {
    forShares += proposal.votingResults.for.shares;
    againstShares += proposal.votingResults.against.shares;
    abstainShares += proposal.votingResults.abstain.shares;
  }

  const totalProposalVotes = forShares + againstShares + abstainShares;

  return {
    totalSharesVoted: representedShares,
    totalSharesOutstanding,
    percentageVoted:
      totalSharesOutstanding > 0
        ? Math.round((representedShares / totalSharesOutstanding) * 10_000) /
          100
        : 0,
    positionsVoted: positions.filter(
      (position) => position.voteStatus === "Voted"
    ).length,
    totalPositions: positions.length,
    lastUpdated: new Date().toISOString(),
    votingMethods: {
      web: positions.filter((position) => position.source === "WEB").length,
      solicitor: positions.filter((position) => position.source === "SOLICITOR")
        .length,
      paper: positions.filter((position) => position.source === "PRINT").length,
      phone: positions.filter((position) => position.source === "IVR").length,
    },
    votingBreakdown: {
      for: {
        shares: forShares,
        percentage:
          totalProposalVotes > 0 ? (forShares / totalProposalVotes) * 100 : 0,
      },
      against: {
        shares: againstShares,
        percentage:
          totalProposalVotes > 0
            ? (againstShares / totalProposalVotes) * 100
            : 0,
      },
      abstain: {
        shares: abstainShares,
        percentage:
          totalProposalVotes > 0
            ? (abstainShares / totalProposalVotes) * 100
            : 0,
      },
      withhold: {
        shares: 0,
        percentage: 0,
      },
    },
  };
};

export function useTabulationInsights(
  meetingId?: string,
  meeting?: components["schemas"]["Meeting"] | null
): TabulationInsightsResult {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<TabulationPosition[]>([]);
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [positionVotes, setPositionVotes] = useState<PositionVoteRecord[]>([]);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [clientTicker, setClientTicker] = useState("");
  const [filters, setFilters] = useState<TabulationFilters>(DEFAULT_FILTERS);
  const [tabulationReportVotedShares, setTabulationReportVotedShares] =
    useState<number | null>(null);
  const [tabulationReportTotalShares, setTabulationReportTotalShares] =
    useState<number | null>(null);

  useEffect(() => {
    if (!meetingId) {
      return;
    }

    let isCancelled = false;

    const fetchTabulationData = async () => {
      setLoading(true);

      try {
        const apiClient = await buildApiClient();

        const [
          positionsResult,
          proposalsResult,
          meetingResult,
          tabulationReportResult,
        ] = await Promise.all([
          apiClient.GET("/positions", {
            params: {
              query: {
                meetingId,
                limit: 5000,
              },
            },
          }),
          apiClient.GET("/meetings/{meetingId}/proposals", {
            params: {
              path: { meetingId },
            },
          }),
          apiClient.GET("/meetings/{meetingId}", {
            params: {
              path: { meetingId },
            },
          }),
          apiClient.GET("/meetings/{meetingId}/tabulation-report", {
            params: {
              path: { meetingId },
            },
          }),
        ]);

        const rawPositions = Array.isArray(positionsResult.data)
          ? positionsResult.data
          : asArray(asRecord(positionsResult.data)?.positions);
        const normalizedPositions = rawPositions.reduce<TabulationPosition[]>(
          (accumulator, item) => {
            const normalized = normalizePosition(item);
            if (normalized) {
              accumulator.push(normalized);
            }
            return accumulator;
          },
          []
        );

        const rawProposals = Array.isArray(proposalsResult.data)
          ? proposalsResult.data
          : [];
        const normalizedProposals = rawProposals.reduce<ProposalRecord[]>(
          (accumulator, item) => {
            const normalized = normalizeProposal(item);
            if (normalized) {
              accumulator.push(normalized);
            }
            return accumulator;
          },
          []
        );

        const positionIdSet = new Set(
          normalizedPositions.flatMap(
            (position: TabulationPosition): string[] =>
              position.id ? [position.id] : []
          )
        );
        const proposalIds = new Set(
          normalizedProposals.map((proposal) => proposal.id)
        );
        const rawPositionVotes =
          positionIdSet.size > 0
            ? await fetchPositionVotesForMeeting(meetingId)
            : [];
        const normalizedVotes = rawPositionVotes.flatMap(
          (item: unknown): PositionVoteRecord[] => {
            const vote = normalizePositionVote(item);
            if (
              vote === null ||
              !proposalIds.has(vote.proposalId) ||
              !positionIdSet.has(vote.positionId)
            ) {
              return [];
            }
            return [vote];
          }
        );

        if (isCancelled) {
          return;
        }

        setPositions(normalizedPositions);
        setProposals(normalizedProposals);
        setPositionVotes(normalizedVotes);

        const meetingRecord = asRecord(meetingResult.data);
        setMeetingTitle(asString(meetingRecord?.title) || "");
        setClientTicker(asString(meetingRecord?.ticker) || "");

        const reportData = asRecord(tabulationReportResult.data);
        const positionsVoted = asRecord(reportData?.positionsVoted);
        if (positionsVoted) {
          const reportVotedShares = toFiniteNumber(positionsVoted.votedShares);
          const reportTotalShares = toFiniteNumber(positionsVoted.totalShares);
          if (reportTotalShares > 0) {
            setTabulationReportVotedShares(reportVotedShares);
            setTabulationReportTotalShares(reportTotalShares);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to fetch tabulation insights:", error);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void fetchTabulationData();

    return () => {
      isCancelled = true;
    };
  }, [meetingId]);

  const accountTypes = useMemo(
    () =>
      [
        ...new Set(
          positions.flatMap((position: TabulationPosition): string[] =>
            position.accountType ? [position.accountType] : []
          )
        ),
      ].sort((a: string, b: string) => a.localeCompare(b)),
    [positions]
  );

  const setKeys = useMemo(
    () =>
      [
        ...new Set(
          positions.flatMap((position: TabulationPosition): string[] =>
            position.setKey ? [position.setKey] : []
          )
        ),
      ].sort((a: string, b: string) => a.localeCompare(b)),
    [positions]
  );

  const directors = useMemo(
    () =>
      proposals.flatMap(
        (proposal: ProposalRecord): { id: string; label: string }[] =>
          proposal.directorName
            ? [
                {
                  id: proposal.id,
                  label: proposal.directorName || proposal.proposalTitle,
                },
              ]
            : []
      ),
    [proposals]
  );

  const filteredPositions = useMemo(() => {
    const directorPositionIds = new Set(
      positionVotes.flatMap((vote: PositionVoteRecord): string[] =>
        !filters.directorProposalId ||
        vote.proposalId === filters.directorProposalId
          ? [vote.positionId]
          : []
      )
    );

    return positions.filter((position) => {
      const isMatchesSearch =
        !filters.searchQuery ||
        position.name
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) ||
        position.accountNumber
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) ||
        position.controlNumber
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase());

      const isMatchesVoteStatus =
        filters.voteStatus === "All" ||
        position.voteStatus === filters.voteStatus;
      const isMatchesHolderType =
        filters.holderType === "all" ||
        getHolderType(position) === filters.holderType;
      const isMatchesAccountType =
        !filters.accountType || position.accountType === filters.accountType;
      const isMatchesSetKey =
        !filters.setKey || position.setKey === filters.setKey;
      const isMatchesDirector =
        !filters.directorProposalId || directorPositionIds.has(position.id);
      const isMatchesControlNumber =
        !filters.controlNumber ||
        position.controlNumber
          .toLowerCase()
          .includes(filters.controlNumber.toLowerCase());
      const isMatchesAccountNumber =
        !filters.accountNumber ||
        position.accountNumber
          .toLowerCase()
          .includes(filters.accountNumber.toLowerCase());
      const isMatchesPositionName =
        !filters.positionName ||
        position.name
          .toLowerCase()
          .includes(filters.positionName.toLowerCase());
      const shareLow = filters.shareLow
        ? Number.parseFloat(filters.shareLow)
        : null;
      const shareHigh = filters.shareHigh
        ? Number.parseFloat(filters.shareHigh)
        : null;
      const isMatchesShareRange =
        (shareLow === null || position.shares >= shareLow) &&
        (shareHigh === null || position.shares <= shareHigh);

      return (
        isMatchesSearch &&
        isMatchesVoteStatus &&
        isMatchesHolderType &&
        isMatchesAccountType &&
        isMatchesSetKey &&
        isMatchesDirector &&
        isMatchesControlNumber &&
        isMatchesAccountNumber &&
        isMatchesPositionName &&
        isMatchesShareRange
      );
    });
  }, [filters, positionVotes, positions]);

  const proposalsForDisplay = useMemo(() => {
    const filtersForProposalAggregation = {
      ...filters,
      voteStatus: "All" as const,
    };
    const hasActiveProposalFilters = Object.values(
      filtersForProposalAggregation
    ).some((value) => isActiveFilterValue(value));

    if (!hasActiveProposalFilters) {
      const voteCountsByProposalId = new Map<string, ProposalVoteCounts>();

      for (const vote of positionVotes) {
        const currentCounts = voteCountsByProposalId.get(vote.proposalId) ?? {
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
        voteCountsByProposalId.set(vote.proposalId, currentCounts);
      }

      return proposals.map((proposal) =>
        buildProposalVoting(proposal, voteCountsByProposalId.get(proposal.id))
      );
    }

    const filteredPositionIds = new Set(
      positions.flatMap((position: TabulationPosition): string[] => {
        const isMatchesSearch =
          !filtersForProposalAggregation.searchQuery ||
          position.name
            .toLowerCase()
            .includes(
              filtersForProposalAggregation.searchQuery.toLowerCase()
            ) ||
          position.accountNumber
            .toLowerCase()
            .includes(
              filtersForProposalAggregation.searchQuery.toLowerCase()
            ) ||
          position.controlNumber
            .toLowerCase()
            .includes(filtersForProposalAggregation.searchQuery.toLowerCase());

        const isMatchesHolderType =
          filtersForProposalAggregation.holderType === "all" ||
          getHolderType(position) === filtersForProposalAggregation.holderType;
        const isMatchesAccountType =
          !filtersForProposalAggregation.accountType ||
          position.accountType === filtersForProposalAggregation.accountType;
        const isMatchesSetKey =
          !filtersForProposalAggregation.setKey ||
          position.setKey === filtersForProposalAggregation.setKey;
        const isMatchesControlNumber =
          !filtersForProposalAggregation.controlNumber ||
          position.controlNumber
            .toLowerCase()
            .includes(
              filtersForProposalAggregation.controlNumber.toLowerCase()
            );
        const isMatchesAccountNumber =
          !filtersForProposalAggregation.accountNumber ||
          position.accountNumber
            .toLowerCase()
            .includes(
              filtersForProposalAggregation.accountNumber.toLowerCase()
            );
        const isMatchesPositionName =
          !filtersForProposalAggregation.positionName ||
          position.name
            .toLowerCase()
            .includes(filtersForProposalAggregation.positionName.toLowerCase());
        const shareLow = filtersForProposalAggregation.shareLow
          ? Number.parseFloat(filtersForProposalAggregation.shareLow)
          : null;
        const shareHigh = filtersForProposalAggregation.shareHigh
          ? Number.parseFloat(filtersForProposalAggregation.shareHigh)
          : null;
        const isMatchesShareRange =
          (shareLow === null || position.shares >= shareLow) &&
          (shareHigh === null || position.shares <= shareHigh);

        const isMatch =
          isMatchesSearch &&
          isMatchesHolderType &&
          isMatchesAccountType &&
          isMatchesSetKey &&
          isMatchesControlNumber &&
          isMatchesAccountNumber &&
          isMatchesPositionName &&
          isMatchesShareRange;

        return isMatch ? [position.id] : [];
      })
    );

    return proposals.flatMap((proposal: ProposalRecord) => {
      if (
        filtersForProposalAggregation.directorProposalId &&
        proposal.id !== filtersForProposalAggregation.directorProposalId
      ) {
        return [];
      }

      let forVotes = 0;
      let againstVotes = 0;
      let abstainVotes = 0;
      let forCount = 0;
      let againstCount = 0;
      let abstainCount = 0;

      for (const vote of positionVotes) {
        if (
          vote.proposalId !== proposal.id ||
          !filteredPositionIds.has(vote.positionId)
        ) {
          continue;
        }

        if (vote.vote === "FOR") {
          forVotes += vote.sharesVoting;
          forCount += 1;
        } else if (vote.vote === "ABSTAIN") {
          abstainVotes += vote.sharesVoting;
          abstainCount += 1;
        } else {
          againstVotes += vote.sharesVoting;
          againstCount += 1;
        }
      }

      const totalVotes = forVotes + againstVotes + abstainVotes;
      const totalCount = forCount + againstCount + abstainCount;

      return [
        {
          proposalId: proposal.id,
          proposalNumber: proposal.proposalNumber,
          description: proposal.proposalTitle,
          proposalTitle: proposal.proposalTitle,
          proposalType: proposal.proposalType,
          directorName: proposal.directorName,
          recommendation: proposal.recommendation,
          votingResults: {
            for: {
              shares: forVotes,
              percentage: totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0,
            },
            against: {
              shares: againstVotes,
              percentage:
                totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0,
            },
            abstain: {
              shares: abstainVotes,
              percentage:
                totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0,
            },
          },
          voteCounts: {
            for: forCount,
            against: againstCount,
            abstain: abstainCount,
            total: totalCount,
          },
          totalShares: totalVotes,
          status: "active" as const,
        },
      ];
    });
  }, [filters, positionVotes, positions, proposals]);

  const totalSharesOutstanding = useMemo(() => {
    if (
      tabulationReportTotalShares !== null &&
      tabulationReportTotalShares > 0
    ) {
      return tabulationReportTotalShares;
    }

    const fallbackOutstanding = filteredPositions.reduce(
      (sum, position) => sum + position.shares,
      0
    );

    return (
      toFiniteNumber(meeting?.totalSharesOutstanding) || fallbackOutstanding
    );
  }, [
    filteredPositions,
    meeting?.totalSharesOutstanding,
    tabulationReportTotalShares,
  ]);

  const representedShares = useMemo(() => {
    const hasActiveFilters = Object.values(filters).some((value) =>
      isActiveFilterValue(value)
    );

    if (!hasActiveFilters && tabulationReportVotedShares !== null) {
      return tabulationReportVotedShares;
    }

    if (!hasActiveFilters) {
      return positions
        .filter((position) => position.voteStatus === "Voted")
        .reduce((sum, position) => sum + position.sharesVoted, 0);
    }

    if (filters.directorProposalId) {
      return proposalsForDisplay[0]?.totalShares ?? 0;
    }

    return filteredPositions
      .filter((position) => position.voteStatus === "Voted")
      .reduce((sum, position) => sum + position.sharesVoted, 0);
  }, [
    filteredPositions,
    filters,
    positions,
    proposalsForDisplay,
    tabulationReportVotedShares,
  ]);

  const summary = useMemo(
    () =>
      buildVotingSummary({
        positions: filteredPositions,
        proposals: proposalsForDisplay,
        totalSharesOutstanding,
        representedShares,
      }),
    [
      filteredPositions,
      proposalsForDisplay,
      representedShares,
      totalSharesOutstanding,
    ]
  );

  const quorumGauge = useMemo(
    () =>
      buildQuorumGaugeModel({
        totalOutstandingShares: totalSharesOutstanding,
        representedShares,
        quorumRequirementPercent: meeting?.quorumRequirement ?? 50,
      }),
    [meeting?.quorumRequirement, representedShares, totalSharesOutstanding]
  );

  const voteMatrixProposals = useMemo(() => {
    const positionsById = new Map(
      filteredPositions.map((position) => [position.id, position])
    );
    const matricesByProposalId = new Map<string, VoteMatrixProposal>();

    for (const proposal of proposalsForDisplay) {
      matricesByProposalId.set(proposal.proposalId, {
        proposalId: proposal.proposalId,
        proposalLabel: `Proposal ${proposal.proposalNumber}: ${proposal.proposalTitle}`,
        proposalNumber: proposal.proposalNumber,
        rows: createVoteMatrixRows(),
      });
    }

    for (const vote of positionVotes) {
      const matrix = matricesByProposalId.get(vote.proposalId);
      const position = positionsById.get(vote.positionId);
      if (!matrix || !position || position.voteStatus !== "Voted") {
        continue;
      }

      const source = voteMatrixSources.find(
        (candidate) => candidate.key === position.source.toUpperCase()
      );
      if (!source) {
        continue;
      }

      const holderType =
        getHolderType(position) === "registered" ? "Registered" : "Beneficial";
      const row = matrix.rows.find(
        (candidate) =>
          candidate.holderType === holderType &&
          candidate.source === source.label
      );
      if (!row) {
        continue;
      }

      switch (vote.vote) {
        case "FOR": {
          row.for += vote.sharesVoting;

          break;
        }
        case "AGAINST": {
          row.against += vote.sharesVoting;

          break;
        }
        case "ABSTAIN": {
          row.abstain += vote.sharesVoting;

          break;
        }
        case "WITHHOLD": {
          row.withhold += vote.sharesVoting;

          break;
        }
        default: {
          // Unknown vote types count as withheld, matching the prior
          // catch-all rather than silently dropping the shares.
          row.withhold += vote.sharesVoting;
        }
      }
    }

    return [...matricesByProposalId.values()].toSorted(
      (left, right) => left.proposalNumber - right.proposalNumber
    );
  }, [filteredPositions, positionVotes, proposalsForDisplay]);

  return {
    loading,
    proposals: proposalsForDisplay,
    filteredPositions,
    summary,
    quorumGauge,
    filters,
    setFilters,
    accountTypes,
    setKeys,
    directors,
    voteMatrixProposals,
    meetingTitle,
    clientTicker,
  };
}
