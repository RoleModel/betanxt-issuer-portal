// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-30T00:31:43.167Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createDocument, listDocuments } from '@/domain-models/api/documents'

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
    const statusParam = searchParams.get('status') || undefined
    const status: 'ACTIVE' | 'COMPLETE' | 'ADJOURNED' | undefined =
      statusParam && ['ACTIVE', 'COMPLETE', 'ADJOURNED'].includes(statusParam)
        ? (statusParam as 'ACTIVE' | 'COMPLETE' | 'ADJOURNED')
        : undefined
    const typeParam = searchParams.get('type') || undefined
    const type: 'ADMIN' | 'ISSUER' | 'RELATIONSHIP_MANAGER' | undefined =
      typeParam && ['ADMIN', 'ISSUER', 'RELATIONSHIP_MANAGER'].includes(typeParam)
        ? (typeParam as 'ADMIN' | 'ISSUER' | 'RELATIONSHIP_MANAGER')
        : undefined

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
    const body = (await request.json()) as components['schemas']['CreateDocumentRequest']

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
