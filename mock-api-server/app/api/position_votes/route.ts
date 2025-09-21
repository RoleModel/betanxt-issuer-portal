// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-19T00:30:45.100Z
// Source: openapi-schema/openapi.yaml

import { NextRequest, NextResponse } from 'next/server'
import { createPositionVote } from '@/domain-models/api/votes'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const positionId = searchParams.get('positionId') || undefined
    const proposalId = searchParams.get('proposalId') || undefined
    const vote = searchParams.get('vote') || undefined
    const select = searchParams.get('select') || undefined
    const order = searchParams.get('order') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined

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
    console.error('Error in GET /position_votes:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'getPositionVotes'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json()

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
    console.error('Error in POST /position_votes:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'createPositionVote'
      },
      { status: 500 }
    )
  }
}

