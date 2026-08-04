import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

// Use generated types from OpenAPI schema
type Document = components["schemas"]["Document"];
type Comment = components["schemas"]["Comment"];
type CreateDocumentRequest = components["schemas"]["CreateDocumentRequest"];
type UpdateDocumentRequest = components["schemas"]["UpdateDocumentRequest"];
type CreateCommentRequest = components["schemas"]["CreateCommentRequest"];
type DocumentRow = Database["public"]["Tables"]["document"]["Row"];
type DocumentUpdate = Database["public"]["Tables"]["document"]["Update"];
type CommentRow = Database["public"]["Tables"]["comment"]["Row"];
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

// Transform snake_case database fields to camelCase API fields
function transformDocument(databaseDocument: DocumentRow): Document {
  return {
    id: databaseDocument.id ?? "",
    meetingId: nullToUndefined(databaseDocument.meeting_id),
    title: nullToUndefined(databaseDocument.title),
    description: nullToUndefined(databaseDocument.description),
    type: nullToUndefined(databaseDocument.type),
    status: nullToUndefined(databaseDocument.status) as
      | "IN_PROGRESS"
      | "AUTHORIZED"
      | "DRAFT"
      | "AWAITING_DRAFT"
      | "AWAITING_REVIEW"
      | "APPROVED"
      | "UPLOADED"
      | "SIGNED"
      | "COMPLETED"
      | undefined,
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
  };
}

function transformComment(databaseComment: CommentRow): Comment {
  return {
    id: nullToUndefined(databaseComment.id),
    documentId: nullToUndefined(databaseComment.document_id),
    comment: nullToUndefined(databaseComment.comment),
    userId: nullToUndefined(databaseComment.user_id),
    createdAt: nullToUndefined(databaseComment.created_at),
  };
}

export async function listDocuments(
  meetingId: string,
  options?: {
    type?: string;
    status?: string;
  }
): Promise<ApiResponse<Document[]>> {
  try {
    let query = supabase
      .from("document")
      .select("*")
      .eq("meeting_id", meetingId);

    console.log("listDocuments query built:", { meetingId, opts: options });

    // Apply filters
    if (options?.type) {
      query = query.eq("type", options.type);
    }
    if (options?.status) {
      query = query.eq("status", options.status);
    }

    // Order by created date
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    console.log("listDocuments raw result:", {
      dataCount: data?.length,
      error,
    });

    if (error) {
      return {
        error: { message: error.message ?? "Failed to fetch documents" },
      };
    }

    return {
      data: data.map(transformDocument),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to fetch documents",
      },
    };
  }
}

export async function createDocument(
  meetingId: string,
  body: CreateDocumentRequest
): Promise<ApiResponse<Document>> {
  try {
    const request = body;
    const now = new Date().toISOString();
    // Default user: Sarah Chen (from seed data)
    const defaultUserId = "14f7b303-44c8-5dce-9b73-c75c2199d7f9";

    let filePath = request.file;

    // Check if file is base64 data and needs to be uploaded to storage
    if (typeof request.file === "string" && request.file.startsWith("data:")) {
      try {
        // Extract base64 data and content type
        const [header, base64Data] = request.file.split(",");
        const contentType =
          /data:([^;]+)/.exec(header)?.[1] || "application/pdf";
        const fileExtension = contentType.includes("pdf") ? "pdf" : "bin";

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, "base64");

        // Generate storage path
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).slice(2, 11);
        const storagePath = `${meetingId}/${request.type}/${timestamp}_${randomId}.${fileExtension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, buffer, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          return {
            error: { message: `Failed to upload file: ${uploadError.message}` },
          };
        }

        // Set file path to storage URL
        filePath = `/storage/v1/object/public/documents/${uploadData.path}`;
      } catch (error_) {
        return {
          error: {
            message: `Failed to process file data: ${Error.isError(error_) ? error_.message : "Unknown error"}`,
          },
        };
      }
    }

    const { data, error } = await supabase
      .from("document")
      .insert({
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        meeting_id: meetingId,
        title: request.title,
        description: request.description,
        type: request.type,
        task_id: request.taskId,
        participant_id: request.participantId,
        file_path: filePath,
        status: "UPLOADED",
        created_by: defaultUserId,
        created_by_first_name: "Sarah",
        created_by_last_name: "Chen",
        updated_by: defaultUserId,
        updated_by_first_name: "Sarah",
        updated_by_last_name: "Chen",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    console.log("createDocument result:", { data, error });

    if (error) {
      return {
        error: { message: error.message ?? "Failed to create document" },
      };
    }

    return {
      data: transformDocument(data),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to create document",
      },
    };
  }
}

export async function getDocumentById(
  id: string
): Promise<ApiResponse<Document>> {
  try {
    const { data, error } = await supabase
      .from("document")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to fetch document" },
      };
    }

    return {
      data: transformDocument(data),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to fetch document",
      },
    };
  }
}

export async function updateDocument(
  id: string,
  body: UpdateDocumentRequest
): Promise<ApiResponse<Document>> {
  try {
    const request = body;
    const updateData: Partial<DocumentUpdate> = {};
    if (request.title !== undefined) {
      updateData.title = request.title;
    }
    if (request.description !== undefined) {
      updateData.description = request.description;
    }
    if (request.status !== undefined) {
      updateData.status = request.status;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("document")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to update document" },
      };
    }

    return {
      data: transformDocument(data),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to update document",
      },
    };
  }
}

export async function listDocumentsByMeetingId(
  meetingId: string
): Promise<ApiResponse<Document[]>> {
  return await listDocuments(meetingId);
}

export async function getDocumentComments(
  documentId: string
): Promise<ApiResponse<CommentWithUser[]>> {
  try {
    const { data, error } = await supabase
      .from("comment")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    if (error) {
      return {
        error: { message: error.message ?? "Failed to fetch comments" },
      };
    }

    // Transform to match DocumentViewer's CommentWithUser interface
    const transformedComments: CommentWithUser[] = (data ?? []).map(
      (databaseComment: CommentRowWithUser) => ({
        id: databaseComment.id?.toString() || "",
        comment: databaseComment.comment ?? "",
        user: databaseComment.user_id ?? "Unknown User",
        first_name: "Unknown",
        last_name: "User",
        created_at: databaseComment.created_at || new Date().toISOString(),
        users: {
          avatar: null,
        },
      })
    );

    return {
      data: transformedComments,
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to fetch comments",
      },
    };
  }
}

export async function addComment(
  documentId: string,
  body: CreateCommentRequest,
  userId?: string
): Promise<ApiResponse<Comment>> {
  try {
    const { data, error } = await supabase
      .from("comment")
      .insert({
        document_id: documentId,
        comment: body.comment,
        user_id: userId ?? "ce4b0ac1-095c-5e6f-a301-e489723079a3", // Default to Dev User
      })
      .select()
      .single();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to add comment" },
      };
    }

    return {
      data: transformComment(data),
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error) ? error.message : "Failed to add comment",
      },
    };
  }
}

export async function downloadDocument(
  id: string
): Promise<ApiResponse<string>> {
  try {
    const { data, error } = await supabase
      .from("document")
      .select("file_path")
      .eq("id", id)
      .single();

    if (error) {
      return {
        error: { message: error.message ?? "Failed to get document file" },
      };
    }

    return {
      data: data.file_path ?? "",
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to download document",
      },
    };
  }
}

export async function deleteDocument(id: string): Promise<ApiResponse<void>> {
  try {
    const { data: documentData } = await supabase
      .from("document")
      .select("file_path")
      .eq("id", id)
      .single();

    if (documentData?.file_path) {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([documentData.file_path]);

      if (storageError) {
        console.warn(
          "Failed to remove file from storage:",
          storageError.message
        );
      }
    }

    const { error } = await supabase.from("document").delete().eq("id", id);

    if (error) {
      return {
        error: { message: error.message ?? "Failed to delete document" },
      };
    }

    return {
      data: undefined,
    };
  } catch (error) {
    return {
      error: {
        message: Error.isError(error)
          ? error.message
          : "Failed to delete document",
      },
    };
  }
}
