import { randomUUID } from "node:crypto";

import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

// Use generated types from OpenAPI schema
type Task = components["schemas"]["Task"];
type CreateTaskRequest = components["schemas"]["CreateTaskRequest"];
type UpdateTaskRequest = components["schemas"]["UpdateTaskRequest"];
type TaskRow = Database["public"]["Tables"]["task"]["Row"];
type TaskUpdate = Database["public"]["Tables"]["task"]["Update"];

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

// Transform snake_case database fields to camelCase API fields
function transformTask(databaseTask: TaskRow): Task {
  return {
    id: databaseTask.id ?? "",
    title: nullToUndefined(databaseTask.title),
    description: nullToUndefined(databaseTask.description),
    dueDate: nullToUndefined(databaseTask.due_date),
    owner: nullToUndefined(databaseTask.owner),
    status: nullToUndefined(databaseTask.status) as
      | "COMPLETE"
      | "INCOMPLETE"
      | "CANCELLED"
      | "NEEDS_AUTHORIZATION"
      | "AUTHORIZED"
      | "PENDING_AUTHORIZATION"
      | "WAITING_FOR_FORM_RETURN"
      | "AUTHORIZATION_NEEDED"
      | "SUBMITTED_AWAITING_RECORD_DATE"
      | "REQUEST_FORM_TO_FOLLOW"
      | undefined,
    meetingId: nullToUndefined(databaseTask.meeting_id),
    phaseId: nullToUndefined(databaseTask.phase_id),
    phaseNumber: nullToUndefined(databaseTask.phase_number),
    type: nullToUndefined(databaseTask.type),
    documentId: nullToUndefined(databaseTask.document_id),
    links: databaseTask.links as Record<string, never> | null,
    createdAt: nullToUndefined(databaseTask.created_at),
    updatedAt: nullToUndefined(databaseTask.updated_at),
  };
}

export async function listTasks(
  meetingId: string,
  options?: { phaseId?: string; status?: string; owner?: string }
): Promise<ApiResponse<Task[]>> {
  try {
    let query = supabase.from("task").select("*").eq("meeting_id", meetingId);

    // Apply filters
    if (options?.phaseId) {
      query = query.eq("phase_id", options.phaseId);
    }
    if (options?.status) {
      query = query.eq("status", options.status);
    }
    if (options?.owner) {
      query = query.eq("owner", options.owner);
    }

    const { data, error } = await query;

    if (error) {
      return {
        error: { message: error.message ?? "Failed to fetch tasks" },
      };
    }

    return {
      data: data.map(transformTask),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error) ? error.message : "Failed to fetch tasks",
      },
    };
  }
}

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

/**
 * Cross-meeting task query. Filtering happens in the database so a caller
 * asking "which meetings are behind schedule" gets a small response rather than
 * every task in the system.
 */
export async function listAllTasks(
  options?: ListAllTasksOptions
): Promise<ApiResponse<ListAllTasksResult>> {
  try {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(1000, Math.max(1, options?.limit ?? 100));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from("task").select("*", { count: "exact" });

    if (options?.meetingIds && options.meetingIds.length > 0) {
      query = query.in("meeting_id", options.meetingIds);
    }
    if (options?.status) {
      query = query.eq("status", options.status);
    }
    if (options?.dueBefore) {
      query = query
        .not("due_date", "is", null)
        .lt("due_date", options.dueBefore);
    }
    if (options?.openOnly) {
      query = query.not("status", "in", `(${COMPLETION_STATUSES.join(",")})`);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return {
        error: { message: error.message ?? "Failed to fetch tasks" },
      };
    }

    const total = count ?? 0;

    return {
      data: {
        tasks: data.map(transformTask),
        pagination: {
          page,
          limit,
          total,
          totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        },
      },
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error) ? error.message : "Failed to fetch tasks",
      },
    };
  }
}

export async function createTask(
  meetingId: string,
  body: CreateTaskRequest
): Promise<ApiResponse<Task>> {
  try {
    const request = body;
    const { data, error } = await supabase
      .from("task")
      .insert({
        id: randomUUID(),
        meeting_id: meetingId,
        task_id: request.taskId,
        title: request.title,
        description: request.description,
        due_date: request.dueDate,
        owner: request.owner,
        status: "INCOMPLETE",
        phase_id: request.phaseId,
        phase_number: request.phaseNumber,
        type: request.type,
        document_id: request.documentId,
        links: request.links,
      })
      .select()
      .single();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to create task" },
      };
    }

    return {
      data: transformTask(data),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error) ? error.message : "Failed to create task",
      },
    };
  }
}

export async function getTaskById(id: string): Promise<ApiResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from("task")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to fetch task" },
      };
    }

    return {
      data: transformTask(data),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error) ? error.message : "Failed to fetch task",
      },
    };
  }
}

export async function updateTask(
  id: string,
  body: UpdateTaskRequest
): Promise<ApiResponse<Task>> {
  try {
    const request = body;
    const updateData: Partial<TaskUpdate> = {
      updated_at: new Date().toISOString(),
    };
    if (request.title !== undefined) {
      updateData.title = request.title;
    }
    if (request.description !== undefined) {
      updateData.description = request.description;
    }
    if (request.dueDate !== undefined) {
      updateData.due_date = request.dueDate;
    }
    if (request.owner !== undefined) {
      updateData.owner = request.owner;
    }
    if (request.status !== undefined) {
      updateData.status = request.status;
    }
    if (request.phaseNumber !== undefined) {
      updateData.phase_number = request.phaseNumber;
    }
    if (request.type !== undefined) {
      updateData.type = request.type;
    }
    if (request.documentId !== undefined) {
      updateData.document_id = request.documentId;
    }
    if (request.links !== undefined) {
      updateData.links = request.links
        ? (JSON.parse(
            JSON.stringify(request.links)
          ) as Database["public"]["Tables"]["task"]["Row"]["links"])
        : null;
    }

    const { data, error } = await supabase
      .from("task")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to update task" },
      };
    }

    return {
      data: transformTask(data),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error) ? error.message : "Failed to update task",
      },
    };
  }
}

// Helper function for backward compatibility
export async function listTasksByMeetingId(
  meetingId: string
): Promise<ApiResponse<Task[]>> {
  return await listTasks(meetingId);
}
