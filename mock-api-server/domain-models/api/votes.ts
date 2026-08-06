import { randomUUID } from "node:crypto";

import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";
import { asRecord, asString } from "@/utils/typeUtils";

// Use generated types from OpenAPI schema
type PositionVote = components["schemas"]["PositionVote"];
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

const nullToUndefined = <T>(value: T | null): T | undefined =>
  value === null ? undefined : value;

const normalizeFilterValue = (value?: string): string | undefined => {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }
  return value.trim();
};

const parseInFilter = (value?: string): string[] | null => {
  if (
    value === undefined ||
    !value.startsWith("in.(") ||
    !value.endsWith(")")
  ) {
    return null;
  }

  const values = value
    .slice(4, -1)
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return values.length > 0 ? values : null;
};

const parseEqFilter = (value: string): string =>
  value.startsWith("eq.") ? value.slice(3) : value;

const transformPositionVote = (row: PositionVoteRow): PositionVote => ({
  id: nullToUndefined(row.id),
  positionId: nullToUndefined(row.position_id),
  proposalId: nullToUndefined(row.proposal_id),
  vote: nullToUndefined(row.vote),
  sharesVoting: nullToUndefined(row.shares_voting),
  createdAt: nullToUndefined(row.created_at),
});

const buildBasePositionVoteQuery = () =>
  supabase.from("position_vote").select("*");
type PositionVoteQuery = ReturnType<typeof buildBasePositionVoteQuery>;

const applyEqOrInFilter = (
  query: PositionVoteQuery,
  column: "position_id" | "proposal_id" | "vote",
  rawValue: string
): PositionVoteQuery => {
  const values = parseInFilter(rawValue);
  return values === null
    ? query.eq(column, parseEqFilter(rawValue))
    : query.in(column, values);
};

interface PositionVoteListOptions {
  meetingId?: string;
  positionId?: string;
  proposalId?: string;
  vote?: string;
  limit?: number;
  offset?: number;
  order?: string;
}

const applyPositionVoteFilters = (
  initialQuery: PositionVoteQuery,
  options: PositionVoteListOptions | undefined
): PositionVoteQuery => {
  let query = initialQuery;

  const positionId = normalizeFilterValue(options?.positionId);
  if (positionId !== undefined) {
    query = applyEqOrInFilter(query, "position_id", positionId);
  }

  const proposalId = normalizeFilterValue(options?.proposalId);
  if (proposalId !== undefined) {
    query = applyEqOrInFilter(query, "proposal_id", proposalId);
  }

  const vote = normalizeFilterValue(options?.vote);
  if (vote !== undefined) {
    query = applyEqOrInFilter(query, "vote", vote);
  }

  return query;
};

const ORDER_COLUMN_ALIASES: Record<string, string> = {
  createdAt: "created_at",
  positionId: "position_id",
  proposalId: "proposal_id",
  sharesVoting: "shares_voting",
};

const applyPositionVoteOrder = (
  query: PositionVoteQuery,
  order: string | undefined
): PositionVoteQuery => {
  if (order === undefined) {
    return query.order("created_at", { ascending: false });
  }
  const [column, direction] = order.split(".");
  const normalizedColumn = ORDER_COLUMN_ALIASES[column] ?? column;
  return query.order(normalizedColumn, { ascending: direction !== "desc" });
};

const applyPositionVotePage = (
  query: PositionVoteQuery,
  limit: number | undefined,
  offset: number | undefined
): PositionVoteQuery => {
  if (limit === undefined) {
    return query.limit(1000);
  }
  const resolvedOffset = offset ?? 0;
  return resolvedOffset > 0
    ? query.range(resolvedOffset, resolvedOffset + limit - 1)
    : query.limit(limit);
};

const jsonResponse = (statusCode: number): Response =>
  new Response(null, { status: statusCode });

const resolveMeetingPositionIds = async (
  meetingId: string
): Promise<{ ids: string[] | null; errorMessage: string | null }> => {
  const { data, error } = await supabase
    .from("position")
    .select("id")
    .eq("meeting_id", meetingId)
    .limit(5000);

  if (error !== null) {
    return {
      ids: null,
      errorMessage: error.message ?? "Failed to fetch meeting positions",
    };
  }

  const ids = (data ?? [])
    .map((position) => position.id)
    .filter(
      (positionId): positionId is string =>
        positionId !== null && positionId.length > 0
    );

  return { ids, errorMessage: null };
};

export const listPositionVotes = async (
  options?: PositionVoteListOptions
): Promise<ApiResponse<PositionVote[] | undefined>> => {
  let meetingPositionIds: string[] | null = null;
  if (options?.meetingId !== undefined) {
    const resolved = await resolveMeetingPositionIds(options.meetingId);
    if (resolved.errorMessage !== null) {
      return {
        error: { message: resolved.errorMessage, statusCode: 500 },
        response: jsonResponse(500),
      };
    }
    if (resolved.ids === null || resolved.ids.length === 0) {
      return { data: [], response: jsonResponse(200) };
    }
    meetingPositionIds = resolved.ids;
  }

  let query = buildBasePositionVoteQuery();
  if (meetingPositionIds !== null) {
    query = query.in("position_id", meetingPositionIds);
  }
  query = applyPositionVoteFilters(query, options);
  query = applyPositionVoteOrder(query, options?.order);
  query = applyPositionVotePage(query, options?.limit, options?.offset);

  let outcome: Awaited<typeof query>;
  try {
    outcome = await query;
  } catch (caughtError) {
    return {
      error: {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
        message: Error.isError(caughtError)
          ? caughtError.message
          : "Failed to fetch position votes",
        statusCode: 500,
      },
      response: jsonResponse(500),
    };
  }

  if (outcome.error !== null) {
    return {
      error: {
        message: outcome.error.message ?? "Failed to fetch position votes",
        statusCode: 500,
      },
      response: jsonResponse(500),
    };
  }

  return {
    data: (outcome.data ?? []).map(transformPositionVote),
    response: jsonResponse(200),
  };
};

interface CastVoteFields {
  positionId: string;
  proposalId: string;
  vote: string;
  sharesVoting: string;
}

/**
 * Reads and validates the fields `position_vote` needs off an unvalidated
 * request body. The OpenAPI `CastVoteRequest` omits `positionId`, but the
 * insert requires it, so the whole payload is read defensively here rather
 * than trusting a blind cast to the generated type.
 */
const readCastVoteFields = (body: unknown): CastVoteFields | null => {
  const record = asRecord(body);
  if (record === null) {
    return null;
  }

  const positionId = asString(record.positionId);
  const proposalId = asString(record.proposalId);
  const vote = asString(record.vote);
  const sharesVoting = asString(record.sharesVoting);

  if (
    positionId === null ||
    proposalId === null ||
    vote === null ||
    sharesVoting === null
  ) {
    return null;
  }

  return { positionId, proposalId, vote, sharesVoting };
};

/**
 * Records a vote cast by a position against a proposal.
 *
 * @param body - A `CastVoteRequest` plus the `positionId` the vote belongs to
 * @returns The stored vote, or a 400 error when required fields are missing or the insert fails
 */
export const createPositionVote = async (
  body: unknown
): Promise<ApiResponse<PositionVote>> => {
  const fields = readCastVoteFields(body);

  if (fields === null) {
    return {
      error: {
        message: "positionId, proposalId, vote, and sharesVoting are required",
        statusCode: 400,
      },
      response: jsonResponse(400),
    };
  }

  const now = new Date();
  const { data, error } = await supabase
    .from("position_vote")
    .insert({
      id: randomUUID(),
      position_id: fields.positionId,
      proposal_id: fields.proposalId,
      vote: fields.vote,
      shares_voting: fields.sharesVoting,
      created_at: now.toISOString(),
    })
    .select()
    .single();

  if (error !== null) {
    return {
      error: {
        message: error.message ?? "Failed to create position vote",
        statusCode: 400,
      },
      response: jsonResponse(400),
    };
  }

  return {
    data: transformPositionVote(data),
    response: jsonResponse(201),
  };
};
