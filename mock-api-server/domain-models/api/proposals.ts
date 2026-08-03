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
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

function transformProposalRow(row: ProposalRow): Proposal {
  return {
    id: nullToUndefined(row.id),
    proposalNumber: nullToUndefined(row.proposal_number),
    proposalTitle: nullToUndefined(row.proposal_title),
    directorName: nullToUndefined(row.director_name),
    proposalType: nullToUndefined(row.proposal_type),
    proposalSubtype: nullToUndefined(row.proposal_subtype),
    directorTermYears: nullToUndefined(row.director_term_years),
    directorClass: nullToUndefined(row.director_class),
    termExpirationYear: nullToUndefined(row.term_expiration_year),
    frequencyOptions: nullToUndefined(row.frequency_options as Record<string, never>),
    recommendation: nullToUndefined(row.recommendation),
    meetingId: nullToUndefined(row.meeting_id),
    totalVotesFor: nullToUndefined(row.total_votes_for),
    totalVotesAgainst: nullToUndefined(row.total_votes_against),
    totalVotesAbstain: nullToUndefined(row.total_votes_abstain),
    brokerNonVotes: nullToUndefined(row.broker_non_votes),
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
  };
}

// Helper type for consistent response format
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

export async function listProposals(
  meetingId: string,
  proposalType?: string,
): Promise<ApiResponse<Proposal[]>> {
  try {
    let query = supabase.from("proposal").select("*").eq("meeting_id", meetingId);

    if (proposalType) {
      query = query.eq("proposal_type", proposalType);
    }

    const { data, error } = await query;

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message ?? "Failed to fetch proposals",
          statusCode: 500,
        },
      };
    }

    // Transform database rows to API response format
    const proposals = (data ?? []).map(transformProposalRow);

    return {
      data: proposals,
      error: undefined,
    };
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: Error.isError(error) ? error.message : "Unknown error",
        statusCode: 500,
      },
    };
  }
}

export async function createProposal(
  meetingId: string,
  body: CreateProposalRequest,
): Promise<ApiResponse<Proposal>> {
  try {
    const request = body;
    const { data, error } = await supabase
      .from("proposal")
      .insert({
        id: randomUUID(),
        meeting_id: meetingId,
        proposal_number: request.proposalNumber,
        proposal_title: request.proposalTitle,
        proposal_type: request.proposalType,
        proposal_subtype: request.proposalSubtype,
        director_name: request.directorName,
        director_term_years: request.directorTermYears,
        director_class: request.directorClass,
        term_expiration_year: request.termExpirationYear,
        frequency_options: request.frequencyOptions,
        recommendation: request.recommendation,
        voting_completed: false,
      })
      .select()
      .single();

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message ?? "Failed to create proposal",
          statusCode: 400,
        },
      };
    }

    // Transform database row to API response format
    return {
      data: transformProposalRow(data),
      error: undefined,
    };
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: Error.isError(error) ? error.message : "Unknown error",
        statusCode: 500,
      },
    };
  }
}

export async function getProposalById(id: string): Promise<ApiResponse<Proposal>> {
  try {
    const { data, error } = await supabase.from("proposal").select("*").eq("id", id).single();

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message ?? "Failed to fetch proposal",
          statusCode: 404,
        },
      };
    }

    // Transform database row to API response format
    return {
      data: transformProposalRow(data),
      error: undefined,
    };
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: Error.isError(error) ? error.message : "Unknown error",
        statusCode: 500,
      },
    };
  }
}

export async function updateProposal(
  id: string,
  body: UpdateProposalRequest,
): Promise<ApiResponse<Proposal>> {
  try {
    const request = body;
    const updateData: Partial<ProposalUpdate> = {};
    if (request.proposalTitle !== undefined) {
      updateData.proposal_title = request.proposalTitle;
    }
    if (request.proposalType !== undefined) {
      updateData.proposal_type = request.proposalType;
    }
    if (request.proposalSubtype !== undefined) {
      updateData.proposal_subtype = request.proposalSubtype;
    }
    if (request.directorName !== undefined) {
      updateData.director_name = request.directorName;
    }
    if (request.directorTermYears !== undefined) {
      updateData.director_term_years = request.directorTermYears;
    }
    if (request.directorClass !== undefined) {
      updateData.director_class = request.directorClass;
    }
    if (request.termExpirationYear !== undefined) {
      updateData.term_expiration_year = request.termExpirationYear;
    }
    if (request.frequencyOptions !== undefined) {
      updateData.frequency_options = request.frequencyOptions;
    }
    if (request.recommendation !== undefined) {
      updateData.recommendation = request.recommendation;
    }
    if (request.totalVotesFor !== undefined) {
      updateData.total_votes_for = request.totalVotesFor;
    }
    if (request.totalVotesAgainst !== undefined) {
      updateData.total_votes_against = request.totalVotesAgainst;
    }
    if (request.totalVotesAbstain !== undefined) {
      updateData.total_votes_abstain = request.totalVotesAbstain;
    }
    if (request.brokerNonVotes !== undefined) {
      updateData.broker_non_votes = request.brokerNonVotes;
    }

    const { data, error } = await supabase
      .from("proposal")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message ?? "Failed to update proposal",
          statusCode: 400,
        },
      };
    }

    // Transform database row to API response format
    return {
      data: transformProposalRow(data),
      error: undefined,
    };
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: Error.isError(error) ? error.message : "Unknown error",
        statusCode: 500,
      },
    };
  }
}
