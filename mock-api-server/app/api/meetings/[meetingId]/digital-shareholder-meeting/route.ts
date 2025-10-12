// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-30T00:31:43.170Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { supabase } from '@/utils/supabase/client'

interface IncomingAttendee {
  registrantType?: 'Shareholder' | 'Guest' | 'Proxy' | 'Other'
  firstName: string
  lastName: string
  emailAddress: string
  registrationQuestions?: string | null
  minutesAttendedMeeting?: number | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
): Promise<NextResponse> {
  try {
    const { meetingId } = await params

    const { data, error } = await supabase
      .from('digital_shareholder_meeting')
      .select('*')
      .eq('meeting_id', meetingId)

    if (error) {
      return NextResponse.json(
        { error: error.message, operationId: 'getDigitalShareholderMeeting' },
        { status: 500 }
      )
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedData = (data ?? []).map(row => ({
      id: row.id,
      meetingId: row.meeting_id,
      registrantType: row.registrant_type,
      firstName: row.first_name,
      lastName: row.last_name,
      emailAddress: row.email_address,
      registrationQuestions: row.registration_questions,
      minutesAttendedMeeting: row.minutes_attended_meeting,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json(transformedData)
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

    const rows = (body as IncomingAttendee[]).map((attendee) => ({
      id: crypto.randomUUID(), // Generate UUID for each participant
      meeting_id: meetingId,
      registrant_type: attendee.registrantType ?? 'Shareholder',
      first_name: attendee.firstName,
      last_name: attendee.lastName,
      email_address: attendee.emailAddress,
      registration_questions: attendee.registrationQuestions ?? null,
      minutes_attended_meeting: attendee.minutesAttendedMeeting ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('digital_shareholder_meeting')
      .insert(rows)
      .select('*')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to insert attendees', details: error.message },
        { status: 500 }
      )
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedData = (data ?? []).map(row => ({
      id: row.id,
      meetingId: row.meeting_id,
      registrantType: row.registrant_type,
      firstName: row.first_name,
      lastName: row.last_name,
      emailAddress: row.email_address,
      registrationQuestions: row.registration_questions,
      minutesAttendedMeeting: row.minutes_attended_meeting,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json(transformedData, { status: 201 })
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
