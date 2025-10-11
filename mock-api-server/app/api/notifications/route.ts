import { NextResponse } from 'next/server'

import { supabase } from '@/utils/supabase/client'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // For mock API, we'll bypass auth and get the first issuer user
    // In production, you would use proper auth here
    const { data: users } = await supabase
      .from('user')
      .select('id')
      .eq('type', 'ISSUER')
      .limit(1)

    const userId = users?.[0]?.id

    if (!userId) {
      return NextResponse.json([], { status: 200 })
    }

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

    // Transform snake_case to camelCase for API consistency
    const transformedNotifications = (notifications || []).map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      read: notification.read,
      userId: notification.user_id,
      meetingId: notification.meeting_id,
      taskId: notification.task_id,
      actionUrl: notification.action_url, // This is the key transformation for links
      createdAt: notification.created_at,
      readAt: notification.read_at,
      expiresAt: notification.expires_at,
    }))

    return NextResponse.json(transformedNotifications)
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
