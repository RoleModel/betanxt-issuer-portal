// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.941Z
// Source: openapi-schema/openapi.yaml
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { components } from "@/types/api";

import { createPosition, listPositions } from "@/domain-models/api/positions";
import { handleCors, withCors } from "@/utils/cors";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId") || undefined;
    const voteStatusParameter = searchParams.get("voteStatus") || undefined;
    const voteStatus: "Voted" | "Unvoted" | undefined =
      voteStatusParameter && ["Voted", "Unvoted"].includes(voteStatusParameter)
        ? (voteStatusParameter as "Voted" | "Unvoted")
        : undefined;
    const accountType = searchParams.get("accountType") || undefined;
    const order = searchParams.get("order") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : undefined;

    // Use existing domain model function
    const { data, error } = await listPositions({
      limit,
      meetingId,
      voteStatus,
      accountType,
      order,
      offset,
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
          operationId: "listPositions",
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
      (await request.json()) as components["schemas"]["CreatePositionRequest"];

    // Use existing domain model function
    const { data, error } = await createPosition(body);

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
          operationId: "createPosition",
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
