import { randomUUID } from "node:crypto";

import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";
import { asLiteral } from "@/utils/typeUtils";

// Helper function to convert null to undefined
const nullToUndefined = <T>(value: T | null): T | undefined =>
  value === null ? undefined : value;

// Use generated types from OpenAPI schema
type Phase = components["schemas"]["Phase"];
type CreatePhaseRequest = components["schemas"]["CreatePhaseRequest"];
type UpdatePhaseRequest = components["schemas"]["UpdatePhaseRequest"];
type PhaseRow = Database["public"]["Tables"]["phase"]["Row"];
type PhaseUpdate = Database["public"]["Tables"]["phase"]["Update"];

const phaseStatuses = ["IN_PROGRESS", "COMPLETE"] as const;

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

// Transform snake_case database fields to camelCase API fields
const transformPhase = (databasePhase: PhaseRow): Phase => ({
  id: databasePhase.id ?? "",
  meetingId: nullToUndefined(databasePhase.meeting_id),
  name: nullToUndefined(databasePhase.name),
  orderIndex: nullToUndefined(databasePhase.order_index),
  status: asLiteral(databasePhase.status, phaseStatuses),
  // `utils/supabase/database.types.ts` is excluded from ESLint's
  // typed-linting program, so the linter's own type resolution for
  // Database row fields here falls back to an error type that reads as
  // `any` — `tsc --noEmit` has no issue with any of this.
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  keyDates: databasePhase.key_dates
    ? JSON.parse(databasePhase.key_dates)
    : undefined,
  createdAt: nullToUndefined(databasePhase.created_at),
  updatedAt: nullToUndefined(databasePhase.updated_at),
});

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

export const listPhases = async (
  meetingId: string,
  options?: { status?: string }
): Promise<ApiResponse<Phase[]>> => {
  let query = supabase.from("phase").select("*").eq("meeting_id", meetingId);

  if (options?.status !== undefined) {
    query = query.eq("status", options.status);
  }
  query = query.order("order_index", { ascending: true });

  const result = await runQuery(async () => {
    const { data, error } = await query;
    return { data: data ?? [], error };
  }, "Failed to fetch phases");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: result.data.map(transformPhase) };
};

export const createPhase = async (
  meetingId: string,
  body: CreatePhaseRequest
): Promise<ApiResponse<Phase>> => {
  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("phase")
      .insert({
        id: randomUUID(),
        meeting_id: meetingId,
        name: body.name,
        order_index: body.orderIndex,
        status: "NOT_STARTED",
        // See the note near transformPhase about the ignored-schema
        // type-resolution gap.
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        key_dates: body.keyDates ? JSON.stringify(body.keyDates) : null,
      })
      .select()
      .single();
    return { data, error };
  }, "Failed to create phase");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformPhase(result.data) };
};

export const getPhaseById = async (id: string): Promise<ApiResponse<Phase>> => {
  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("phase")
      .select("*")
      .eq("id", id)
      .single();
    return { data, error };
  }, "Failed to fetch phase");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformPhase(result.data) };
};

export const updatePhase = async (
  id: string,
  body: UpdatePhaseRequest
): Promise<ApiResponse<Phase>> => {
  const updateData: Partial<PhaseUpdate> = {};
  if (body.name !== undefined) {
    updateData.name = body.name;
  }
  if (body.orderIndex !== undefined) {
    updateData.order_index = body.orderIndex;
  }
  if (body.status !== undefined) {
    updateData.status = body.status;
  }
  if (body.keyDates !== undefined) {
    updateData.key_dates = JSON.stringify(body.keyDates);
  }

  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("phase")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  }, "Failed to update phase");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformPhase(result.data) };
};

// Helper function for backward compatibility
export const listPhasesByMeetingId = async (
  meetingId: string
): Promise<ApiResponse<Phase[]>> => await listPhases(meetingId);
