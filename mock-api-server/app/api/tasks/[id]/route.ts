// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-11-20T14:13:02.939Z
// Source: openapi-schema/openapi.yaml

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { handleCors, withCors } from '@/utils/cors'
import { getTaskById, updateTask } from '@/domain-models/api/tasks'
import type { components } from '@/types/api'

interface RouteParams {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params
    const id = resolvedParams.id

    // Use existing domain model function
    const { data, error } = await getTaskById(id)

    if (error) {
      return withCors(
        NextResponse.json(
          { error: error.message },
          { status: error.statusCode || 500 }
        )
      )
    }

    return withCors(NextResponse.json(data))
  } catch (error) {
    return withCors(
      NextResponse.json(
        { 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          operationId: 'getTaskById'
        },
        { status: 500 }
      )
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params
    const id = resolvedParams.id

    // Parse request body
    const body = (await request.json()) as components['schemas']['UpdateTaskRequest']

    // Use existing domain model function
    const { data, error } = await updateTask(id, body)

    if (error) {
      return withCors(
        NextResponse.json(
          { error: error.message },
          { status: error.statusCode || 500 }
        )
      )
    }

    return withCors(NextResponse.json(data))
  } catch (error) {
    return withCors(
      NextResponse.json(
        { 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          operationId: 'updateTask'
        },
        { status: 500 }
      )
    )
  }
}

// Handle preflight requests
export function OPTIONS() {
  return handleCors()
}
