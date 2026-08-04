// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-22T18:38:17.317Z
// Source: openapi-schema/openapi.yaml
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database, Json } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";

interface RouteParameters {
  id: string;
}

interface HistoryEvent {
  id: string;
  event_type: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

type DocumentHistoryEventType = NonNullable<
  Database["public"]["Tables"]["document_history"]["Row"]["event_type"]
>;

const documentHistoryEventTypes = new Set<DocumentHistoryEventType>([
  "APPROVED",
  "COMMENTED",
  "CREATED",
  "DELETED",
  "DOWNLOADED",
  "REJECTED",
  "SIGNED",
  "UPDATED",
  "UPLOADED",
  "VIEWED",
]);

function toDocumentHistoryEventType(
  value: string | undefined
): DocumentHistoryEventType {
  return value !== undefined &&
    documentHistoryEventTypes.has(value as DocumentHistoryEventType)
    ? (value as DocumentHistoryEventType)
    : "CREATED";
}

function toMetadata(value: Json | null): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value
    : undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParameters> }
): Promise<NextResponse> {
  try {
    const resolvedParameters = await params;
    const documentId = resolvedParameters.id;

    // Get history for this document from database
    const { data: history, error: databaseError } = await supabase
      .from("document_history")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });

    if (databaseError) {
      throw new Error(`Database error: ${databaseError.message}`);
    }

    // Transform database records to API format
    const historyEvents: HistoryEvent[] = (history || []).map((record) => ({
      id: record.id ?? "",
      event_type: record.event_type ?? "CREATED",
      user: record.user ?? "current-user",
      timestamp: record.created_at ?? "",
      metadata: toMetadata(record.metadata),
    }));

    return NextResponse.json(historyEvents);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        message: Error.isError(error) ? error.message : "Unknown error",
        operationId: "getDocumentHistory",
      },
      { status: 500 }
    );
  }
}

interface HistoryEventRequest {
  event_type?: string;
  eventType?: string;
  user?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParameters> }
): Promise<NextResponse> {
  try {
    const resolvedParameters = await params;
    const documentId = resolvedParameters.id;
    const body = (await request.json()) as HistoryEventRequest;

    // Insert new history event into database
    const { data, error: databaseError } = await supabase
      .from("document_history")
      .insert({
        document_id: documentId,
        event_type: toDocumentHistoryEventType(
          body.event_type ?? body.eventType
        ),
        user: body.user ?? "current-user",
        created_at: new Date().toISOString(),
        metadata: JSON.parse(JSON.stringify(body.metadata ?? {})) as Json,
      })
      .select()
      .single();

    if (databaseError || data === null) {
      throw new Error(
        `Database error: ${databaseError?.message ?? "No history event returned"}`
      );
    }

    // Transform database record to API format
    const newEvent: HistoryEvent = {
      id: data.id ?? "",
      event_type: data.event_type ?? "CREATED",
      user: data.user ?? "current-user",
      timestamp: data.created_at ?? "",
      metadata: toMetadata(data.metadata),
    };

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        message: Error.isError(error) ? error.message : "Unknown error",
        operationId: "addDocumentHistory",
      },
      { status: 500 }
    );
  }
}
