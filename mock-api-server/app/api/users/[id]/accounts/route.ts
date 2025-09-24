// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-24T18:54:16.940Z
// Source: openapi-schema/openapi.yaml

import { NextRequest, NextResponse } from 'next/server'
import { listUserAccounts } from '@/domain-models/api/accounts'

interface RouteParams {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params
    const id = resolvedParams.id

    // Use existing domain model function
    const { data, error } = await listUserAccounts(id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /users/{id}/accounts:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'listUserAccounts'
      },
      { status: 500 }
    )
  }
}

