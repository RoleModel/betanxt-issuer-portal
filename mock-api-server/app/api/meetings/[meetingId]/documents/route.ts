// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-19T00:30:45.099Z
// Source: openapi-schema/openapi.yaml
import { NextRequest, NextResponse } from 'next/server'

import { createDocument, listDocuments } from '@/domain-models/api/documents'

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

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const type = searchParams.get('type') || undefined

    // Use existing domain model function
    const { data, error } = await listDocuments(meetingId, { status, type })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /meetings/{meetingId}/documents:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'listDocuments',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params
    const meetingId = resolvedParams.meetingId

    // Parse request body
    const body = (await request.json()) as {
      title: string
      description?: string
      type: string
      taskId?: string
      file: string
    }

    // Use existing domain model function
    const { data, error } = await createDocument(meetingId, body)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 400 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /meetings/{meetingId}/documents:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'createDocument',
      },
      { status: 500 }
    )
  }
}
