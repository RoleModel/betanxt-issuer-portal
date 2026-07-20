// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.937Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import type { components } from "@/types/api";

import {
  deleteAccount,
  getAccountById,
  updateAccount,
} from "@/domain-models/api/accounts";
import { handleCors, withCors } from "@/utils/cors";

interface RouteParams {
  accountId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params;
    const accountId = resolvedParams.accountId;

    // Use existing domain model function
    const { data, error } = await getAccountById(accountId);

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
          operationId: "getAccountById",
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
    const accountId = resolvedParams.accountId;

    // Parse request body
    const body =
      (await request.json()) as components["schemas"]["UpdateAccountRequest"];

    // Use existing domain model function
    const { data, error } = await updateAccount(accountId, body);

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
          operationId: "updateAccount",
        },
        { status: 500 }
      )
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params;
    const accountId = resolvedParams.accountId;

    // Use existing domain model function
    const { data, error } = await deleteAccount(accountId);

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
          operationId: "deleteAccount",
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
