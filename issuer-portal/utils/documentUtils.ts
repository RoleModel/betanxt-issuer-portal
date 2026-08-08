// Document utility functions
//
// This file's dynamic imports each carry a `/* webpackChunkName: ... */`
// directive comment, which webpack requires to sit inline immediately
// before the import specifier — hence the file-wide disable below.
/* eslint-disable no-inline-comments */
import { asRecord, getNumber, getString } from "./typeUtils";
import type {
  createStorageFolder,
  uploadFileToStorage,
} from "./supabaseStorage";

// API document statuses (see generated-schema.ts)
export type DocumentStatus =
  | "DRAFT"
  | "AWAITING_DRAFT"
  | "AWAITING_REVIEW"
  | "APPROVED"
  | "UPLOADED"
  | "IN_PROGRESS"
  | "SIGNED"
  | "AUTHORIZED"
  | "COMPLETED";

// Extended status used only client-side for placeholder DSM documents that have no file yet.
export type ExtendedDocumentStatus = DocumentStatus | "NOT_UPLOADED";

// Export an ordered array of the valid document status values for reuse (e.g. UI helpers)
export const DOCUMENT_STATUS_VALUES: DocumentStatus[] = [
  "DRAFT",
  "AWAITING_DRAFT",
  "AWAITING_REVIEW",
  "APPROVED",
  "UPLOADED",
  "IN_PROGRESS",
  "SIGNED",
  "AUTHORIZED",
  "COMPLETED",
];

// Include extended placeholder statuses separately so we don't leak them into persistence logic.
export const EXTENDED_DOCUMENT_STATUS_VALUES: ExtendedDocumentStatus[] = [
  ...DOCUMENT_STATUS_VALUES,
  "NOT_UPLOADED",
];

export interface Document {
  id: string;
  name: string;
  type: string;
  status: ExtendedDocumentStatus;
  size: number;
  uploadedAt: string;
  url?: string;
}

export interface DocumentSignature {
  id: string;
  documentId: string;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  status: "pending" | "signed";
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DocumentHistoryEntry {
  id: string;
  documentId: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface DocumentWithHistory extends Document {
  history: DocumentHistoryEntry[];
}

// Format file size in bytes to human readable string
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number((bytes / k ** index).toFixed(2))} ${sizes[index]}`;
};

// Get file extension from filename. A leading dot (e.g. ".gitignore") does
// not count as an extension separator, matching the historical behavior here.
export const getFileExtension = (filename: string): string => {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex <= 0 ? "" : filename.slice(dotIndex + 1);
};

// Check if file type is supported
export const isSupportedFileType = (filename: string): boolean => {
  const supportedTypes = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "csv",
    "txt",
  ];
  const extension = getFileExtension(filename).toLowerCase();
  return supportedTypes.includes(extension);
};

// Not used for anything security-sensitive — only as an id disambiguator.
// eslint-disable-next-line sonarjs/pseudo-random
const randomSuffix = (): string => Math.random().toString(36).slice(2);

// Generate a unique document ID
export const generateDocumentId = (): string =>
  `doc_${Date.now()}_${randomSuffix()}`;

// Validate document signature position
export const isSignaturePositionValid = (
  position: { x: number; y: number; width: number; height: number },
  pageWidth: number,
  pageHeight: number
): boolean =>
  position.x >= 0 &&
  position.y >= 0 &&
  position.x + position.width <= pageWidth &&
  position.y + position.height <= pageHeight;

// Calculate signature area in pixels
export const calculateSignatureArea = (position: {
  width: number;
  height: number;
}): number => position.width * position.height;

// Upload document to Supabase storage
export const uploadDocument = async (
  file: File,
  meetingId?: string,
  documentType: "dsm" | "regular" = "regular"
): Promise<{ data: Document | null; error: string | null }> => {
  if (!isSupportedFileType(file.name)) {
    return { data: null, error: "File type not supported" };
  }

  // Import storage utility dynamically to avoid SSR issues.
  let storageModule: {
    createStorageFolder: typeof createStorageFolder;
    uploadFileToStorage: typeof uploadFileToStorage;
  };
  try {
    storageModule = await import(
      /* webpackChunkName: "documents-supabase-storage" */ "./supabaseStorage"
    );
  } catch (error) {
    return {
      data: null,
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
      error: Error.isError(error) ? error.message : "Failed to upload document",
    };
  }

  const folder =
    meetingId === undefined
      ? undefined
      : storageModule.createStorageFolder(meetingId, documentType);

  let uploadResult: Awaited<ReturnType<typeof uploadFileToStorage>>;
  try {
    uploadResult = await storageModule.uploadFileToStorage(file, folder);
  } catch (error) {
    return {
      data: null,
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
      error: Error.isError(error) ? error.message : "Failed to upload document",
    };
  }

  if (uploadResult.error !== null || uploadResult.data === null) {
    return { data: null, error: uploadResult.error ?? "Upload failed" };
  }

  const uploadedAt = new Date();
  const document: Document = {
    id: generateDocumentId(),
    name: file.name,
    type: getFileExtension(file.name),
    status: "DRAFT",
    size: file.size,
    uploadedAt: uploadedAt.toISOString(),
    url: uploadResult.data.publicUrl ?? uploadResult.data.fullPath,
  };

  return { data: document, error: null };
};

// Deletes the file at `storagePath`, if given. Database-record deletion for
// the owning document is not wired up yet — see deleteDocument below.
const removeStorageFile = async (
  storagePath: string
): Promise<{ error: string | null }> => {
  const { deleteFileFromStorage } = await import(
    /* webpackChunkName: "documents-supabase-storage" */ "./supabaseStorage"
  );
  return await deleteFileFromStorage(storagePath);
};

// Delete document from storage. `_documentId` is not yet used to remove the
// corresponding database row — this only handles the storage file today.
export const deleteDocument = async (
  _documentId: string,
  storagePath?: string
): Promise<{ success: boolean; error: string | null }> => {
  if (storagePath === undefined) {
    return { success: true, error: null };
  }

  let result: { error: string | null };
  try {
    result = await removeStorageFile(storagePath);
  } catch (error) {
    return {
      success: false,
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
      error: Error.isError(error) ? error.message : "Failed to delete document",
    };
  }

  if (result.error !== null) {
    return { success: false, error: result.error };
  }

  return { success: true, error: null };
};

// Get document status color for UI
export const getDocumentStatusColor = (
  status: ExtendedDocumentStatus
): string => {
  switch (status) {
    case "NOT_UPLOADED": {
      return "grey";
    }
    case "DRAFT":
    case "AWAITING_DRAFT": {
      return "grey";
    }
    case "AWAITING_REVIEW": {
      return "warning";
    }
    case "APPROVED":
    case "AUTHORIZED": {
      return "primary";
    }
    case "UPLOADED":
    case "IN_PROGRESS": {
      return "info";
    }
    case "SIGNED": {
      return "secondary";
    }
    case "COMPLETED": {
      return "success";
    }
    default: {
      return "default";
    }
  }
};

export const getDocumentStatusLabel = (
  status: ExtendedDocumentStatus
): string => {
  switch (status) {
    case "NOT_UPLOADED": {
      return "Not Uploaded";
    }
    case "DRAFT": {
      return "Draft";
    }
    case "AWAITING_DRAFT": {
      return "Awaiting Draft";
    }
    case "AWAITING_REVIEW": {
      return "Awaiting Review";
    }
    case "APPROVED": {
      return "Approved";
    }
    case "UPLOADED": {
      return "Uploaded";
    }
    case "IN_PROGRESS": {
      return "In Progress";
    }
    case "SIGNED": {
      return "Signed";
    }
    case "AUTHORIZED": {
      return "Authorized";
    }
    case "COMPLETED": {
      return "Completed";
    }
    default: {
      return "Unknown";
    }
  }
};

export const getDocumentActionLabel = (documentInfo: {
  status?: ExtendedDocumentStatus;
  url?: string;
  filePath?: string;
}): string => {
  if (documentInfo.status === "NOT_UPLOADED") {
    return "Upload";
  }
  const hasFile =
    documentInfo.url !== undefined || documentInfo.filePath !== undefined;
  if (!hasFile) {
    return "Upload";
  }
  if (documentInfo.status === "AWAITING_REVIEW") {
    return "Review";
  }
  return "View";
};

// Build a public URL for a stored document path (Supabase storage)
export const getStoragePublicUrl = (filePath: string): string => {
  // If already a full URL, return as-is
  if (/^https?:\/\//iu.test(filePath)) {
    return filePath;
  }

  // If it's a data URI (base64), return as-is
  if (filePath.startsWith("data:")) {
    return filePath;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";

  // If this is a Next/Supabase storage relative path, prefix with base URL and return
  if (filePath.startsWith("/storage/v1/object/")) {
    return `${supabaseUrl}${filePath}`;
  }
  if (filePath.startsWith("storage/v1/object/")) {
    return `${supabaseUrl}/${filePath}`;
  }

  // Strip leading slashes and /documents/ prefix if present
  let normalized = filePath.replace(/^\/+/u, "");
  if (normalized.startsWith("documents/")) {
    normalized = normalized.slice("documents/".length);
  }

  // Always ensure path is under the 'documents/' bucket
  const withBucket = `documents/${normalized}`;

  // Build the public object URL (not the S3 proxy) so it works in browsers
  return `${supabaseUrl}/storage/v1/object/public/${withBucket}`;
};

// Simple URL detector used by UI code
export const isStorageUrl = (pathOrUrl: string): boolean =>
  /^https?:\/\//iu.test(pathOrUrl) ||
  pathOrUrl.startsWith("/storage/v1/object/public/");

const isDocumentStatus = (value: string): value is DocumentStatus =>
  (DOCUMENT_STATUS_VALUES as readonly string[]).includes(value);

const coerceDocumentStatus = (
  value: unknown,
  fallback: DocumentStatus
): DocumentStatus => {
  const status = typeof value === "string" ? value : null;
  return status !== null && isDocumentStatus(status) ? status : fallback;
};

const parseDocumentHistoryEntry = (
  raw: unknown,
  fallbackDocumentId: string
): DocumentHistoryEntry | null => {
  const h = asRecord(raw);
  if (h === null) {
    return null;
  }
  const now = new Date();
  return {
    id: getString(h, ["id"]) ?? `${fallbackDocumentId}_hist_${randomSuffix()}`,
    documentId: getString(h, ["documentId"]) ?? fallbackDocumentId,
    action: getString(h, ["action"]) ?? "UNKNOWN",
    userId: getString(h, ["userId", "user_id"]) ?? "",
    userName: getString(h, ["userName", "user_name", "user"]) ?? "Unknown User",
    timestamp: getString(h, ["timestamp", "created_at"]) ?? now.toISOString(),
    details: asRecord(h.details) ?? undefined,
  };
};

const parseDocumentHistory = (
  raw: unknown,
  fallbackDocumentId: string
): DocumentHistoryEntry[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  const entries: DocumentHistoryEntry[] = [];
  for (const item of raw) {
    const entry = parseDocumentHistoryEntry(item, fallbackDocumentId);
    if (entry !== null) {
      entries.push(entry);
    }
  }
  return entries;
};

interface DocumentFieldKeys {
  title: string[];
  type: string[];
  size: string[];
  uploadedAt: string[];
  url: string[];
}

const ROW_FIELD_KEYS: DocumentFieldKeys = {
  title: ["title"],
  type: ["type", "file_type"],
  size: ["file_size"],
  uploadedAt: ["uploaded_date", "updated_at", "created_at"],
  url: ["file_path"],
};

const API_FIELD_KEYS: DocumentFieldKeys = {
  title: ["title", "name"],
  type: ["type", "fileType", "file_type"],
  size: ["fileSize", "file_size"],
  uploadedAt: [
    "uploadedDate",
    "uploaded_date",
    "updatedAt",
    "updated_at",
    "createdAt",
    "created_at",
  ],
  url: ["filePath", "file_path"],
};

const parseDocumentBaseFields = (
  raw: Record<string, unknown>,
  fallbackId: string,
  keys: DocumentFieldKeys
): Document => {
  const now = new Date();
  return {
    id: getString(raw, ["id"]) ?? fallbackId,
    name: getString(raw, keys.title) ?? "Untitled",
    type: getString(raw, keys.type) ?? "pdf",
    status: coerceDocumentStatus(raw.status, "DRAFT"),
    size: getNumber(raw, keys.size) ?? 0,
    uploadedAt: getString(raw, keys.uploadedAt) ?? now.toISOString(),
    url: getString(raw, keys.url) ?? undefined,
  };
};

// Maps a raw Supabase `document` row (snake_case only) to DocumentWithHistory.
const parseDocumentRow = (rowRaw: unknown): DocumentWithHistory => {
  const row = asRecord(rowRaw) ?? {};
  const fallbackId = `doc_${randomSuffix()}`;
  const base = parseDocumentBaseFields(row, fallbackId, ROW_FIELD_KEYS);
  return { ...base, history: parseDocumentHistory(row.history, base.id) };
};

// Maps a document shape returned from the OpenAPI client (camelCase, with
// snake_case fallbacks since some routes haven't finished migrating).
const parseDocumentFields = (rawRaw: unknown): DocumentWithHistory => {
  const raw = asRecord(rawRaw) ?? {};
  const fallbackId = `doc_${randomSuffix()}`;
  const base = parseDocumentBaseFields(raw, fallbackId, API_FIELD_KEYS);
  return { ...base, history: parseDocumentHistory(raw.history, base.id) };
};

interface FetchDocumentsOptions {
  apiQuery?: { type: string };
  supabaseTypeFilter?: string;
  fallbackErrorMessage: string;
}

// No try/catch here on purpose: the caller's try/catch handles failures,
// which keeps unicorn/try-complexity happy without hiding the branching
// logic behind a disable comment.
const fetchDocumentsViaApi = async (
  meetingId: string,
  apiQuery: { type: string } | undefined
): Promise<DocumentWithHistory[] | null> => {
  const { apiClient } = await import(
    /* webpackChunkName: "documents-api-client" */ "../domain-models/api/client"
  );
  const resp = await apiClient.GET("/meetings/{meetingId}/documents", {
    params: {
      path: { meetingId },
      query: apiQuery === undefined ? undefined : { ...apiQuery },
    },
  });
  if (resp.error !== undefined) {
    return null;
  }
  return Array.isArray(resp.data)
    ? resp.data.map((d) => parseDocumentFields(d))
    : [];
};

interface SupabaseDocumentsResult {
  data: DocumentWithHistory[] | null;
  error: string | null;
}

const fetchDocumentsViaSupabase = async (
  meetingId: string,
  typeFilter: string | undefined
): Promise<SupabaseDocumentsResult> => {
  const { supabase } = await import(
    /* webpackChunkName: "documents-supabase-storage" */ "./supabaseStorage"
  );
  let query = supabase
    .from("document")
    .select(
      "id,title,type,status,file_size,file_type,file_path,meeting_id,updated_at,created_at,uploaded_date,history"
    )
    .eq("meeting_id", meetingId);
  if (typeFilter !== undefined) {
    query = query.like("type", typeFilter);
  }
  const { data, error } = await query.order("updated_at", {
    ascending: false,
  });
  if (error !== null) {
    return { data: null, error: error.message };
  }
  return {
    data: data.map((row) => parseDocumentRow(row)),
    error: null,
  };
};

const fetchDocumentsList = async (
  meetingId: string,
  options: FetchDocumentsOptions
): Promise<{ data: DocumentWithHistory[] | null; error: string | null }> => {
  let apiResult: DocumentWithHistory[] | null = null;
  try {
    apiResult = await fetchDocumentsViaApi(meetingId, options.apiQuery);
  } catch {
    // API call failed, fall back to direct Supabase query below
  }
  if (apiResult !== null) {
    return { data: apiResult, error: null };
  }

  try {
    return await fetchDocumentsViaSupabase(
      meetingId,
      options.supabaseTypeFilter
    );
  } catch (error) {
    return {
      data: null,
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
      error: Error.isError(error)
        ? error.message
        : options.fallbackErrorMessage,
    };
  }
};

// Fetch DSM documents for a meeting (category = 'DSM')
export const fetchDSMDocuments = async (
  meetingId: string
): Promise<{ data: DocumentWithHistory[] | null; error: string | null }> =>
  await fetchDocumentsList(meetingId, {
    apiQuery: { type: "digital-shareholder-meeting" },
    supabaseTypeFilter: "%DSM%",
    fallbackErrorMessage: "Failed to fetch DSM documents",
  });

// Fetch non-DSM (regular) documents for a meeting
export const fetchRegularDocuments = async (
  meetingId: string
): Promise<{ data: DocumentWithHistory[] | null; error: string | null }> =>
  await fetchDocumentsList(meetingId, {
    fallbackErrorMessage: "Failed to fetch regular documents",
  });

// No try/catch here on purpose: the caller's try/catch handles failures,
// which keeps unicorn/try-complexity happy without hiding the branching
// logic behind a disable comment.
const updateDocumentStatusViaApi = async (
  documentId: string,
  persistStatus: DocumentStatus
): Promise<Document | null> => {
  const { apiClient } = await import(
    /* webpackChunkName: "documents-api-client" */ "../domain-models/api/client"
  );
  const resp = await apiClient.PUT("/documents/{id}", {
    params: { path: { id: documentId } },
    body: { status: persistStatus },
  });
  return resp.error === undefined ? parseDocumentFields(resp.data) : null;
};

interface SupabaseDocumentResult {
  data: Document | null;
  error: string | null;
}

const updateDocumentStatusViaSupabase = async (
  documentId: string,
  persistStatus: DocumentStatus
): Promise<SupabaseDocumentResult> => {
  const { supabase } = await import(
    /* webpackChunkName: "documents-supabase-storage" */ "./supabaseStorage"
  );
  const { data, error } = await supabase
    .from("document")
    .update({ status: persistStatus })
    .eq("id", documentId)
    .select(
      "id,title,type,status,file_size,file_type,file_path,updated_at,created_at,uploaded_date"
    )
    .single();
  if (error !== null) {
    return { data: null, error: error.message };
  }
  return { data: parseDocumentRow(data), error: null };
};

// Update document status in persistence layer
export const updateDocumentStatus = async (
  documentId: string,
  status: Document["status"]
): Promise<{ data: Document | null; error: string | null }> => {
  // Never attempt to persist placeholder status
  const persistStatus: DocumentStatus =
    status === "NOT_UPLOADED" ? "DRAFT" : status;

  let apiResult: Document | null = null;
  try {
    apiResult = await updateDocumentStatusViaApi(documentId, persistStatus);
  } catch {
    // API call failed, fall back to direct Supabase update below
  }
  if (apiResult !== null) {
    return { data: apiResult, error: null };
  }

  try {
    return await updateDocumentStatusViaSupabase(documentId, persistStatus);
  } catch (error) {
    return {
      data: null,
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- Error.isError's lib type resolves oddly here; tsc has no issue
      error: Error.isError(error)
        ? error.message
        : "Failed to update document status",
    };
  }
};
