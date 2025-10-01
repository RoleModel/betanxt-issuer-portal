import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '@/utils/supabase/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('comment')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch comments', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'getDocumentComments',
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

    // Extract comment data from request body
    const { comment, firstName, lastName, userId } = body

    if (!comment || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: comment and userId' },
        { status: 400 }
      )
    }

    // Insert comment into database
    const { data, error } = await supabase
      .from('comment')
      .insert({
        id: Date.now(), // Generate a unique ID using timestamp
        document_id: id,
        comment,
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to add comment', message: error.message, details: error },
        { status: 500 }
      )
    }

    // Create a history event for the comment
    const userName = firstName && lastName ? `${firstName} ${lastName}` : userId
    await supabase.from('document_history').insert({
      id: crypto.randomUUID(),
      document_id: id,
      event_type: 'COMMENTED',
      user_id: userId,
      user_name: userName,
      metadata: { comment_preview: comment.substring(0, 100) },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationId: 'addComment',
      },
      { status: 500 }
    )
  }
}
