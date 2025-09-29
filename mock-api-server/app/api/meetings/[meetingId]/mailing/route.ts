// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-29T07:37:47.341Z
// Source: openapi-schema/openapi.yaml

import { NextRequest, NextResponse } from 'next/server'
import { getMailingByMeetingId } from '@/domain-models/api/mailing'

export async function GET(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
): Promise<NextResponse> {
  try {
    const { meetingId } = params

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    const result = await getMailingByMeetingId(meetingId)

    if (result.error) {
      return NextResponse.json(
        {
          error: 'Failed to fetch mailing data',
          message: result.error.message,
          operationId: 'getMailingStatistics'
        },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'getMailingStatistics'
      },
      { status: 500 }
    )
  }
}

