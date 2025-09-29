'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Box, LinearProgress, Typography } from '@mui/material'

import { useMeeting } from '@/contexts/MeetingContext'

// This handles the Meeting Dashboard route and redirects to the active phase
export default function MeetingDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const meetingId = params.meetingId as string
  const clientTicker = params.clientTicker as string
  const { error, currentMeeting: meeting } = useMeeting()

  const parsePhaseNumber = (phase: string | number | null | undefined): number => {
    if (typeof phase === 'number' && Number.isFinite(phase)) {
      return Math.max(1, phase)
    }

    if (typeof phase === 'string') {
      const match = phase.match(/(\d+)/)
      if (match?.[1]) {
        const value = Number.parseInt(match[1], 10)
        if (Number.isFinite(value) && value > 0) {
          return value
        }
      }
    }

    return 1
  }

  useEffect(() => {
    // Only redirect if the meeting ID matches the URL and we have phase info
    if (meeting?.id === meetingId && meeting?.currentPhase) {
      // Use the meeting's current phase instead of looking for active phase in phases array
      const currentPhase = parsePhaseNumber(meeting.currentPhase)
      router.replace(`/${clientTicker}/meeting/${meetingId}/dashboard/${currentPhase}`)
    }
  }, [meeting?.id, meeting?.currentPhase, router, clientTicker, meetingId])

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    )
  }

  // Show loading while determining phase or while loading is true
  return <LinearProgress />
}
