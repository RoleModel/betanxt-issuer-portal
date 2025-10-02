import { NextResponse } from 'next/server'

import { supabase } from '@/utils/supabase/client'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
): Promise<NextResponse> {
  try {
    const { notificationId } = await params

    // For mock API, we'll bypass auth and use a hardcoded user ID
    const userId = 'user-1' // Default mock user ID

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

    return NextResponse.json(data)
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
