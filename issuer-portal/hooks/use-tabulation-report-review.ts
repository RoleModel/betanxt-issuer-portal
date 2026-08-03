"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import useSWR from "swr";

import type { components } from "@/domain-models/generated-schema";
import type { ReviewQueueItem } from "@/hooks/use-tabulation-review-queue";

import { buildApiClient } from "@/domain-models/apiClient";
import { asArray, asRecord, asString } from "@/utils/typeUtils";

type TabulationReview = components["schemas"]["TabulationReview"];

export type Classification = "NON_ROUTINE" | "ROUTINE";
export type ReviewSaveOutcome = "error" | "saved" | null;
type ReviewStatus = "PENDING_REVIEW" | "VERIFIED";

export interface ProposalRow {
  brokerNonVotes: number | null;
  classification: Classification;
  directorName: string | null;
  id: string;
  isDirectorSubProposal: boolean;
  proposalNumber: number | null;
  proposalTitle: string;
  proposalType: string;
  recommendation: string | null;
  totalSharesEligible: number | null;
  totalVotesAbstain: number | null;
  totalVotesAgainst: number | null;
  totalVotesFor: number | null;
}

export interface ChecklistState {
  brokerNonVotes: boolean;
  proposalClassification: boolean;
  voteCategories: boolean;
}

export const checklistKeys: (keyof ChecklistState)[] = [
  "brokerNonVotes",
  "proposalClassification",
  "voteCategories",
];

const routinePattern = /auditor|ratif|adjourn/iu;
const directorElectionNumber = 1;

interface ProposalVoteTotals {
  abstain: number;
  against: number;
  for: number;
}

const savedClassificationsOf = (item: ReviewQueueItem): Record<string, Classification> =>
  item.review?.proposalClassifications ?? {};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildPositionVoteTotals = (positionVotes: unknown[]): Map<string, ProposalVoteTotals> => {
  const totalsByProposal = new Map<string, ProposalVoteTotals>();

  for (const positionVote of positionVotes) {
    const record = asRecord(positionVote);
    if (record === null) {
      continue;
    }
    const proposalId = asString(record.proposalId) ?? asString(record.proposal_id);
    const vote = (asString(record.vote) ?? "").toUpperCase();
    const shares = toFiniteNumber(record.sharesVoting ?? record.shares_voting) ?? 0;
    if (proposalId === null || shares === 0) {
      continue;
    }
    const totals = totalsByProposal.get(proposalId) ?? {
      abstain: 0,
      against: 0,
      for: 0,
    };
    if (vote === "FOR") {
      totals.for += shares;
    } else if (vote === "ABSTAIN") {
      totals.abstain += shares;
    } else if (vote === "AGAINST" || vote === "WITHHOLD") {
      totals.against += shares;
    }
    totalsByProposal.set(proposalId, totals);
  }

  return totalsByProposal;
};

const brokerVotingKeyOrder = (key: string): number => {
  const match = /^proposal(?<index>\d+)$/u.exec(key);
  const index = match?.groups?.index;
  return index === undefined ? Number.POSITIVE_INFINITY : Number(index);
};

const buildBrokerVotingTotals = (tabulationReport: unknown): ProposalVoteTotals[] => {
  const report = asRecord(tabulationReport);
  const brokerVoting = asRecord(report?.brokerVoting);
  if (brokerVoting === null) {
    return [];
  }

  return Object.entries(brokerVoting)
    .sort(
      ([firstKey], [secondKey]) => brokerVotingKeyOrder(firstKey) - brokerVotingKeyOrder(secondKey),
    )
    .flatMap(([, rawEntries]) => {
      const entries = asArray(rawEntries);
      if (entries.length === 0) {
        return [];
      }
      const totals = entries.reduce<ProposalVoteTotals>(
        (total, entry) => {
          const record = asRecord(entry);
          if (record === null) {
            return total;
          }
          total.for += toFiniteNumber(record.sharesFor ?? record.for) ?? 0;
          total.against += toFiniteNumber(record.sharesAgainst ?? record.against) ?? 0;
          total.abstain += toFiniteNumber(record.sharesAbstain ?? record.abstain) ?? 0;
          return total;
        },
        { abstain: 0, against: 0, for: 0 },
      );
      return [totals];
    });
};

const normalizeProposalRows = (
  raw: unknown,
  saved: Record<string, Classification>,
  voteTotalsByProposal: ReadonlyMap<string, ProposalVoteTotals>,
  defaultBrokerNonVotes: number | null,
): ProposalRow[] => {
  const record = asRecord(raw);
  if (record === null) {
    return [];
  }
  const id = asString(record.id);
  const proposalTitle = asString(record.proposalTitle);
  if (id === null || proposalTitle === null) {
    return [];
  }
  const proposalType = asString(record.proposalType) ?? "Proposal";
  const proposalNumber = toFiniteNumber(record.proposalNumber ?? record.proposal_number);
  const directorName = asString(record.directorName) ?? asString(record.director_name);
  const voteTotals = voteTotalsByProposal.get(id);
  const defaultClassification: Classification = routinePattern.test(
    `${proposalTitle} ${proposalType}`,
  )
    ? "ROUTINE"
    : "NON_ROUTINE";
  return [
    {
      brokerNonVotes:
        toFiniteNumber(record.brokerNonVotes ?? record.broker_non_votes) ?? defaultBrokerNonVotes,
      classification: saved[id] ?? defaultClassification,
      directorName,
      id,
      isDirectorSubProposal:
        proposalNumber !== null &&
        !Number.isInteger(proposalNumber) &&
        Math.floor(proposalNumber) === directorElectionNumber &&
        directorName !== null,
      proposalNumber,
      proposalTitle,
      proposalType,
      recommendation: asString(record.recommendation),
      totalSharesEligible: toFiniteNumber(
        record.totalSharesEligible ?? record.total_shares_eligible,
      ),
      totalVotesAbstain:
        toFiniteNumber(record.totalVotesAbstain ?? record.total_votes_abstain) ??
        voteTotals?.abstain ??
        null,
      totalVotesAgainst:
        toFiniteNumber(record.totalVotesAgainst ?? record.total_votes_against) ??
        voteTotals?.against ??
        null,
      totalVotesFor:
        toFiniteNumber(record.totalVotesFor ?? record.total_votes_for) ?? voteTotals?.for ?? null,
    },
  ];
};

const sortProposalRows = (rows: ProposalRow[]): ProposalRow[] =>
  [...rows].sort((firstRow, secondRow) => {
    const firstNumber = firstRow.proposalNumber ?? Number.POSITIVE_INFINITY;
    const secondNumber = secondRow.proposalNumber ?? Number.POSITIVE_INFINITY;
    return firstNumber - secondNumber;
  });

const removeDirectorParentRows = (rows: ProposalRow[]): ProposalRow[] => {
  const hasDirectorSubProposals = rows.some((row) => row.isDirectorSubProposal);
  if (!hasDirectorSubProposals) {
    return rows;
  }
  return rows.filter((row) => row.proposalNumber !== directorElectionNumber);
};

const applyBrokerVotingFallback = (
  rows: ProposalRow[],
  brokerVotingTotals: readonly ProposalVoteTotals[],
): ProposalRow[] =>
  rows.map((row, index) => {
    const totals = brokerVotingTotals.at(index);
    if (totals === undefined) {
      return row;
    }
    return {
      ...row,
      totalVotesAbstain: row.totalVotesAbstain ?? totals.abstain,
      totalVotesAgainst: row.totalVotesAgainst ?? totals.against,
      totalVotesFor: row.totalVotesFor ?? totals.for,
    };
  });

const fetchPositionVotesForMeeting = async (meetingId: string): Promise<unknown[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
  const response = await fetch(
    `${baseUrl}/position_votes?meetingId=${encodeURIComponent(meetingId)}&limit=10000`,
  );
  if (!response.ok) {
    return [];
  }
  const data: unknown = await response.json();
  return asArray(data);
};

interface ReviewFormState {
  checklist: ChecklistState;
  editedRows: Record<string, ProposalRow>;
}

interface SaveState {
  outcome: ReviewSaveOutcome;
  saving: boolean;
}

const initialFormFor = (item: ReviewQueueItem): ReviewFormState => ({
  checklist: {
    brokerNonVotes: item.review?.checklist?.brokerNonVotes === true,
    proposalClassification: item.review?.checklist?.proposalClassification === true,
    voteCategories: item.review?.checklist?.voteCategories === true,
  },
  editedRows: {},
});

export interface UseTabulationReportReviewResult {
  allChecked: boolean;
  checklist: ChecklistState;
  confirmOpen: boolean;
  dirtyCount: number;
  isFinalReport: boolean;
  onCancelConfirm: () => void;
  onConfirmVerify: () => void;
  onReopen: () => void;
  onRequestVerify: () => void;
  onRowUpdate: (newRow: ProposalRow, oldRow: ProposalRow) => ProposalRow;
  onSaveAdjustments: () => void;
  onToggleChecklist: (key: keyof ChecklistState, isChecked: boolean) => void;
  originalRows: ProposalRow[];
  proposalsLoading: boolean;
  rows: ProposalRow[];
  saveOutcome: ReviewSaveOutcome;
  saving: boolean;
}

/**
 * Owns all state and API calls for reviewing a single tabulation report:
 * the editable proposals grid, the verification checklist, and the
 * save/verify persistence flow. Pass `null` when nothing is selected yet.
 *
 * Form state re-initializes whenever `item` changes to a different meeting,
 * using the React-endorsed "adjust state during render" pattern rather than
 * an effect (see https://react.dev/learn/you-might-not-need-an-effect).
 */
export const useTabulationReportReview = (
  item: ReviewQueueItem | null,
  onPersisted: (meetingId: string, review: TabulationReview) => Promise<void>,
): UseTabulationReportReviewResult => {
  const { data: session } = useSession();

  const [formOwnerId, setFormOwnerId] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewFormState>({
    checklist: {
      brokerNonVotes: false,
      proposalClassification: false,
      voteCategories: false,
    },
    editedRows: {},
  });
  const [saveState, setSaveState] = useState<SaveState>({
    outcome: null,
    saving: false,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (item !== null && item.meetingId !== formOwnerId) {
    setFormOwnerId(item.meetingId);
    setForm(initialFormFor(item));
    setSaveState({ outcome: null, saving: false });
    setConfirmOpen(false);
  } else if (item === null && formOwnerId !== null) {
    setFormOwnerId(null);
  }

  const proposalsKey =
    item === null ? null : (["/tabulation-review-proposals", item.meetingId] as const);
  const {
    data: fetchedRows,
    isLoading: proposalsLoading,
    mutate: revalidateProposalRows,
  } = useSWR(proposalsKey, async ([, meetingId]) => {
    const api = await buildApiClient();
    const [proposalsResult, positionVotes, tabulationReportResult] = await Promise.all([
      api.GET("/meetings/{meetingId}/proposals", {
        params: { path: { meetingId } },
      }),
      fetchPositionVotesForMeeting(meetingId),
      api.GET("/meetings/{meetingId}/tabulation-report", {
        params: { path: { meetingId } },
      }),
    ]);
    const saved = item === null ? {} : savedClassificationsOf(item);
    const raw: unknown[] = Array.isArray(proposalsResult.data) ? proposalsResult.data : [];
    const voteTotalsByProposal = buildPositionVoteTotals(positionVotes);
    const brokerVotingTotals = buildBrokerVotingTotals(tabulationReportResult.data);
    return applyBrokerVotingFallback(
      sortProposalRows(
        removeDirectorParentRows(
          raw.flatMap((entry) =>
            normalizeProposalRows(entry, saved, voteTotalsByProposal, item?.brokerNonVote ?? null),
          ),
        ),
      ),
      brokerVotingTotals,
    );
  });

  const originalRows = fetchedRows ?? [];
  const rows = originalRows.map((row) => form.editedRows[row.id] ?? row);
  const dirtyCount = Object.keys(form.editedRows).length;
  const isFinalReport = item?.checkpoint === "FINAL_REPORT";
  const isAllChecked = checklistKeys.every((key) => form.checklist[key]);

  const onRowUpdate = (newRow: ProposalRow, oldRow: ProposalRow): ProposalRow => {
    if (JSON.stringify(newRow) !== JSON.stringify(oldRow)) {
      const originalRow = originalRows.find((row) => row.id === newRow.id);
      setForm((previous) => ({
        ...previous,
        editedRows:
          originalRow !== undefined && JSON.stringify(newRow) === JSON.stringify(originalRow)
            ? Object.fromEntries(
                Object.entries(previous.editedRows).filter(([rowId]) => rowId !== newRow.id),
              )
            : { ...previous.editedRows, [newRow.id]: newRow },
      }));
    }
    return newRow;
  };

  const onToggleChecklist = (key: keyof ChecklistState, isChecked: boolean) => {
    setForm((previous) => ({
      ...previous,
      checklist: { ...previous.checklist, [key]: isChecked },
    }));
  };

  const saveProposalEdits = async (
    api: Awaited<ReturnType<typeof buildApiClient>>,
  ): Promise<void> => {
    await Promise.all(
      Object.values(form.editedRows).map(
        async (row) =>
          await api.PUT("/proposals/{id}", {
            body: {
              brokerNonVotes: row.brokerNonVotes,
              totalVotesAbstain: row.totalVotesAbstain,
              totalVotesAgainst: row.totalVotesAgainst,
              totalVotesFor: row.totalVotesFor,
            },
            params: { path: { id: row.id } },
          }),
      ),
    );
  };

  const buildReviewPayload = (
    reportItem: ReviewQueueItem,
    status: ReviewStatus,
  ): TabulationReview => {
    const reviewedBy = session?.user?.name ?? session?.user?.username ?? "CSM";
    const isVerifying = status === "VERIFIED";
    const now = new Date();
    return {
      checklist: form.checklist,
      checkpoint: reportItem.checkpoint,
      note: reportItem.review?.note ?? null,
      proposalClassifications: Object.fromEntries(rows.map((row) => [row.id, row.classification])),
      reviewedAt: isVerifying ? now.toISOString() : null,
      reviewedBy: isVerifying ? reviewedBy : null,
      status,
    };
  };

  const runPersist = async (reportItem: ReviewQueueItem, status: ReviewStatus): Promise<void> => {
    const api = await buildApiClient();
    const reviewPayload = buildReviewPayload(reportItem, status);
    await saveProposalEdits(api);
    await api.PUT("/meetings/{meetingId}", {
      body: { tabulationReview: reviewPayload },
      params: { path: { meetingId: reportItem.meetingId } },
    });
    await revalidateProposalRows();
    setForm((previous) => ({ ...previous, editedRows: {} }));
    setSaveState({ outcome: "saved", saving: false });
    setConfirmOpen(false);
    await onPersisted(reportItem.meetingId, reviewPayload);
  };

  const persist = async (status: ReviewStatus): Promise<void> => {
    if (item === null) {
      return;
    }
    setSaveState({ outcome: null, saving: true });
    try {
      await runPersist(item, status);
    } catch {
      setSaveState({ outcome: "error", saving: false });
    }
  };

  return {
    allChecked: isAllChecked,
    checklist: form.checklist,
    confirmOpen,
    dirtyCount,
    isFinalReport,
    onCancelConfirm: () => {
      if (!saveState.saving) {
        setConfirmOpen(false);
      }
    },
    onConfirmVerify: () => {
      void persist("VERIFIED");
    },
    onReopen: () => {
      void persist("PENDING_REVIEW");
    },
    onRequestVerify: () => {
      setConfirmOpen(true);
    },
    onRowUpdate,
    onSaveAdjustments: () => {
      void persist("PENDING_REVIEW");
    },
    onToggleChecklist,
    originalRows,
    proposalsLoading,
    rows,
    saveOutcome: saveState.outcome,
    saving: saveState.saving,
  };
};
