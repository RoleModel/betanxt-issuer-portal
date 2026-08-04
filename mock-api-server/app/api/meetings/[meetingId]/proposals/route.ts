// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.942Z
// Source: openapi-schema/openapi.yaml
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { components } from "@/types/api";

import { createProposal, listProposals } from "@/domain-models/api/proposals";
import { handleCors, withCors } from "@/utils/cors";

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
    const { data, error } = await listProposals(meetingId);

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
          operationId: "listProposals",
        },
        { status: 500 }
      )
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParameters> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParameters = await params;
    const { meetingId } = resolvedParameters;

    // Parse request body
    const body =
      (await request.json()) as components["schemas"]["CreateProposalRequest"];

    // Use existing domain model function
    const { data, error } = await createProposal(meetingId, body);

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
          operationId: "createProposal",
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
