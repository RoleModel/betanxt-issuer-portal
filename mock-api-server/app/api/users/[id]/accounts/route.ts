// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.938Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { listUserAccounts } from "@/domain-models/api/accounts";
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
    const { data, error } = await listUserAccounts(id);

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
          operationId: "listUserAccounts",
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
