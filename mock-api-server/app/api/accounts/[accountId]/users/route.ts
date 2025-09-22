// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-19T00:30:45.095Z
// Source: openapi-schema/openapi.yaml
import { NextRequest, NextResponse } from 'next/server'

import { listAccountUsers } from '@/domain-models/api/users'

import type { components } from '@/types/api'

interface _RouteParams {
  accountId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params
    const { accountId } = resolvedParams

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const _type = searchParams.get('type') || undefined

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
    console.error('Error in GET /accounts/{accountId}/users:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'listAccountUsers',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params: _params }: { params: Promise<{ accountId: string }> }
): Promise<NextResponse> {
  try {
    // Parse request body
    const body =
      (await request.json()) as components['schemas']['CreateAccountUserRequest']

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
        operationId: 'createAccountUser',
      },
      { status: 500 }
    )
  }
}
