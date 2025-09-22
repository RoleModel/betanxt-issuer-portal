// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-19T00:30:45.094Z
// Source: openapi-schema/openapi.yaml
import { NextRequest, NextResponse } from 'next/server'

import { createAccount, listAccounts } from '@/domain-models/api/accounts'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Use existing domain model function
    const { data, error } = await listAccounts()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /accounts:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'listAccounts',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = (await request.json()) as {
      name: string
      primaryContact: string
      clientId: string
    }

    // Use existing domain model function
    const { data, error } = await createAccount(body)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 400 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /accounts:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'createAccount',
      },
      { status: 500 }
    )
  }
}
