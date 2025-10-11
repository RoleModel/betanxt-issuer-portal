import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { listKeyDatesForMeeting } from '@/domain-models/api/keyDates'

interface RouteParams {
  meetingId: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const { meetingId } = await params

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 })
    }

    const result = await listKeyDatesForMeeting(meetingId)

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode || 500 }
      )
    }

    return NextResponse.json(result.data || [])
  } catch {
    // Intentionally hide internal error details from client
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
