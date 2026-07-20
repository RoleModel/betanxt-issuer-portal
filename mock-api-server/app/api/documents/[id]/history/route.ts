// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-22T18:38:17.317Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { supabase } from "@/utils/supabase/client";

interface RouteParams {
  id: string;
}

interface HistoryEvent {
  id: string;
  event_type: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    // Get history for this document from database
    const { data: history, error: dbError } = await supabase
      .from("document_history")
      .select("*")
      .eq("document_id", documentId)
      .order("timestamp", { ascending: false });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Transform database records to API format
    const historyEvents: HistoryEvent[] = (history || []).map((record) => ({
      id: record.id,
      event_type: record.event_type,
      user: record.user,
      timestamp: record.timestamp,
      metadata: record.metadata || undefined,
    }));

    return NextResponse.json(historyEvents);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
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
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const documentId = resolvedParams.id;
    const body = (await request.json()) as HistoryEventRequest;

    // Insert new history event into database
    const { data, error: dbError } = await supabase
      .from("document_history")
      .insert({
        document_id: documentId,
        event_type: (body.event_type || body.eventType) ?? "unknown",
        user: body.user ?? "current-user",
        timestamp: new Date().toISOString(),
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Transform database record to API format
    const newEvent: HistoryEvent = {
      id: data.id,
      event_type: data.event_type,
      user: data.user,
      timestamp: data.timestamp,
      metadata: data.metadata || undefined,
    };

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        operationId: "addDocumentHistory",
      },
      { status: 500 }
    );
  }
}
