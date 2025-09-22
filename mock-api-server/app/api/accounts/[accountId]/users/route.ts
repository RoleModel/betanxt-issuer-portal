// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-22T18:38:17.313Z
// Source: openapi-schema/openapi.yaml

import { NextRequest, NextResponse } from 'next/server'
import { listAccountUsers } from '@/domain-models/api/users'

interface RouteParams {
  accountId: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined

    // Use existing domain model function
    const { data, error } = await listAccountUsers({ type })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /accounts/{accountId}/users:', error)
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json()

    // TODO: Implement createAccountUser
    // Operation: createAccountUser
    // This route was auto-generated from OpenAPI spec
    
    // Example: Insert data into Supabase
    // const { data, error } = await supabase
    //   .from('table_name')
    //   .insert(body)
    //   .select()

    return NextResponse.json(body, { status: 201 })
  } catch (error) {
    console.error('Error in POST /accounts/{accountId}/users:', error)
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

