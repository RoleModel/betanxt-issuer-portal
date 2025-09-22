// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-19T00:30:45.097Z
// Source: openapi-schema/openapi.yaml
import { NextRequest, NextResponse } from 'next/server'

import { createMeeting, listMeetings } from '@/domain-models/api/meetings'

import type { components } from '@/types/api'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!, 10)
      : undefined
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : undefined
    const status = searchParams.get('status') as
      | components['schemas']['MeetingStatus']
      | undefined
    const clientId = searchParams.get('clientId') || undefined
    const meetingYear = searchParams.get('meetingYear')
      ? parseInt(searchParams.get('meetingYear')!, 10)
      : undefined
    const cusip = searchParams.get('cusip') || undefined
    const ticker = searchParams.get('ticker') || undefined

    // Use existing domain model function
    const { data, error } = await listMeetings(page, limit, {
      status,
      clientId,
      meetingYear,
      cusip,
      ticker,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /meetings:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'listMeetings',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = (await request.json()) as components['schemas']['CreateMeetingRequest']

    // Use existing domain model function
    const { data, error } = await createMeeting(body)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 400 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /meetings:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'createMeeting',
      },
      { status: 500 }
    )
  }
}
