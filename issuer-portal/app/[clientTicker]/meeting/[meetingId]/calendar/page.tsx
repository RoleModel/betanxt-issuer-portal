'use client'

import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'

import { useMeeting } from '@/contexts/MeetingContext'

// Dynamic import for heavy calendar component to enable route-based code splitting
const CalendarView = dynamic(
  () =>
    import('@/components/Calendar/CalendarView').then((mod) => ({
      default: mod.CalendarView,
    })),
  {
    ssr: false,
    loading: () => null,
  }
)

export default function CalendarPage() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { currentMeeting } = useMeeting()

  useEffect(() => {
    // Communicate fullscreen state to parent layout
    const event = new CustomEvent('calendar-fullscreen-change', {
      detail: { isFullscreen },
    })
    window.dispatchEvent(event)
  }, [isFullscreen])

  const meetingForCalendar = currentMeeting?.id
    ? {
        id: currentMeeting.id,
        meetingDate: currentMeeting.meetingDate ?? null,
        title: currentMeeting.title,
      }
    : undefined

  return (
    <CalendarView meeting={meetingForCalendar} onFullscreenChange={setIsFullscreen} />
  )
}
