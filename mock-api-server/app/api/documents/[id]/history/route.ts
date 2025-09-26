// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-22T18:38:17.317Z
// Source: openapi-schema/openapi.yaml
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  id: string
}

interface HistoryEvent {
  id: string
  event_type: string
  user: string
  timestamp: string
  metadata?: Record<string, unknown>
}

// In-memory storage for document history (in production, this would be in a database)
const documentHistory = new Map<string, HistoryEvent[]>()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const documentId = resolvedParams.id

    // Get history for this document
    const history = documentHistory.get(documentId) || []

    return NextResponse.json(history)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'getDocumentHistory',
      },
      { status: 500 }
    )
  }
}

interface HistoryEventRequest {
  event_type?: string
  eventType?: string
  user?: string
  metadata?: Record<string, unknown>
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const documentId = resolvedParams.id
    const body = (await request.json()) as HistoryEventRequest

    // Create a new history event
    const newEvent: HistoryEvent = {
      id: crypto.randomUUID(),
      event_type: body.event_type || body.eventType || 'unknown',
      user: body.user || 'current-user',
      timestamp: new Date().toISOString(),
      metadata: body.metadata || {},
    }

    // Add to document history
    const currentHistory = documentHistory.get(documentId) || []
    currentHistory.push(newEvent)
    documentHistory.set(documentId, currentHistory)

    return NextResponse.json(newEvent, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'addDocumentHistory',
      },
      { status: 500 }
    )
  }
}
