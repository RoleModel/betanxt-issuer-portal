// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-19T00:30:45.097Z
// Source: openapi-schema/openapi.yaml
import { NextRequest, NextResponse } from 'next/server'

import { listUserAccounts } from '@/domain-models/api/accounts'

interface _RouteParams {
  id: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<_RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params
    const userId = resolvedParams.id

    // Use existing domain model function
    const { data, error } = await listUserAccounts(userId)

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
        operationId: 'listUserAccounts',
      },
      { status: 500 }
    )
  }
}
