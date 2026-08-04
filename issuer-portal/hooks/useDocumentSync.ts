"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";

import type { components } from "@/domain-models/generated-schema";
import { getBrowserSupabase } from "@/lib/browserSupabase";

type Document = components["schemas"]["Document"];

interface UseDocumentSyncOptions {
  meetingId: string;
  onDocumentAdded?: (document: Document) => void;
  onDocumentUpdated?: (document: Document) => void;
  onDocumentDeleted?: (documentId: string) => void;
}

interface DatabaseDocument {
  id: string;
  meeting_id: string | null;
  task_id: string | null;
  title: string | null;
  description: string | null;
  type: string | null;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  status: string | null;
  upload_date: string | null;
  uploaded_date: string | null;
  signed_date: string | null;
  authorized_date: string | null;
  completed_date: string | null;
  in_progress_date: string | null;
  deadline: string | null;
  history: unknown;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_by_first_name: string | null;
  created_by_last_name: string | null;
  updated_by: string | null;
  updated_by_first_name: string | null;
  updated_by_last_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  display_category: string | null;
}

// Transform database row to API format
const transformDocument = (databaseDocument: DatabaseDocument): Document => ({
  id: databaseDocument.id,
  meetingId: databaseDocument.meeting_id ?? "",
  taskId: databaseDocument.task_id ?? undefined,
  title: databaseDocument.title ?? "",
  description: databaseDocument.description ?? undefined,
  type: databaseDocument.type ?? "",
  filePath: databaseDocument.file_path ?? "",
  fileType: databaseDocument.file_type ?? "",
  fileSize: databaseDocument.file_size ?? 0,
  status: (databaseDocument.status as Document["status"]) || "DRAFT",
  uploadDate: databaseDocument.upload_date ?? undefined,
  uploadedDate: databaseDocument.uploaded_date ?? undefined,
  signedDate: databaseDocument.signed_date ?? undefined,
  authorizedDate: databaseDocument.authorized_date ?? undefined,
  completedDate: databaseDocument.completed_date ?? undefined,
  inProgressDate: databaseDocument.in_progress_date ?? undefined,
  deadline: databaseDocument.deadline ?? undefined,
  history: databaseDocument.history as Record<string, unknown> | undefined,
  approvedBy: databaseDocument.approved_by ?? undefined,
  approvedAt: databaseDocument.approved_at ?? undefined,
  createdBy: databaseDocument.created_by ?? undefined,
  createdByFirstName: databaseDocument.created_by_first_name ?? undefined,
  createdByLastName: databaseDocument.created_by_last_name ?? undefined,
  updatedBy: databaseDocument.updated_by ?? undefined,
  updatedByFirstName: databaseDocument.updated_by_first_name ?? undefined,
  updatedByLastName: databaseDocument.updated_by_last_name ?? undefined,
  createdAt: databaseDocument.created_at ?? undefined,
  updatedAt: databaseDocument.updated_at ?? undefined,
  displayCategory:
    databaseDocument.display_category as Document["displayCategory"],
});

export function useDocumentSync({
  meetingId,
  onDocumentAdded,
  onDocumentUpdated,
  onDocumentDeleted,
}: UseDocumentSyncOptions) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getBrowserSupabase();

  // Fetch initial documents
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const API_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
      const response = await fetch(
        `${API_URL}/meetings/${meetingId}/documents`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      setDocuments(data);
    } catch (error_) {
      setError(
        Error.isError(error_) ? error_.message : "Failed to load documents"
      );
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  // Set up real-time subscription
  useEffect(() => {
    void fetchDocuments();

    const channel = supabase.channel(`documents:${meetingId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "document",
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload: RealtimePostgresInsertPayload<DatabaseDocument>) => {
          const newDocument = transformDocument(payload.new);
          setDocuments((previous) => [...previous, newDocument]);
          onDocumentAdded?.(newDocument);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "document",
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload: RealtimePostgresUpdatePayload<DatabaseDocument>) => {
          const updatedDocument = transformDocument(payload.new);
          setDocuments((previous) =>
            previous.map((document_) =>
              document_.id === updatedDocument.id ? updatedDocument : document_
            )
          );
          onDocumentUpdated?.(updatedDocument);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "document",
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload: RealtimePostgresDeletePayload<DatabaseDocument>) => {
          const deletedId = payload.old.id;
          if (deletedId === undefined) {
            return;
          }

          setDocuments((previous) =>
            previous.filter((document_) => document_.id !== deletedId)
          );
          onDocumentDeleted?.(deletedId);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    meetingId,
    supabase,
    onDocumentAdded,
    onDocumentUpdated,
    onDocumentDeleted,
    fetchDocuments,
  ]);

  // Manual refresh function
  const refresh = useCallback(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  // Optimistic update for uploads
  const addOptimisticDocument = useCallback(
    (document: Partial<Document>) => {
      const optimisticDocument: Document = {
        id: `temp-${Date.now()}`,
        meetingId,
        title: document.title ?? "Uploading...",
        type: document.type ?? "UNKNOWN",
        filePath: "",
        fileType: "",
        fileSize: 0,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...document,
      };

      setDocuments((previous) => [...previous, optimisticDocument]);
      return optimisticDocument.id;
    },
    [meetingId]
  );

  const removeOptimisticDocument = useCallback((temporaryId: string) => {
    setDocuments((previous) =>
      previous.filter((document_) => document_.id !== temporaryId)
    );
  }, []);

  return {
    documents,
    isLoading,
    error,
    refresh,
    addOptimisticDocument,
    removeOptimisticDocument,
  };
}
