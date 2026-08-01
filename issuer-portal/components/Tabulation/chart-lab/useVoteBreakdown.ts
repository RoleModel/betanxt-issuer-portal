"use client";

import useSWR from "swr";

import buildApiClient from "@/domain-models/apiClient";
import {
  getHolderTypeFromCategory,
  normalizeHolderCategory,
} from "@/utils/holderCategory";

/** One leaf of the source → holder type → vote hierarchy. */
export interface VoteBreakdownLeaf {
  source: string;
  holderType: "Registered" | "Beneficial";
  vote: "For" | "Against" | "Abstain";
  shares: number;
}

export interface VoteBreakdownResult {
  leaves: VoteBreakdownLeaf[];
  proposals: { id: string; label: string }[];
  totalShares: number;
  isLoading: boolean;
  error: string | null;
}

interface PositionRecord {
  id?: string;
  sentBy?: string | null;
  holderCategory?: string | null;
  accountType?: string | null;
}

interface PositionVoteRecord {
  positionId?: string;
  proposalId?: string;
  vote?: string | null;
  sharesVoting?: string | number | null;
}

interface ProposalRecord {
  id?: string;
  proposalNumber?: number | string;
  description?: string | null;
  directorName?: string | null;
}

const SOURCE_LABELS: Record<string, string> = {
  EMAIL: "Email",
  MAIL: "Mail",
  PHONE: "Phone",
  WEB: "Web",
};

const VOTE_LABELS: Record<string, VoteBreakdownLeaf["vote"]> = {
  ABSTAIN: "Abstain",
  AGAINST: "Against",
  FOR: "For",
};

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const readCollection = (payload: unknown, key: string): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (typeof payload === "object" && payload !== null) {
    return asArray((payload as Record<string, unknown>)[key]);
  }
  return [];
};

/**
 * Joins positions to their per-proposal votes so a single chart can show the
 * whole path a share took: which channel it arrived through, whether the holder
 * was registered or beneficial, and how it was cast.
 *
 * The three existing tabulation cards each read one of those dimensions in
 * isolation; this exists to explore folding them into one figure.
 *
 * @param meetingId - Meeting whose positions and votes are charted
 * @param proposalId - Proposal for the vote ring; the first proposal when omitted
 * @returns Flat leaves plus the proposal list for the selector
 */
export const useVoteBreakdown = (
  meetingId: string | undefined,
  proposalId: string | undefined
): VoteBreakdownResult => {
  const { data, error, isLoading } = useSWR(
    meetingId === undefined ? null : ["vote-breakdown", meetingId],
    async () => {
      const apiClient = await buildApiClient();

      const [positionsResponse, proposalsResponse] = await Promise.all([
        apiClient.GET("/positions", {
          params: { query: { meetingId, limit: 5000 } },
        }),
        apiClient.GET("/meetings/{meetingId}/proposals", {
          params: { path: { meetingId: meetingId ?? "" } },
        }),
      ]);

      return {
        positions: readCollection(
          positionsResponse.data,
          "positions"
        ) as PositionRecord[],
        proposals: readCollection(
          proposalsResponse.data,
          "proposals"
        ) as ProposalRecord[],
      };
    },
    { revalidateOnFocus: false }
  );

  const proposals = (data?.proposals ?? [])
    .map((proposal) => ({
      id: proposal.id ?? "",
      label: `Proposal ${String(proposal.proposalNumber ?? "?")}${
        proposal.directorName ? ` — ${proposal.directorName}` : ""
      }`,
    }))
    .filter((proposal) => proposal.id.length > 0);

  const activeProposalId = proposalId ?? proposals[0]?.id;

  // Scoped by proposal rather than fetched wholesale: the unfiltered
  // /position_votes collection is capped server-side and returns votes from
  // other meetings, so joining it to this meeting's positions matched nothing.
  const { data: votes, isLoading: votesLoading } = useSWR(
    activeProposalId === undefined
      ? null
      : ["vote-breakdown-votes", activeProposalId],
    async () => {
      const apiClient = await buildApiClient();
      const response = await apiClient.GET("/position_votes", {
        params: { query: { proposalId: activeProposalId, limit: 5000 } },
      });
      return readCollection(
        response.data,
        "positionVotes"
      ) as PositionVoteRecord[];
    },
    { revalidateOnFocus: false }
  );

  const positionsById = new Map<string, PositionRecord>();
  for (const position of data?.positions ?? []) {
    if (position.id !== undefined) {
      positionsById.set(position.id, position);
    }
  }

  const totals = new Map<string, VoteBreakdownLeaf>();

  for (const vote of votes ?? []) {
    if (
      activeProposalId !== undefined &&
      vote.proposalId !== undefined &&
      vote.proposalId !== activeProposalId
    ) {
      continue;
    }

    const position =
      vote.positionId === undefined
        ? undefined
        : positionsById.get(vote.positionId);
    if (position === undefined) {
      continue;
    }

    const voteLabel = VOTE_LABELS[(vote.vote ?? "").toUpperCase()];
    if (voteLabel === undefined) {
      continue;
    }

    const rawSource = (position.sentBy ?? "").toUpperCase();
    const source = SOURCE_LABELS[rawSource] ?? (rawSource || "Unknown");
    const holderType =
      getHolderTypeFromCategory(
        normalizeHolderCategory(position.holderCategory),
        position.accountType ?? ""
      ) === "registered"
        ? "Registered"
        : "Beneficial";

    const shares = Number(vote.sharesVoting ?? 0);
    if (!Number.isFinite(shares) || shares <= 0) {
      continue;
    }

    const key = `${source}|${holderType}|${voteLabel}`;
    const existing = totals.get(key);
    if (existing) {
      existing.shares += shares;
    } else {
      totals.set(key, { holderType, shares, source, vote: voteLabel });
    }
  }

  const leaves = [...totals.values()];

  return {
    error: error === undefined ? null : "Unable to load vote breakdown",
    isLoading: isLoading || votesLoading,
    leaves,
    proposals,
    totalShares: leaves.reduce((sum, leaf) => sum + leaf.shares, 0),
  };
};
