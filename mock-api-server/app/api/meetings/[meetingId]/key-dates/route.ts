import { NextRequest, NextResponse } from 'next/server'

import { listKeyDatesForMeeting } from '@/domain-models/api/keyDates'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const { meetingId } = resolvedParams

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
  } catch (error) {
    console.error('Error in key dates API route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
