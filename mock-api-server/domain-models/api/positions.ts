import { randomUUID } from "crypto";

import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { refreshTabulationReportFromPositions } from "@/domain-models/api/tabulationReports";
import { supabase } from "@/utils/supabase/client";

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

// Use generated types from OpenAPI schema
type Position = components["schemas"]["Position"];
type CreatePositionRequest = components["schemas"]["CreatePositionRequest"];
type UpdatePositionRequest = components["schemas"]["UpdatePositionRequest"];
type PositionRow = Database["public"]["Tables"]["position"]["Row"];
type PositionUpdate = Database["public"]["Tables"]["position"]["Update"];

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

/**
 * Transforms a snake_case `position` database row into the camelCase OpenAPI
 * `Position` shape.
 *
 * The holder-enrichment fields added for 002-tabulation-enhancements
 * (`holderCategory`, `state`, `country`) are passed through as-is — including
 * `null` — because the API schema models them as nullable, letting clients
 * distinguish "unknown" from absent.
 *
 * @param dbPosition - Raw Supabase position row
 * @returns The API-shaped position
 */
function transformPosition(dbPosition: PositionRow): Position {
  return {
    id: dbPosition.id ?? "",
    meetingId: nullToUndefined(dbPosition.meeting_id),
    cusip: nullToUndefined(dbPosition.cusip),
    accountType: nullToUndefined(dbPosition.account_type),
    setKey: nullToUndefined(dbPosition.set_key),
    name: nullToUndefined(dbPosition.name),
    accountNumber: nullToUndefined(dbPosition.account_number),
    controlNumber: nullToUndefined(dbPosition.control_number),
    voteStatus: nullToUndefined(dbPosition.vote_status),
    shares: nullToUndefined(dbPosition.shares),
    sharesVoted: nullToUndefined(dbPosition.shares_voted),
    source: nullToUndefined(dbPosition.source),
    dateVoted: nullToUndefined(dbPosition.date_voted),
    holderCategory: dbPosition.holder_category,
    state: dbPosition.state,
    country: dbPosition.country,
    createdAt: nullToUndefined(dbPosition.created_at),
    updatedAt: nullToUndefined(dbPosition.updated_at),
  };
}

/**
 * Lists positions with optional meeting/vote-status filters, pagination, and
 * ordering. Rows are mapped through {@link transformPosition}, so responses
 * include the holder-category and geography enrichment fields.
 *
 * @param params - Optional filters and pagination (defaults to the first 1000 rows)
 * @returns `{ positions }` wrapped in the standard API response envelope
 */
export async function listPositions(params?: {
  meetingId?: string;
  cusip?: string;
  accountType?: string;
  voteStatus?: Position["voteStatus"];
  page?: number;
  limit?: number;
  order?: string;
  offset?: number;
  select?: string;
}): Promise<ApiResponse<{ positions: Position[] }>> {
  try {
    let query = supabase.from("position").select("*");

    // Apply filters
    if (params?.meetingId) {
      query = query.eq("meeting_id", params.meetingId);
    }
    if (params?.voteStatus) {
      query = query.eq("vote_status", params.voteStatus);
    }

    // Apply pagination
    if (params?.limit) {
      // Supabase range() has internal limits, so we need to be careful
      // For limits up to 1000, range works fine
      // For higher limits, we should use limit() directly
      const offset = params?.offset ?? 0;
      if (params.limit <= 1000 && offset === 0) {
        query = query.limit(params.limit);
      } else if (offset > 0) {
        query = query.range(offset, offset + params.limit - 1);
      } else {
        // For large limits without offset, use limit directly
        query = query.limit(params.limit);
      }
    } else {
      // No limit specified - use default of 1000
      query = query.limit(1000);
    }

    // Apply ordering
    if (params?.order) {
      const [column, direction] = params.order.split(".");
      query = query.order(column, { ascending: direction !== "desc" });
    }

    const { data, error } = await query;

    if (error) {
      return {
        error: { message: error.message ?? "Failed to fetch positions" },
      };
    }

    return {
      data: {
        positions: data.map(transformPosition),
      },
    };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Failed to fetch positions",
      },
    };
  }
}

export async function createPosition(body: CreatePositionRequest): Promise<ApiResponse<Position>> {
  try {
    const request = body;
    const { data, error } = await supabase
      .from("position")
      .insert({
        id: randomUUID(),
        meeting_id: request.meetingId,
        cusip: request.cusip,
        account_type: request.accountType,
        set_key: request.setKey,
        name: request.name,
        account_number: request.accountNumber,
        control_number: request.controlNumber,
        vote_status: request.voteStatus,
        shares: request.shares,
        shares_voted: request.sharesVoted ?? 0,
        source: request.source,
        date_voted: request.dateVoted,
      })
      .select()
      .single();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to create position" },
      };
    }

    return {
      data: transformPosition(data),
    };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Failed to create position",
      },
    };
  }
}

export async function getPositionById(id: string): Promise<ApiResponse<Position>> {
  try {
    const { data, error } = await supabase.from("position").select("*").eq("id", id).single();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to fetch position" },
      };
    }

    return {
      data: transformPosition(data),
    };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Failed to fetch position",
      },
    };
  }
}

export async function updatePosition(
  id: string,
  body: UpdatePositionRequest,
): Promise<ApiResponse<Position>> {
  try {
    const request = body;
    const updateData: Partial<PositionUpdate> = {};
    if (request.name !== undefined) updateData.name = request.name;
    if (request.accountNumber !== undefined) updateData.account_number = request.accountNumber;
    if (request.controlNumber !== undefined) updateData.control_number = request.controlNumber;
    if (request.shares !== undefined) updateData.shares = request.shares;
    if (request.sharesVoted !== undefined) updateData.shares_voted = request.sharesVoted;
    if (request.voteStatus !== undefined) updateData.vote_status = request.voteStatus;
    if (request.source !== undefined) updateData.source = request.source;
    if (request.dateVoted !== undefined) updateData.date_voted = request.dateVoted;

    const { data, error } = await supabase
      .from("position")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to update position" },
      };
    }

    const updated = transformPosition(data);

    // Keep the tabulation report's voted-share summary in sync
    if (updated.meetingId) {
      await refreshTabulationReportFromPositions(updated.meetingId);
    }

    return { data: updated };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Failed to update position",
      },
    };
  }
}
