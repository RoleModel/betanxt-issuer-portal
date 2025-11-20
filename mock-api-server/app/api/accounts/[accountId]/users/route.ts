// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.937Z
// Source: openapi-schema/openapi.yaml

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { handleCors, withCors } from '@/utils/cors'
import { listAccountUsers } from '@/domain-models/api/users'

interface RouteParams {
  accountId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params
    const accountId = resolvedParams.accountId

    // Use existing domain model function
    const { data, error } = await listAccountUsers(accountId)

    if (error) {
      return withCors(
        NextResponse.json(
          { error: error.message },
          { status: error.statusCode || 500 }
        )
      )
    }

    return withCors(NextResponse.json(data))
  } catch (error) {
    return withCors(
      NextResponse.json(
        { 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          operationId: 'listAccountUsers'
        },
        { status: 500 }
      )
    )
  }
}

export async function POST(): Promise<NextResponse> {
  try {
    // TODO: Implement createAccountUser
    // Operation: createAccountUser
    // This route was auto-generated from OpenAPI spec
    
    // Parse request body
    // const body = await request.json()

    // Example: Insert data into Supabase
    // const { data, error } = await supabase
    //   .from('table_name')
    //   .insert(body)
    //   .select()

    return withCors(NextResponse.json({}, { status: 201 }))
  } catch (error) {
    return withCors(
      NextResponse.json(
        { 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          operationId: 'createAccountUser'
        },
        { status: 500 }
      )
    )
  }
}

// Handle preflight requests
export function OPTIONS() {
  return handleCors()
}
