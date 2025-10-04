// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-30T00:31:43.170Z
// Source: openapi-schema/openapi.yaml
import { NextResponse } from 'next/server'

import { getMailingByMeetingId } from '@/domain-models/api/mailing'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
): Promise<NextResponse> {
  try {
    const { meetingId } = await params

    if (!meetingId) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'meetingId parameter is required',
          operationId: 'getMailingStatistics',
        },
        { status: 400 }
      )
    }

    const result = await getMailingByMeetingId(meetingId)

    if (result.error) {
      const statusCode = result.error.statusCode || 500
      return NextResponse.json(
        {
          error: statusCode === 404 ? 'Not Found' : 'Internal server error',
          message: result.error.message,
          operationId: 'getMailingStatistics',
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'getMailingStatistics',
      },
      { status: 500 }
    )
  }
}
