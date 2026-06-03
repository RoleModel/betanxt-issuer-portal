// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.938Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import type { components } from "@/types/api";

import { createUser, listUsers } from "@/domain-models/api/users";
import { handleCors, withCors } from "@/utils/cors";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type") || undefined;
    const type: "ADMIN" | "ISSUER" | "RELATIONSHIP_MANAGER" | undefined =
      typeParam && ["ADMIN", "ISSUER", "RELATIONSHIP_MANAGER"].includes(typeParam)
        ? (typeParam as "ADMIN" | "ISSUER" | "RELATIONSHIP_MANAGER")
        : undefined;
    const accountId = searchParams.get("accountId") || undefined;

    // Use existing domain model function
    const { data, error } = await listUsers(accountId, type);

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
          operationId: "listUsers",
        },
        { status: 500 },
      ),
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = (await request.json()) as components["schemas"]["CreateUserRequest"];

    // Use existing domain model function
    const { data, error } = await createUser(body);

    if (error) {
      return withCors(
        NextResponse.json({ error: error.message }, { status: error.statusCode || 400 }),
      );
    }

    return withCors(NextResponse.json(data, { status: 201 }));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
          operationId: "createUser",
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
