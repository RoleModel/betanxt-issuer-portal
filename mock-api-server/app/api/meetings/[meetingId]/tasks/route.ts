// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-19T00:30:45.098Z
// Source: openapi-schema/openapi.yaml
import { NextRequest, NextResponse } from 'next/server'

import { createTask, listTasks } from '@/domain-models/api/tasks'

import type { components } from '@/types/api'

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
    const phaseId = searchParams.get('phaseId') || undefined
    const status = searchParams.get('status') || undefined
    const _owner = searchParams.get('owner') || undefined

    // Use existing domain model function
    const { data, error } = await listTasks(meetingId, { phaseId, status })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /meetings/{meetingId}/tasks:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'listTasks',
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
    const body = (await request.json()) as components['schemas']['CreateTaskRequest']

    // Use existing domain model function
    const { data, error } = await createTask(meetingId, body)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 400 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /meetings/{meetingId}/tasks:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'createTask',
      },
      { status: 500 }
    )
  }
}
