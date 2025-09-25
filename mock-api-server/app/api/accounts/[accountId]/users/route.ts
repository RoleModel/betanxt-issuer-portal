// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-25T18:35:57.313Z
// Source: openapi-schema/openapi.yaml

import { NextRequest, NextResponse } from 'next/server'
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
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'listAccountUsers'
      },
      { status: 500 }
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

    return NextResponse.json({}, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'createAccountUser'
      },
      { status: 500 }
    )
  }
}

