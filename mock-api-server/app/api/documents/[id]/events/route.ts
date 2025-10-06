import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { supabase } from '@/utils/supabase/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('document_history')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch document history', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'getDocumentEvents',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    const { eventType, metadata } = body

    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing required field: eventType' },
        { status: 400 }
      )
    }

    // Get user from request headers or use a default
    // In production, this would come from authenticated session
    const userId = request.headers.get('x-user-id') || 'system'
    const userName = request.headers.get('x-user-name') || 'System User'

    // Insert event into database
    const { data, error } = await supabase
      .from('document_history')
      .insert({
        id: crypto.randomUUID(),
        document_id: id,
        event_type: eventType,
        user_id: userId,
        user_name: userName,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to add event', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'addDocumentEvent',
      },
      { status: 500 }
    )
  }
}
