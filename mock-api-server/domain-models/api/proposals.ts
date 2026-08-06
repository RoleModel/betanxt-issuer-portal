import { randomUUID } from "node:crypto";

import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";

// Use generated types from OpenAPI schema
type Proposal = components["schemas"]["Proposal"];
type CreateProposalRequest = components["schemas"]["CreateProposalRequest"];
type UpdateProposalRequest = components["schemas"]["UpdateProposalRequest"];
type ProposalRow = Database["public"]["Tables"]["proposal"]["Row"];
type ProposalUpdate = Database["public"]["Tables"]["proposal"]["Update"];

// Helper function to convert null to undefined
const nullToUndefined = <T>(value: T | null): T | undefined =>
  value === null ? undefined : value;

// `types/api.ts` and `utils/supabase/database.types.ts` are excluded from
// ESLint's typed-linting program, so the linter's own type resolution for
// their fields here falls back to an error type that reads as `any` —
// `tsc --noEmit` has no issue with any of this.
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const transformProposalRow = (row: ProposalRow): Proposal => ({
  id: nullToUndefined(row.id),
  proposalNumber: nullToUndefined(row.proposal_number),
  proposalTitle: nullToUndefined(row.proposal_title),
  directorName: nullToUndefined(row.director_name),
  proposalType: nullToUndefined(row.proposal_type),
  proposalSubtype: nullToUndefined(row.proposal_subtype),
  directorTermYears: nullToUndefined(row.director_term_years),
  directorClass: nullToUndefined(row.director_class),
  termExpirationYear: nullToUndefined(row.term_expiration_year),
  frequencyOptions: row.frequency_options === null ? undefined : {},
  recommendation: nullToUndefined(row.recommendation),
  meetingId: nullToUndefined(row.meeting_id),
  totalVotesFor: nullToUndefined(row.total_votes_for),
  totalVotesAgainst: nullToUndefined(row.total_votes_against),
  totalVotesAbstain: nullToUndefined(row.total_votes_abstain),
  totalSharesEligible: nullToUndefined(row.total_shares_eligible),
  forPercentage: nullToUndefined(row.for_percentage),
  againstPercentage: nullToUndefined(row.against_percentage),
  abstainPercentage: nullToUndefined(row.abstain_percentage),
  participationRate: nullToUndefined(row.participation_rate),
  finalResult: nullToUndefined(row.final_result),
  votingCompleted: row.voting_completed || false,
  votingCompletedAt: nullToUndefined(row.voting_completed_at),
  createdAt: nullToUndefined(row.created_at),
  updatedAt: nullToUndefined(row.updated_at),
});
/* eslint-enable @typescript-eslint/strict-boolean-expressions */

// Helper type for consistent response format
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

// Runs a Supabase operation with the try/catch isolated to this one spot, so
// callers can branch on the outcome without nesting a conditional inside
// their own try block (unicorn/try-complexity flags any branch inside try).
type QueryOutcome<T> = { ok: true; data: T } | { ok: false; message: string };

const runQuery = async <T>(
  operation: () => Promise<{
    data: T | null;
    error: { message: string } | null;
  }>,
  fallbackMessage: string
): Promise<QueryOutcome<T>> => {
  let outcome: { data: T | null; error: { message: string } | null };
  try {
    outcome = await operation();
  } catch (caughtError) {
    return {
      ok: false,
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
      message: Error.isError(caughtError)
        ? caughtError.message
        : fallbackMessage,
    };
  }

  if (outcome.error !== null) {
    return { ok: false, message: outcome.error.message };
  }
  if (outcome.data === null) {
    return { ok: false, message: fallbackMessage };
  }
  return { ok: true, data: outcome.data };
};

export const listProposals = async (
  meetingId: string,
  proposalType?: string
): Promise<ApiResponse<Proposal[]>> => {
  let query = supabase.from("proposal").select("*").eq("meeting_id", meetingId);
  if (proposalType !== undefined) {
    query = query.eq("proposal_type", proposalType);
  }

  const result = await runQuery(async () => {
    const { data, error } = await query;
    return { data: data ?? [], error };
  }, "Failed to fetch proposals");

  if (!result.ok) {
    return { error: { message: result.message, statusCode: 500 } };
  }
  return { data: result.data.map(transformProposalRow) };
};

export const createProposal = async (
  meetingId: string,
  body: CreateProposalRequest
): Promise<ApiResponse<Proposal>> => {
  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("proposal")
      .insert({
        id: randomUUID(),
        meeting_id: meetingId,
        proposal_number: body.proposalNumber,
        proposal_title: body.proposalTitle,
        proposal_type: body.proposalType,
        proposal_subtype: body.proposalSubtype,
        director_name: body.directorName,
        director_term_years: body.directorTermYears,
        director_class: body.directorClass,
        term_expiration_year: body.termExpirationYear,
        frequency_options: body.frequencyOptions,
        recommendation: body.recommendation,
        voting_completed: false,
      })
      .select()
      .single();
    return { data, error };
  }, "Failed to create proposal");

  if (!result.ok) {
    return { error: { message: result.message, statusCode: 400 } };
  }
  return { data: transformProposalRow(result.data) };
};

export const getProposalById = async (
  id: string
): Promise<ApiResponse<Proposal>> => {
  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("proposal")
      .select("*")
      .eq("id", id)
      .single();
    return { data, error };
  }, "Failed to fetch proposal");

  if (!result.ok) {
    return { error: { message: result.message, statusCode: 404 } };
  }
  return { data: transformProposalRow(result.data) };
};

export const updateProposal = async (
  id: string,
  body: UpdateProposalRequest
): Promise<ApiResponse<Proposal>> => {
  const updateData: Partial<ProposalUpdate> = {};
  if (body.proposalTitle !== undefined) {
    updateData.proposal_title = body.proposalTitle;
  }
  if (body.proposalType !== undefined) {
    updateData.proposal_type = body.proposalType;
  }
  if (body.proposalSubtype !== undefined) {
    updateData.proposal_subtype = body.proposalSubtype;
  }
  if (body.directorName !== undefined) {
    updateData.director_name = body.directorName;
  }
  if (body.directorTermYears !== undefined) {
    updateData.director_term_years = body.directorTermYears;
  }
  if (body.directorClass !== undefined) {
    updateData.director_class = body.directorClass;
  }
  if (body.termExpirationYear !== undefined) {
    updateData.term_expiration_year = body.termExpirationYear;
  }
  if (body.frequencyOptions !== undefined) {
    updateData.frequency_options = body.frequencyOptions;
  }
  if (body.recommendation !== undefined) {
    updateData.recommendation = body.recommendation;
  }

  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("proposal")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  }, "Failed to update proposal");

  if (!result.ok) {
    return { error: { message: result.message, statusCode: 400 } };
  }
  return { data: transformProposalRow(result.data) };
};
