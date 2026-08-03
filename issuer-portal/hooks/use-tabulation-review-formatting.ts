"use client";

import type { ProposalRow } from "@/hooks/use-tabulation-report-review";

const formatProposalNumber = (proposalNumber: number | null): string => {
  if (proposalNumber === null) {
    return "-";
  }
  return Number.isInteger(proposalNumber) ? String(proposalNumber) : proposalNumber.toFixed(2);
};

const formatVoteTotal = (value: number | null | undefined): string =>
  value == null ? "-" : value.toLocaleString("en-US");

const formatDelta = (current: number | null, original: number | null): string => {
  if (current === null || original === null) {
    return "";
  }
  const delta = current - original;
  if (delta === 0) {
    return "";
  }
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toLocaleString("en-US")}`;
};

const parseNumberInput = (value: string): number | null => {
  const normalized = value.replaceAll(",", "").trim();
  if (normalized.length === 0) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const proposalLabelFor = (row: ProposalRow): string => {
  const proposalNumber = formatProposalNumber(row.proposalNumber);
  const title = row.directorName ?? row.proposalTitle;
  return `Proposal ${proposalNumber}, ${title}`;
};

export interface NumberReviewFieldState {
  readonly changed: boolean;
  readonly helperText: string;
  readonly inputValue: string;
  readonly parseInput: (value: string) => number | null;
}

/** Builds display copy and parsing behavior for one editable vote-total field. */
export const useNumberReviewField = (
  value: number | null,
  original: number | null,
): NumberReviewFieldState => {
  const delta = formatDelta(value, original);
  const changed = delta.length > 0;

  return {
    changed,
    helperText: changed
      ? `Original ${formatVoteTotal(original)} (${delta})`
      : `Original ${formatVoteTotal(original)}`,
    inputValue: value === null ? "" : String(value),
    parseInput: parseNumberInput,
  };
};

/** Builds the proposal sentence label used in the review stepper. */
export const useProposalReviewLabel = (row: ProposalRow): string => proposalLabelFor(row);
