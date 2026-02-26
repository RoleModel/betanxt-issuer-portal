// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.936Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createAccount, listAccounts } from '@/domain-models/api/accounts'

import type { components } from '@/types/api'
import { handleCors, withCors } from '@/utils/cors'

export async function GET(): Promise<NextResponse> {
  try {
    // Use existing domain model function
    const { data, error } = await listAccounts()

    if (error) {
      return withCors(
        NextResponse.json({ error: error.message }, { status: error.statusCode || 500 })
      )
    }

    return withCors(NextResponse.json(data))
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          operationId: 'listAccounts',
        },
        { status: 500 }
      )
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = (await request.json()) as components['schemas']['CreateAccountRequest']

    // Use existing domain model function
    const { data, error } = await createAccount(body)

    if (error) {
      return withCors(
        NextResponse.json({ error: error.message }, { status: error.statusCode || 400 })
      )
    }

    return withCors(NextResponse.json(data, { status: 201 }))
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          operationId: 'createAccount',
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
