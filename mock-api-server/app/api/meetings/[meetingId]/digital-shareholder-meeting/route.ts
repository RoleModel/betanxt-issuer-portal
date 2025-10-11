// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-30T00:31:43.170Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { supabase } from '@/utils/supabase/client'

// In-memory storage for uploaded attendees (in production this would use a database)
interface StoredAttendee {
  id: string
  meetingId: string
  registrantType: string
  firstName: string
  lastName: string
  emailAddress: string
  registrationQuestions?: unknown
  minutesAttendedMeeting?: number
  createdAt: string
  updatedAt: string
}

const attendeeStorage = new Map<string, StoredAttendee[]>()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
): Promise<NextResponse> {
  try {
    const { meetingId } = await params

    // Try to get from database first (for seeded data)
    try {
      const { data, error } = await supabase
        .from('digital_shareholder_meeting_attendee')
        .select('*')
        .eq('meeting_id', meetingId)

      if (!error && data) {
        return NextResponse.json(data)
      }
    } catch (_dbError) {
      // Database table might not exist yet, fall back to in-memory storage
    }

    // For uploaded data, return stored attendees or empty array
    const storedAttendees = attendeeStorage.get(meetingId) || []
    return NextResponse.json(storedAttendees)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'getDigitalShareholderMeeting',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
): Promise<NextResponse> {
  try {
    const { meetingId } = await params
    const body = await request.json()

    // Validate the request body
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be an array of attendees' },
        { status: 400 }
      )
    }

    // Process and store the attendees
    const attendees = body.map((attendee, index) => ({
      id: `${meetingId}-${Date.now()}-${index}`,
      meetingId,
      registrantType: attendee.registrantType ?? 'Shareholder',
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      emailAddress: attendee.emailAddress,
      registrationQuestions: attendee.registrationQuestions || undefined,
      minutesAttendedMeeting: attendee.minutesAttendedMeeting || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    // Store in memory (in production this would go to database)
    const existingAttendees = attendeeStorage.get(meetingId) || []
    attendeeStorage.set(meetingId, [...existingAttendees, ...attendees])

    return NextResponse.json(attendees, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'createDigitalShareholderMeetingAttendees',
      },
      { status: 500 }
    )
  }
}
