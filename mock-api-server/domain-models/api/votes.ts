import { apiClient } from "../apiClient";
import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";

// Use generated types from OpenAPI schema
type PositionVote = components["schemas"]["PositionVote"];
type CastVoteRequest = components["schemas"]["CastVoteRequest"];
type PositionVoteRow = Database["public"]["Tables"]["position_vote"]["Row"];

// Helper type for openapi-fetch response
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
  response: Response;
}

function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

function normalizeFilterValue(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.trim();
}

function parseInFilter(value?: string): string[] | null {
  if (!value?.startsWith("in.(") || !value.endsWith(")")) {
    return null;
  }

  const values = value
    .slice(4, -1)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : null;
}

function parseEqFilter(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.startsWith("eq.") ? value.slice(3) : value;
}

function transformPositionVote(row: PositionVoteRow): PositionVote {
  return {
    id: nullToUndefined(row.id),
    positionId: nullToUndefined(row.position_id),
    proposalId: nullToUndefined(row.proposal_id),
    vote: nullToUndefined(row.vote),
    sharesVoting: nullToUndefined(row.shares_voting),
    createdAt: nullToUndefined(row.created_at),
  };
}

export async function listPositionVotes(options?: {
  meetingId?: string;
  positionId?: string;
  proposalId?: string;
  vote?: string;
  limit?: number;
  offset?: number;
  order?: string;
}): Promise<ApiResponse<PositionVote[] | undefined>> {
  try {
    let query = supabase.from("position_vote").select("*");

    if (options?.meetingId) {
      const { data: meetingPositions, error: meetingPositionsError } =
        await supabase
          .from("position")
          .select("id")
          .eq("meeting_id", options.meetingId)
          .limit(5000);

      if (meetingPositionsError) {
        return {
          data: undefined,
          error: {
            message:
              meetingPositionsError.message ??
              "Failed to fetch meeting positions",
            statusCode: 500,
          },
          response: new Response(null, { status: 500 }),
        };
      }

      const meetingPositionIds = (meetingPositions ?? [])
        .map((position) => position.id)
        .filter((positionId): positionId is string => Boolean(positionId));

      if (meetingPositionIds.length === 0) {
        return {
          data: [],
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }

      query = query.in("position_id", meetingPositionIds);
    }

    const positionId = normalizeFilterValue(options?.positionId);
    const proposalId = normalizeFilterValue(options?.proposalId);
    const vote = normalizeFilterValue(options?.vote);

    if (positionId) {
      const positionIds = parseInFilter(positionId);
      query = positionIds
        ? query.in("position_id", positionIds)
        : query.eq("position_id", parseEqFilter(positionId) || positionId);
    }

    if (proposalId) {
      const proposalIds = parseInFilter(proposalId);
      query = proposalIds
        ? query.in("proposal_id", proposalIds)
        : query.eq("proposal_id", parseEqFilter(proposalId) || proposalId);
    }

    if (vote) {
      const votes = parseInFilter(vote);
      query = votes
        ? query.in("vote", votes)
        : query.eq("vote", parseEqFilter(vote) || vote);
    }

    if (options?.order) {
      const [column, direction] = options.order.split(".");
      const normalizedColumn =
        column === "createdAt"
          ? "created_at"
          : column === "positionId"
            ? "position_id"
            : column === "proposalId"
              ? "proposal_id"
              : column === "sharesVoting"
                ? "shares_voting"
                : column;

      query = query.order(normalizedColumn, {
        ascending: direction !== "desc",
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    if (options?.limit) {
      const offset = options.offset ?? 0;
      query =
        offset > 0
          ? query.range(offset, offset + options.limit - 1)
          : query.limit(options.limit);
    } else {
      query = query.limit(1000);
    }

    const { data, error } = await query;

    if (error) {
      return {
        data: undefined,
        error: {
          message: error.message ?? "Failed to fetch position votes",
          statusCode: 500,
        },
        response: new Response(null, { status: 500 }),
      };
    }

    return {
      data: (data ?? []).map(transformPositionVote),
      error: undefined,
      response: new Response(null, { status: 200 }),
    };
  } catch (error) {
    return {
      data: undefined,
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to fetch position votes",
        statusCode: 500,
      },
      response: new Response(null, { status: 500 }),
    };
  }
}

export async function createPositionVote(
  body: unknown
): Promise<ApiResponse<PositionVote>> {
  const { data, error, response } = await apiClient.POST("/position_votes", {
    body: body as CastVoteRequest,
  });

  if (error) {
    return {
      data: undefined,
      error: {
        message: error.message ?? "Failed to create position vote",
        statusCode: response.status,
      },
      response,
    };
  }

  return {
    data,
    error: undefined,
    response,
  };
}
