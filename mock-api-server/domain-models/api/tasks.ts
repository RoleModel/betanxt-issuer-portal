import { randomUUID } from "node:crypto";

import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";
import { asLiteral, asRecord } from "@/utils/typeUtils";

// Helper function to convert null to undefined
const nullToUndefined = <T>(value: T | null): T | undefined =>
  value === null ? undefined : value;

// Use generated types from OpenAPI schema
type Task = components["schemas"]["Task"];
type CreateTaskRequest = components["schemas"]["CreateTaskRequest"];
type UpdateTaskRequest = components["schemas"]["UpdateTaskRequest"];
type TaskRow = Database["public"]["Tables"]["task"]["Row"];
type TaskUpdate = Database["public"]["Tables"]["task"]["Update"];

const TASK_STATUSES = [
  "INCOMPLETE",
  "COMPLETE",
  "CANCELLED",
  "NEEDS_AUTHORIZATION",
  "AUTHORIZED",
  "PENDING_AUTHORIZATION",
  "WAITING_FOR_FORM_RETURN",
  "AUTHORIZATION_NEEDED",
  "SUBMITTED_AWAITING_RECORD_DATE",
  "REQUEST_FORM_TO_FOLLOW",
  "AWAITING_REVIEW",
] as const;

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

// Transform snake_case database fields to camelCase API fields
const transformTask = (databaseTask: TaskRow): Task => ({
  id: databaseTask.id ?? "",
  title: nullToUndefined(databaseTask.title),
  description: nullToUndefined(databaseTask.description),
  dueDate: nullToUndefined(databaseTask.due_date),
  owner: nullToUndefined(databaseTask.owner),
  status: asLiteral(databaseTask.status, TASK_STATUSES),
  meetingId: nullToUndefined(databaseTask.meeting_id),
  phaseId: nullToUndefined(databaseTask.phase_id),
  phaseNumber: nullToUndefined(databaseTask.phase_number),
  type: nullToUndefined(databaseTask.type),
  documentId: nullToUndefined(databaseTask.document_id),
  links: asRecord(databaseTask.links),
  createdAt: nullToUndefined(databaseTask.created_at),
  updatedAt: nullToUndefined(databaseTask.updated_at),
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

export const listTasks = async (
  meetingId: string,
  options?: { phaseId?: string; status?: string; owner?: string }
): Promise<ApiResponse<Task[]>> => {
  let query = supabase.from("task").select("*").eq("meeting_id", meetingId);

  if (options?.phaseId !== undefined) {
    query = query.eq("phase_id", options.phaseId);
  }
  if (options?.status !== undefined) {
    query = query.eq("status", options.status);
  }
  if (options?.owner !== undefined) {
    query = query.eq("owner", options.owner);
  }

  const result = await runQuery(async () => {
    const { data, error } = await query;
    return { data: data ?? [], error };
  }, "Failed to fetch tasks");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: result.data.map(transformTask) };
};

/**
 * Statuses that mean a task is no longer holding its meeting up. Mirrors the
 * phase-advancement completion set documented in CLAUDE.md. Kept server-side so
 * clients never have to encode this business rule themselves.
 */
const COMPLETION_STATUSES: readonly string[] = [
  "COMPLETE",
  "AUTHORIZED",
  "SUBMITTED_AWAITING_RECORD_DATE",
  "WAITING_FOR_FORM_RETURN",
  "REQUEST_FORM_TO_FOLLOW",
  "PENDING_AUTHORIZATION",
  "CANCELLED",
];

export interface ListAllTasksOptions {
  page?: number;
  limit?: number;
  meetingIds?: string[];
  status?: string;
  dueBefore?: string;
  openOnly?: boolean;
}

export interface ListAllTasksResult {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TaskPage {
  rows: TaskRow[];
  total: number;
}

/**
 * Cross-meeting task query. Filtering happens in the database so a caller
 * asking "which meetings are behind schedule" gets a small response rather than
 * every task in the system.
 */
export const listAllTasks = async (
  options?: ListAllTasksOptions
): Promise<ApiResponse<ListAllTasksResult>> => {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(1000, Math.max(1, options?.limit ?? 100));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("task").select("*", { count: "exact" });

  if (options?.meetingIds !== undefined && options.meetingIds.length > 0) {
    query = query.in("meeting_id", options.meetingIds);
  }
  if (options?.status !== undefined) {
    query = query.eq("status", options.status);
  }
  if (options?.dueBefore !== undefined) {
    query = query.not("due_date", "is", null).lt("due_date", options.dueBefore);
  }
  if (options?.openOnly === true) {
    query = query.not("status", "in", `(${COMPLETION_STATUSES.join(",")})`);
  }

  const result = await runQuery<TaskPage>(async () => {
    const { data, error, count } = await query.range(from, to);
    return { data: { rows: data ?? [], total: count ?? 0 }, error };
  }, "Failed to fetch tasks");

  if (!result.ok) {
    return { error: { message: result.message } };
  }

  const { rows, total } = result.data;
  return {
    data: {
      tasks: rows.map(transformTask),
      pagination: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    },
  };
};

export const createTask = async (
  meetingId: string,
  body: CreateTaskRequest
): Promise<ApiResponse<Task>> => {
  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("task")
      .insert({
        id: randomUUID(),
        meeting_id: meetingId,
        task_id: body.taskId,
        title: body.title,
        description: body.description,
        due_date: body.dueDate,
        owner: body.owner,
        status: "INCOMPLETE",
        phase_id: body.phaseId,
        phase_number: body.phaseNumber,
        type: body.type,
        document_id: body.documentId,
        links: body.links,
      })
      .select()
      .single();
    return { data, error };
  }, "Failed to create task");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformTask(result.data) };
};

export const getTaskById = async (id: string): Promise<ApiResponse<Task>> => {
  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("task")
      .select("*")
      .eq("id", id)
      .single();
    return { data, error };
  }, "Failed to fetch task");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformTask(result.data) };
};

export const updateTask = async (
  id: string,
  body: UpdateTaskRequest
): Promise<ApiResponse<Task>> => {
  const now = new Date();
  const updateData: Partial<TaskUpdate> = {
    updated_at: now.toISOString(),
  };
  if (body.title !== undefined) {
    updateData.title = body.title;
  }
  if (body.description !== undefined) {
    updateData.description = body.description;
  }
  if (body.dueDate !== undefined) {
    updateData.due_date = body.dueDate;
  }
  if (body.owner !== undefined) {
    updateData.owner = body.owner;
  }
  if (body.status !== undefined) {
    updateData.status = body.status;
  }
  if (body.phaseNumber !== undefined) {
    updateData.phase_number = body.phaseNumber;
  }
  if (body.type !== undefined) {
    updateData.type = body.type;
  }
  if (body.documentId !== undefined) {
    updateData.document_id = body.documentId;
  }
  if (body.links !== undefined) {
    updateData.links =
      body.links === null
        ? null
        : (structuredClone(
            body.links
          ) as Database["public"]["Tables"]["task"]["Row"]["links"]);
  }

  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("task")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  }, "Failed to update task");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformTask(result.data) };
};

// Helper function for backward compatibility
export const listTasksByMeetingId = async (
  meetingId: string
): Promise<ApiResponse<Task[]>> => await listTasks(meetingId);
