// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-30T00:31:43.169Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createPosition, listPositions } from '@/domain-models/api/positions'

import type { components } from '@/types/api'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meetingId') || undefined
    const voteStatusParam = searchParams.get('voteStatus') || undefined
    const voteStatus: 'Voted' | 'Unvoted' | undefined =
      voteStatusParam && ['Voted', 'Unvoted'].includes(voteStatusParam)
        ? (voteStatusParam as 'Voted' | 'Unvoted')
        : undefined
    const accountType = searchParams.get('accountType') || undefined
    const order = searchParams.get('order') || undefined
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : undefined
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!, 10)
      : undefined

    // Use existing domain model function
    const { data, error } = await listPositions({
      limit,
      meetingId,
      voteStatus,
      accountType,
      order,
      offset,
    })

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
        operationId: 'listPositions',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = (await request.json()) as components['schemas']['CreatePositionRequest']

    // Use existing domain model function
    const { data, error } = await createPosition(body)

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
        operationId: 'createPosition',
      },
      { status: 500 }
    )
  }
}
