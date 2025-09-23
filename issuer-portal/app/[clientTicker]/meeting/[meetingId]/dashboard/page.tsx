'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Box, LinearProgress, Typography } from '@mui/material'

import { useMeeting } from '@/contexts/MeetingContext'
import { usePhases } from '@/hooks/usePhases'

// This handles the Meeting Dashboard route and redirects to the active phase
export default function MeetingDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const meetingId = params.meetingId as string
  const clientTicker = params.clientTicker as string
  const { error } = useMeeting()
  const { phases, loading } = usePhases(meetingId)

  useEffect(() => {
    if (!loading && phases.length > 0) {
      // Find the active phase
      const activePhase = phases.find((phase) => phase.status === 'ACTIVE')

      if (activePhase) {
        // Redirect to the phase-specific route under dashboard
        router.replace(
          `/${clientTicker}/meeting/${meetingId}/dashboard/${activePhase.orderIndex}`
        )
      } else {
        // If no active phase, default to phase 1
        router.replace(`/${clientTicker}/meeting/${meetingId}/dashboard/1`)
      }
    }
  }, [loading, phases, router, clientTicker, meetingId])

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    )
  }

  if (loading) {
    return <LinearProgress />
  }

  // Show loading while determining phase
  return <LinearProgress />
}
