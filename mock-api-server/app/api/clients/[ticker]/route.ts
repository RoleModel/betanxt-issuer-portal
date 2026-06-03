// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.938Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import type { components } from "@/types/api";

import { deleteClient, getClientByTicker, updateClient } from "@/domain-models/api/clients";
import { handleCors, withCors } from "@/utils/cors";

interface RouteParams {
  ticker: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> },
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params;
    const ticker = resolvedParams.ticker;

    // Use existing domain model function
    const { data, error } = await getClientByTicker(ticker);

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
          operationId: "getClientByTicker",
        },
        { status: 500 },
      ),
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> },
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params;
    const ticker = resolvedParams.ticker;

    // Parse request body
    const body = (await request.json()) as components["schemas"]["UpdateClientRequest"];

    // Use existing domain model function
    const { data, error } = await updateClient(ticker, body);

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
          operationId: "updateClient",
        },
        { status: 500 },
      ),
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> },
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params;
    const ticker = resolvedParams.ticker;

    // Use existing domain model function
    const { data, error } = await deleteClient(ticker);

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
          operationId: "deleteClient",
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
