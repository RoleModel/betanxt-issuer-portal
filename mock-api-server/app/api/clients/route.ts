// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-30T00:31:43.166Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createClient, listClients } from '@/domain-models/api/clients'
import { handleCors, withCors } from '@/utils/cors'

import type { components } from '@/types/api'

// Handle preflight requests
export function OPTIONS() {
  return handleCors()
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get('ticker') || undefined

    // Use existing domain model function
    const { data, error } = await listClients(undefined, undefined, ticker)

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
          operationId: 'listClients',
        },
        { status: 500 }
      )
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = (await request.json()) as components['schemas']['CreateClientRequest']

    // Use existing domain model function
    const { data, error } = await createClient(body)

    if (error) {
      return withCors(
        NextResponse.json(
          { error: error.message },
          { status: error.statusCode || 400 }
        )
      )
    }

    return withCors(NextResponse.json(data, { status: 201 }))
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          operationId: 'createClient',
        },
        { status: 500 }
      )
    )
  }
}
