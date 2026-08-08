import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";
import { asLiteral } from "@/utils/typeUtils";

// Helper function to convert null to undefined
const nullToUndefined = <T>(value: T | null): T | undefined =>
  value === null ? undefined : value;

// Use generated types from OpenAPI schema
type Document = components["schemas"]["Document"];
type Comment = components["schemas"]["Comment"];
type CreateDocumentRequest = components["schemas"]["CreateDocumentRequest"];
type UpdateDocumentRequest = components["schemas"]["UpdateDocumentRequest"];
type CreateCommentRequest = components["schemas"]["CreateCommentRequest"];
type DocumentRow = Database["public"]["Tables"]["document"]["Row"];
type DocumentUpdate = Database["public"]["Tables"]["document"]["Update"];
type CommentRow = Database["public"]["Tables"]["comment"]["Row"];
// `utils/supabase/database.types.ts` is excluded from ESLint's typed-linting
// program, so the linter's own type resolution for `CommentRow` here falls
// back to an error type that reads as `any` — `tsc --noEmit` has no issue
// with any of this.
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type CommentRowWithUser = CommentRow & {
  users?: {
    first_name: string | null;
    last_name: string | null;
    avatar: string | null;
  } | null;
};

interface CommentWithUser {
  id: string;
  comment: string;
  user: string;
  first_name: string;
  last_name: string;
  created_at: string;
  users: {
    avatar: string | null;
  };
}

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

const DOCUMENT_STATUSES = [
  "DRAFT",
  "AWAITING_DRAFT",
  "AWAITING_REVIEW",
  "APPROVED",
  "UPLOADED",
  "IN_PROGRESS",
  "SIGNED",
  "AUTHORIZED",
  "COMPLETED",
] as const;

// Transform snake_case database fields to camelCase API fields
const transformDocument = (databaseDocument: DocumentRow): Document => ({
  id: databaseDocument.id ?? "",
  meetingId: nullToUndefined(databaseDocument.meeting_id),
  title: nullToUndefined(databaseDocument.title),
  description: nullToUndefined(databaseDocument.description),
  type: nullToUndefined(databaseDocument.type),
  status: asLiteral(databaseDocument.status, DOCUMENT_STATUSES),
  taskId: nullToUndefined(databaseDocument.task_id),
  participantId: nullToUndefined(databaseDocument.participant_id),
  filePath: nullToUndefined(databaseDocument.file_path),
  displayCategory: nullToUndefined(databaseDocument.display_category),
  fileType: nullToUndefined(databaseDocument.file_type),
  createdBy: nullToUndefined(databaseDocument.created_by),
  createdByFirstName: nullToUndefined(databaseDocument.created_by_first_name),
  createdByLastName: nullToUndefined(databaseDocument.created_by_last_name),
  updatedBy: nullToUndefined(databaseDocument.updated_by),
  updatedByFirstName: nullToUndefined(databaseDocument.updated_by_first_name),
  updatedByLastName: nullToUndefined(databaseDocument.updated_by_last_name),
  createdAt: nullToUndefined(databaseDocument.created_at),
  updatedAt: nullToUndefined(databaseDocument.updated_at),
});

const transformComment = (databaseComment: CommentRow): Comment => ({
  id: nullToUndefined(databaseComment.id),
  documentId: nullToUndefined(databaseComment.document_id),
  comment: nullToUndefined(databaseComment.comment),
  userId: nullToUndefined(databaseComment.user_id),
  createdAt: nullToUndefined(databaseComment.created_at),
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

export const listDocuments = async (
  meetingId: string,
  options?: {
    type?: string;
    status?: string;
  }
): Promise<ApiResponse<Document[]>> => {
  let query = supabase.from("document").select("*").eq("meeting_id", meetingId);
  if (options?.type !== undefined) {
    query = query.eq("type", options.type);
  }
  if (options?.status !== undefined) {
    query = query.eq("status", options.status);
  }
  query = query.order("created_at", { ascending: false });

  const result = await runQuery(async () => {
    const { data, error } = await query;
    return { data: data ?? [], error };
  }, "Failed to fetch documents");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: result.data.map(transformDocument) };
};

// Sarah Chen, from seed data
const DEFAULT_USER_ID = "14f7b303-44c8-5dce-9b73-c75c2199d7f9";

// Not used for anything security-sensitive — only as a filename disambiguator.
const randomStorageSuffix = (): string =>
  // eslint-disable-next-line sonarjs/pseudo-random
  Math.random().toString(36).slice(2, 11);

interface FilePathResult {
  ok: true;
  filePath: string | undefined;
}
interface FilePathError {
  ok: false;
  message: string;
}

/**
 * Resolves the storage path for a new document. When `file` is a base64
 * data URL it is uploaded to Supabase Storage first; otherwise the value is
 * passed through unchanged (e.g. an already-hosted URL).
 */
const resolveDocumentFilePath = async (
  meetingId: string,
  documentType: string | undefined,
  file: string | undefined
): Promise<FilePathResult | FilePathError> => {
  if (!file?.startsWith("data:")) {
    return { ok: true, filePath: file };
  }

  const [header, base64Data] = file.split(",");
  const contentTypeMatch = /data:(?<contentType>[^;]+)/u.exec(header);
  const contentType =
    contentTypeMatch?.groups?.contentType ?? "application/pdf";
  const fileExtension = contentType.includes("pdf") ? "pdf" : "bin";

  // Uint8Array.fromBase64() isn't in this project's TS lib target (ES2022);
  // Buffer.from is the supported Node API here.
  // eslint-disable-next-line unicorn/prefer-uint8array-base64
  const buffer = Buffer.from(base64Data, "base64");
  const timestamp = Date.now();
  const randomId = randomStorageSuffix();
  const storagePath = `${meetingId}/${documentType}/${timestamp}_${randomId}.${fileExtension}`;

  let outcome: {
    data: { path: string } | null;
    error: { message: string } | null;
  };
  try {
    outcome = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, { contentType, upsert: false });
  } catch (caughtError) {
    return {
      ok: false,
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
      message: `Failed to process file data: ${Error.isError(caughtError) ? caughtError.message : "Unknown error"}`,
    };
  }

  if (outcome.error !== null) {
    return {
      ok: false,
      message: `Failed to upload file: ${outcome.error.message}`,
    };
  }
  if (outcome.data === null) {
    return { ok: false, message: "Failed to upload file: no data returned" };
  }

  return {
    ok: true,
    filePath: `/storage/v1/object/public/documents/${outcome.data.path}`,
  };
};

export const createDocument = async (
  meetingId: string,
  body: CreateDocumentRequest
): Promise<ApiResponse<Document>> => {
  const filePathResult = await resolveDocumentFilePath(
    meetingId,
    body.type,
    body.file
  );
  if (!filePathResult.ok) {
    return { error: { message: filePathResult.message } };
  }

  const now = new Date();
  const nowIso = now.toISOString();

  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("document")
      .insert({
        id: `doc_${Date.now()}_${randomStorageSuffix()}`,
        meeting_id: meetingId,
        title: body.title,
        description: body.description,
        type: body.type,
        task_id: body.taskId,
        participant_id: body.participantId,
        file_path: filePathResult.filePath,
        status: "UPLOADED",
        created_by: DEFAULT_USER_ID,
        created_by_first_name: "Sarah",
        created_by_last_name: "Chen",
        updated_by: DEFAULT_USER_ID,
        updated_by_first_name: "Sarah",
        updated_by_last_name: "Chen",
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single();
    return { data, error };
  }, "Failed to create document");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformDocument(result.data) };
};

export const getDocumentById = async (
  id: string
): Promise<ApiResponse<Document>> => {
  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("document")
      .select("*")
      .eq("id", id)
      .single();
    return { data, error };
  }, "Failed to fetch document");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformDocument(result.data) };
};

export const updateDocument = async (
  id: string,
  body: UpdateDocumentRequest
): Promise<ApiResponse<Document>> => {
  const now = new Date();
  const updateData: Partial<DocumentUpdate> = {
    updated_at: now.toISOString(),
  };
  if (body.title !== undefined) {
    updateData.title = body.title;
  }
  if (body.description !== undefined) {
    updateData.description = body.description;
  }
  if (body.status !== undefined) {
    updateData.status = body.status;
  }

  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("document")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  }, "Failed to update document");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformDocument(result.data) };
};

// Helper function for backward compatibility
export const listDocumentsByMeetingId = async (
  meetingId: string
): Promise<ApiResponse<Document[]>> => await listDocuments(meetingId);

const toCommentWithUser = (
  databaseComment: CommentRowWithUser
): CommentWithUser => {
  const now = new Date();
  return {
    id: databaseComment.id?.toString() ?? "",
    comment: databaseComment.comment ?? "",
    user: databaseComment.user_id ?? "Unknown User",
    first_name: "Unknown",
    last_name: "User",
    created_at: databaseComment.created_at ?? now.toISOString(),
    users: {
      avatar: null,
    },
  };
};

export const getDocumentComments = async (
  documentId: string
): Promise<ApiResponse<CommentWithUser[]>> => {
  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("comment")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });
    return { data: data ?? [], error };
  }, "Failed to fetch comments");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: result.data.map(toCommentWithUser) };
};

// Dev User
const DEFAULT_COMMENT_USER_ID = "ce4b0ac1-095c-5e6f-a301-e489723079a3";

export const addComment = async (
  documentId: string,
  body: CreateCommentRequest,
  userId?: string
): Promise<ApiResponse<Comment>> => {
  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("comment")
      .insert({
        document_id: documentId,
        comment: body.comment,
        user_id: userId ?? DEFAULT_COMMENT_USER_ID,
      })
      .select()
      .single();
    return { data, error };
  }, "Failed to add comment");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: transformComment(result.data) };
};

export const downloadDocument = async (
  id: string
): Promise<ApiResponse<string>> => {
  const result = await runQuery(async () => {
    const { data, error } = await supabase
      .from("document")
      .select("file_path")
      .eq("id", id)
      .single();
    return { data, error };
  }, "Failed to get document file");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return { data: result.data.file_path ?? "" };
};

const removeDocumentFile = async (filePath: string): Promise<void> => {
  let outcome: { error: { message: string } | null };
  try {
    outcome = await supabase.storage.from("documents").remove([filePath]);
  } catch (caughtError) {
    console.warn("Failed to remove file from storage:", caughtError);
    return;
  }

  if (outcome.error !== null) {
    console.warn("Failed to remove file from storage:", outcome.error.message);
  }
};

export const deleteDocument = async (
  id: string
): Promise<ApiResponse<void>> => {
  const lookup = await runQuery(async () => {
    const { data, error } = await supabase
      .from("document")
      .select("file_path")
      .eq("id", id)
      .single();
    return { data, error };
  }, "Failed to look up document");

  if (lookup.ok && lookup.data.file_path !== null) {
    await removeDocumentFile(lookup.data.file_path);
  }

  const result = await runQuery(async () => {
    const { error } = await supabase.from("document").delete().eq("id", id);
    return { data: error === null ? {} : null, error };
  }, "Failed to delete document");

  if (!result.ok) {
    return { error: { message: result.message } };
  }
  return {};
};
