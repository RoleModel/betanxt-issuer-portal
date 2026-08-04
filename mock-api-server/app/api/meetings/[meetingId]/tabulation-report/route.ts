// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.941Z
// Source: openapi-schema/openapi.yaml
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getTabulationReport } from "@/domain-models/api/tabulationReports";
import { handleCors, withCors } from "@/utils/cors";

export const dynamic = "force-dynamic";

interface RouteParameters {
  meetingId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParameters> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParameters = await params;
    const { meetingId } = resolvedParameters;

    // Use existing domain model function
    const { data, error } = await getTabulationReport(meetingId);

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
          operationId: "getTabulationReport",
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
