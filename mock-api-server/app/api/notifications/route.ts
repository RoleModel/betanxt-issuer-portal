import { NextResponse } from 'next/server'

import { supabase } from '@/utils/supabase/client'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // For mock API, we'll bypass auth and use a hardcoded user ID
    // In production, you would use proper auth here
    const userId = 'user-1' // Default mock user ID

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'

    // Query notifications for the current user
    let query = supabase
      .from('notification')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch notifications', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(notifications || [])
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
