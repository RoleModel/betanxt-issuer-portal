// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-30T00:31:43.171Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { createPositionVote } from '@/domain-models/api/votes'

import type { components } from '@/types/api'

export async function GET(): Promise<NextResponse> {
  try {
    // TODO: Implement getPositionVotes
    // Operation: getPositionVotes
    // This route was auto-generated from OpenAPI spec

    // Example: Fetch data from Supabase
    // const { data, error } = await supabase
    //   .from('table_name')
    //   .select('*')
    //   .limit(20)

    return NextResponse.json([])
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'getPositionVotes',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = (await request.json()) as components['schemas']['CastVoteRequest']

    // Use existing domain model function
    const { data, error } = await createPositionVote(body)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 400 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'createPositionVote',
      },
      { status: 500 }
    )
  }
}
