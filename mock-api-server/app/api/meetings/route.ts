// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.939Z
// Source: openapi-schema/openapi.yaml
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { components } from "@/types/api";

import { createMeeting, listMeetings } from "@/domain-models/api/meetings";
import { handleCors, withCors } from "@/utils/cors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!, 10)
      : undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const statusParameter = searchParams.get("status") || undefined;
    const status: "ACTIVE" | "COMPLETE" | "ADJOURNED" | undefined =
      statusParameter &&
      ["ACTIVE", "COMPLETE", "ADJOURNED"].includes(statusParameter)
        ? (statusParameter as "ACTIVE" | "COMPLETE" | "ADJOURNED")
        : undefined;
    const clientId = searchParams.get("clientId") || undefined;
    const meetingYear = searchParams.get("meetingYear")
      ? parseInt(searchParams.get("meetingYear")!, 10)
      : undefined;
    const cusip = searchParams.get("cusip") || undefined;
    const ticker = searchParams.get("ticker") || undefined;

    // Use existing domain model function
    const { data, error } = await listMeetings(page, limit, {
      status,
      clientId,
      meetingYear,
      cusip,
      ticker,
    });

    if (error) {
      return withCors(
        NextResponse.json(
          { error: error.message },
          { status: error.statusCode || 500 }
        )
      );
    }

    return withCors(NextResponse.json(data));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: Error.isError(error) ? error.message : "Unknown error",
          operationId: "listMeetings",
        },
        { status: 500 }
      )
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body =
      (await request.json()) as components["schemas"]["CreateMeetingRequest"];

    // Use existing domain model function
    const { data, error } = await createMeeting(body);

    if (error) {
      return withCors(
        NextResponse.json(
          { error: error.message },
          { status: error.statusCode || 400 }
        )
      );
    }

    return withCors(NextResponse.json(data, { status: 201 }));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: Error.isError(error) ? error.message : "Unknown error",
          operationId: "createMeeting",
        },
        { status: 500 }
      )
    );
  }
}

// Handle preflight requests
export function OPTIONS() {
  return handleCors();
}
