// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.942Z
// Source: openapi-schema/openapi.yaml
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { components } from "@/types/api";

import {
  createPositionVote,
  listPositionVotes,
} from "@/domain-models/api/votes";
import { handleCors, withCors } from "@/utils/cors";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId") || undefined;
    const positionId = searchParams.get("positionId") || undefined;
    const proposalId = searchParams.get("proposalId") || undefined;
    const vote = searchParams.get("vote") || undefined;
    const order = searchParams.get("order") || undefined;
    const limit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit") || "", 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? Number.parseInt(searchParams.get("offset") || "", 10)
      : undefined;

    const { data, error } = await listPositionVotes({
      meetingId,
      positionId,
      proposalId,
      vote,
      order,
      limit,
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

    return withCors(NextResponse.json(data || []));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: Error.isError(error) ? error.message : "Unknown error",
          operationId: "getPositionVotes",
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
      (await request.json()) as components["schemas"]["CastVoteRequest"];

    // Use existing domain model function
    const { data, error } = await createPositionVote(body);

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
          operationId: "createPositionVote",
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
