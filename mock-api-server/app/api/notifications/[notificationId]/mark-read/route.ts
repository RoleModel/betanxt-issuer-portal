import { NextResponse } from 'next/server'

import { supabase } from '@/utils/supabase/client'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
): Promise<NextResponse> {
  try {
    const { notificationId } = await params

    // For mock API, we'll bypass auth and get the first issuer user
    const { data: users } = await supabase
      .from('user')
      .select('id')
      .eq('type', 'ISSUER')
      .limit(1)

    const userId = users?.[0]?.id

    if (!userId) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 })
    }

    // Update notification to mark as read
    const { data, error } = await supabase
      .from('notification')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId) // Ensure user owns this notification
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update notification', message: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Transform snake_case to camelCase for API consistency
    const transformedNotification = {
      id: data.id,
      title: data.title,
      message: data.message,
      type: data.type,
      priority: data.priority,
      read: data.read,
      userId: data.user_id,
      meetingId: data.meeting_id,
      taskId: data.task_id,
      actionUrl: data.action_url,
      createdAt: data.created_at,
      readAt: data.read_at,
      expiresAt: data.expires_at,
    }

    return NextResponse.json(transformedNotification)
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
