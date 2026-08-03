"use client";

import { useMemo } from "react";

import type { ProposalRow } from "@/hooks/use-tabulation-report-review";
import type { ReviewQueueItem } from "@/hooks/use-tabulation-review-queue";

export interface TabulationEmailPreviewProposal {
  readonly abstainPercent: number;
  readonly againstPercent: number;
  readonly forPercent: number;
  readonly number: string;
  readonly title: string;
  readonly totalShares: number;
  readonly votedPercent: number;
  readonly votesAbstain: number;
  readonly votesAgainst: number;
  readonly votesFor: number;
  readonly votesNotCast: number;
}

export interface TabulationEmailPreviewData {
  readonly companyName: string;
  readonly daysUntilMeeting: number;
  readonly meetingDate: string;
  readonly meetingType: string;
  readonly portalUrl: string;
  readonly proposals: TabulationEmailPreviewProposal[];
  readonly quorumMet: boolean;
  readonly quorumPercent: number;
  readonly quorumRequired: number;
  readonly recipientName: string;
  readonly reportDate: string;
  readonly totalSharesEligible: number;
  readonly totalSharesVoted: number;
}

const fallbackQuorumRequired = 50;

const toNumber = (value: number | null | undefined): number => value ?? 0;

const percent = (value: number, total: number): number => {
  if (total === 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
};

const formatProposalNumber = (proposalNumber: number | null): string => {
  if (proposalNumber === null) {
    return "-";
  }
  return Number.isInteger(proposalNumber) ? String(proposalNumber) : proposalNumber.toFixed(2);
};

/**
 * Converts the selected report and reviewed proposal rows into the data shape
 * used by the client-facing daily tabulation email preview.
 */
export const useTabulationReportEmailPreview = (
  item: ReviewQueueItem | null,
  rows: ProposalRow[],
): TabulationEmailPreviewData | null =>
  useMemo(() => {
    if (item === null) {
      return null;
    }

    const proposalTotals = rows.map((row) => {
      const votesFor = toNumber(row.totalVotesFor);
      const votesAgainst = toNumber(row.totalVotesAgainst);
      const votesAbstain = toNumber(row.totalVotesAbstain);
      const votesCast = votesFor + votesAgainst + votesAbstain;
      const totalShares =
        row.totalSharesEligible ??
        item.totalSharesOutstanding ??
        Math.max(votesCast + toNumber(row.brokerNonVotes), votesCast);
      const votesNotCast = Math.max(totalShares - votesCast, 0);

      return {
        abstainPercent: percent(votesAbstain, totalShares),
        againstPercent: percent(votesAgainst, totalShares),
        forPercent: percent(votesFor, totalShares),
        number: formatProposalNumber(row.proposalNumber),
        title: row.directorName ?? row.proposalTitle,
        totalShares,
        votedPercent: percent(votesCast, totalShares),
        votesAbstain,
        votesAgainst,
        votesFor,
        votesNotCast,
      };
    });

    const totalSharesEligible =
      item.totalSharesOutstanding ??
      Math.max(...proposalTotals.map((proposal) => proposal.totalShares), 0);
    const totalSharesVoted = Math.max(
      ...proposalTotals.map(
        (proposal) => proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain,
      ),
      0,
    );
    const quorumRequired = item.quorumRequirement ?? fallbackQuorumRequired;

    return {
      companyName: item.companyName,
      daysUntilMeeting: item.daysUntilMeeting,
      meetingDate: item.meetingDate,
      meetingType: item.meetingType,
      portalUrl: `/${item.ticker}/meeting/${item.meetingId}/tabulation`,
      proposals: proposalTotals,
      quorumMet: percent(totalSharesVoted, totalSharesEligible) >= quorumRequired,
      quorumPercent: percent(totalSharesVoted, totalSharesEligible),
      quorumRequired,
      recipientName: "Client team",
      reportDate: new Date().toISOString(),
      totalSharesEligible,
      totalSharesVoted,
    };
  }, [item, rows]);
