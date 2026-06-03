// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.942Z
// Source: openapi-schema/openapi.yaml
import { NextResponse } from "next/server";

import { handleCors, withCors } from "@/utils/cors";

export async function GET(): Promise<NextResponse> {
  try {
    // TODO: Implement getDocumentComments
    // Operation: getDocumentComments
    // This route was auto-generated from OpenAPI spec

    // Example: Fetch data from Supabase
    // const { data, error } = await supabase
    //   .from('table_name')
    //   .select('*')
    //   .eq('id', id)

    return withCors(NextResponse.json([]));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
          operationId: "getDocumentComments",
        },
        { status: 500 },
      ),
    );
  }
}

export async function POST(): Promise<NextResponse> {
  try {
    // TODO: Implement addComment
    // Operation: addComment
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
          operationId: "addComment",
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
