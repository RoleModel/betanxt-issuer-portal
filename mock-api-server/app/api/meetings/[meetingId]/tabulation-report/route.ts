// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-30T00:31:43.170Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getTabulationReport } from '@/domain-models/api/tabulationReports'

interface RouteParams {
  meetingId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params
    const meetingId = resolvedParams.meetingId

    // Use existing domain model function
    const { data, error } = await getTabulationReport(meetingId)

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
        operationId: 'getTabulationReport',
      },
      { status: 500 }
    )
  }
}
