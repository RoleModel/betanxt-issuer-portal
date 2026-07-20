// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.941Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import type { components } from "@/types/api";

import { getPositionById, updatePosition } from "@/domain-models/api/positions";
import { handleCors, withCors } from "@/utils/cors";

interface RouteParams {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Use existing domain model function
    const { data, error } = await getPositionById(id);

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
          message: error instanceof Error ? error.message : "Unknown error",
          operationId: "getPositionById",
        },
        { status: 500 }
      )
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Parse request body
    const body =
      (await request.json()) as components["schemas"]["UpdatePositionRequest"];

    // Use existing domain model function
    const { data, error } = await updatePosition(id, body);

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
          message: error instanceof Error ? error.message : "Unknown error",
          operationId: "updatePosition",
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
