import { NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { notificationId } = await params

    // Get current user from auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update notification to mark as read
    const { data, error } = await supabase
      .from('notification')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user owns this notification
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
