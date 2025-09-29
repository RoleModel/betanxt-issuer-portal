// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-29T07:37:47.340Z
// Source: openapi-schema/openapi.yaml

import { NextRequest, NextResponse } from 'next/server'
import { listTasks, createTask } from '@/domain-models/api/tasks'
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
    const statusParam = searchParams.get('status') || undefined
    const status: 'ACTIVE' | 'COMPLETE' | 'ADJOURNED' | undefined = 
      statusParam && ['ACTIVE', 'COMPLETE', 'ADJOURNED'].includes(statusParam) 
        ? statusParam as 'ACTIVE' | 'COMPLETE' | 'ADJOURNED'
        : undefined

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
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'listTasks'
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
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'createTask'
      },
      { status: 500 }
    )
  }
}

