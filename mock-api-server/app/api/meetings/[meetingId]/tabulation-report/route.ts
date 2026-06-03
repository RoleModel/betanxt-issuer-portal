// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.941Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { getTabulationReport } from "@/domain-models/api/tabulationReports";
import { handleCors, withCors } from "@/utils/cors";

export const dynamic = "force-dynamic";

interface RouteParams {
  meetingId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> },
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params;
    const meetingId = resolvedParams.meetingId;

    // Use existing domain model function
    const { data, error } = await getTabulationReport(meetingId);

    if (error) {
      return withCors(
        NextResponse.json({ error: error.message }, { status: error.statusCode || 500 }),
      );
    }

    return withCors(NextResponse.json(data));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
          operationId: "getTabulationReport",
        },
        { status: 500 },
      ),
    );
  }
}

// Handle preflight requests
export function OPTIONS() {
  return handleCors();
}
