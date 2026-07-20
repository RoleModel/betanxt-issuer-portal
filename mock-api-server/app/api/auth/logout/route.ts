// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.936Z
// Source: openapi-schema/openapi.yaml
import { NextResponse } from "next/server";

import { handleCors, withCors } from "@/utils/cors";

export async function POST(): Promise<NextResponse> {
  try {
    // TODO: Implement logoutUser
    // Operation: logoutUser
    // This route was auto-generated from OpenAPI spec

    // Parse request body
    // const body = await request.json()

    // Example: Insert data into Supabase
    // const { data, error } = await supabase
    //   .from('table_name')
    //   .insert(body)
    //   .select()

    return withCors(NextResponse.json({}, { status: 201 }));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
          operationId: "logoutUser",
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
