import type { components } from "@/domain-models/generated-schema";

import buildApiClient from "@/domain-models/apiClient";
import { getBrowserSupabase } from "@/lib/browserSupabase";

export type Document = components["schemas"]["Document"];

export interface UploadVersionParams {
  meetingId: string;
  documentType: string;
  file: File;
  versionNotes?: string;
}

export interface DocumentRepository {
  listByMeeting(meetingId: string): Promise<Document[]>;
  get(id: string): Promise<Document | null>;
  uploadVersion(params: UploadVersionParams): Promise<Document | null>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

class DefaultDocumentRepository implements DocumentRepository {
  async listByMeeting(meetingId: string): Promise<Document[]> {
    // Prefer API (if implemented in mock-api-server) else fallback to direct table query
    try {
      const api = await buildApiClient();
      const { data } = await api.GET("/meetings/{meetingId}/documents", {
        params: { path: { meetingId } },
      });
      if (data) {
        return data;
      }
    } catch (error) {
      console.warn("listByMeeting API fallback", error);
    }

    const supabase = getBrowserSupabase();
    const { data, error } = await supabase
      .from("document")
      .select("*")
      .eq("meeting_id", meetingId);
    if (error) {
      console.error("Supabase documents query failed", error);
      return [];
    }
    return (data ?? []).map((doc) => this.mapRow(doc));
  }

  async get(id: string): Promise<Document | null> {
    try {
      const api = await buildApiClient();
      const { data } = await api.GET("/documents/{id}", {
        params: { path: { id } },
      });
      if (data) return data;
    } catch (error) {
      console.warn("get API fallback", error);
    }
    const supabase = getBrowserSupabase();
    const { data, error } = await supabase
      .from("document")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return this.mapRow(data);
  }

  async uploadVersion(params: UploadVersionParams): Promise<Document | null> {
    const { meetingId, documentType, file, versionNotes } = params;
    // Use new Next.js route first (server path under /api)
    try {
      const form = new FormData();
      form.append("meetingId", meetingId);
      form.append("file", file);
      if (versionNotes && versionNotes.trim().length > 0) {
        form.append("versionNotes", versionNotes);
        form.append("title", versionNotes.trim());
      }
      const resp = await fetch(
        `/api/documents/types/${encodeURIComponent(documentType)}/upload`,
        {
          method: "POST",
          body: form,
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        return this.mapRow(data);
      }
      console.warn("Upload route returned non-OK, falling back", resp.status);
    } catch (error) {
      console.warn("Upload route error, falling back to direct storage", error);
    }

    // Fallback: direct storage then create document via API (minimal parity with existing DSM flow)
    const key = `fallback/${meetingId}/${Date.now()}_${file.name}`;
    const supabase = getBrowserSupabase();
    const { data: upData, error: upErr } = await supabase.storage
      .from("documents")
      .upload(key, file, {
        upsert: true,
        contentType: file.type ?? "application/octet-stream",
      });
    if (upErr || !upData) {
      console.error("Direct storage fallback failed", upErr);
      return null;
    }
    try {
      const api = await buildApiClient();
      const titleOverride =
        versionNotes && versionNotes.trim().length > 0
          ? versionNotes.trim()
          : file.name;
      const createBody: components["schemas"]["CreateDocumentRequest"] = {
        title: titleOverride,
        description:
          versionNotes && versionNotes.trim().length > 0
            ? versionNotes.trim()
            : undefined,
        type: documentType,
        file: upData.path,
      };
      const { data } = await api.POST("/meetings/{meetingId}/documents", {
        params: { path: { meetingId } },
        body: createBody,
      });
      if (data) return data;
    } catch (error) {
      console.error("Fallback create document failed", error);
    }
    return null;
  }

  private mapRow(value: unknown): Document {
    let record: Record<string, unknown> = {};
    if (isRecord(value)) {
      record = value;
    }

    const getString = (key: string): string | undefined => {
      const raw = record[key];
      return typeof raw === "string" ? raw : undefined;
    };

    const getNumber = (key: string): number | undefined => {
      const raw = record[key];
      return typeof raw === "number" ? raw : undefined;
    };

    const historyValue = record.history;
    const history = Array.isArray(historyValue)
      ? undefined
      : (historyValue as Record<string, unknown> | undefined);

    const statusValue = getString("status");

    return {
      id: getString("id") ?? "",
      meetingId: getString("meeting_id"),
      taskId: getString("task_id"),
      title: getString("title") ?? "",
      description: getString("description") ?? undefined,
      type: getString("type") ?? undefined,
      filePath: getString("file_path"),
      fileType: getString("file_type"),
      displayCategory: getString("display_category") as
        Document["displayCategory"] | undefined,
      fileSize: getNumber("file_size"),
      status: statusValue as Document["status"] | undefined,
      uploadDate: getString("upload_date"),
      uploadedDate: getString("uploaded_date"),
      signedDate: getString("signed_date"),
      authorizedDate: getString("authorized_date"),
      completedDate: getString("completed_date"),
      inProgressDate: getString("in_progress_date"),
      deadline: getString("deadline"),
      history,
      createdAt: getString("created_at"),
      updatedAt: getString("updated_at"),
      meeting: undefined,
      comments: undefined,
      signatures: undefined,
    };
  }
}

export const documentRepository: DocumentRepository =
  new DefaultDocumentRepository();
