// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-19T00:30:45.097Z
// Source: openapi-schema/openapi.yaml
import { NextRequest, NextResponse } from 'next/server'

import { deleteUser, getUserById, updateUser } from '@/domain-models/api/users'

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
    const { data, error } = await getUserById(id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /users/{id}:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'getUserById',
      },
      { status: 500 }
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
    const body = (await request.json()) as components['schemas']['UpdateUserRequest']

    // Use existing domain model function
    const { data, error } = await updateUser(id, body)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /users/{id}:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'updateUser',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params
    const id = resolvedParams.id

    // Use existing domain model function
    const { data, error } = await deleteUser(id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in DELETE /users/{id}:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'deleteUser',
      },
      { status: 500 }
    )
  }
}
