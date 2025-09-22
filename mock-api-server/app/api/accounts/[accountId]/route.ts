// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-19T00:30:45.095Z
// Source: openapi-schema/openapi.yaml
import { NextRequest, NextResponse } from 'next/server'

import {
  deleteAccount,
  getAccountById,
  updateAccount,
} from '@/domain-models/api/accounts'

interface RouteParams {
  accountId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    // Extract path parameters
    const resolvedParams = await params
    const accountId = resolvedParams.accountId

    // Use existing domain model function
    const { data, error } = await getAccountById(accountId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /accounts/{accountId}:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'getAccountById',
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
    const accountId = resolvedParams.accountId

    // Parse request body
    const body = (await request.json()) as {
      name?: string
      primaryContact?: string
      clientId?: string
    }

    // Use existing domain model function
    const { data, error } = await updateAccount(accountId, body)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /accounts/{accountId}:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'updateAccount',
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
    const accountId = resolvedParams.accountId

    // Use existing domain model function
    const { data, error } = await deleteAccount(accountId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in DELETE /accounts/{accountId}:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'deleteAccount',
      },
      { status: 500 }
    )
  }
}
