'use client'

import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import React, { useMemo } from 'react'

import { Box, CircularProgress, Container, Typography } from '@mui/material'

import { useMeeting } from '@/contexts/MeetingContext'
import { usePhases } from '@/hooks/usePhases'

// Dynamically load heavy phase layouts & tracker to reduce initial JS bundle
const Phase1Layout = dynamic(() => import('@/components/Meeting/Phase1Layout'), {
  loading: () => <CircularProgress />,
})
const Phase2Layout = dynamic(() => import('@/components/Meeting/Phase2Layout'), {
  loading: () => <CircularProgress />,
})
const Phase3Layout = dynamic(() => import('@/components/Meeting/Phase3Layout'), {
  loading: () => <CircularProgress />,
})
const Phase4Layout = dynamic(() => import('@/components/Meeting/Phase4Layout'), {
  loading: () => <CircularProgress />,
})
const Phase5Layout = dynamic(() => import('@/components/Meeting/Phase5Layout'), {
  loading: () => <CircularProgress />,
})
const Phase6Layout = dynamic(() => import('@/components/Meeting/Phase6Layout'), {
  loading: () => <CircularProgress />,
})
const Phase7Layout = dynamic(() => import('@/components/Meeting/Phase7Layout'), {
  loading: () => <CircularProgress />,
})
const Phase8Layout = dynamic(() => import('@/components/Meeting/Phase8Layout'), {
  loading: () => <CircularProgress />,
})
const TabulationTracker = dynamic(() => import('@/components/Meeting/TabulationTracker'), {
  loading: () => <CircularProgress />,
})

export default function PhasePage() {
  const params = useParams()
  const phaseNumber = parseInt(params.phase as string)
  const meetingId = params.meetingId as string
  const { getMeetingById, refreshMeetingData } = useMeeting()
  const meeting = getMeetingById(meetingId)
  const { phases } = usePhases(meetingId)
  const { currentMeeting } = useMeeting()

  // Helper to parse phase label like "Phase 4" safely to number
  const parsePhaseNumber = (phaseLabel?: string | null): number | null => {
    if (!phaseLabel) return null
    const match = /(\d+)/.exec(phaseLabel)
    if (!match) return null
    const num = Number(match[1])
    return Number.isFinite(num) ? num : null
  }

  const currentPhaseLabel = useMemo(() => {
    if (!currentMeeting || typeof currentMeeting !== 'object') return undefined
    if ('currentPhase' in currentMeeting) {
      const val = (currentMeeting as Record<string, unknown>).currentPhase
      return typeof val === 'string' ? val : undefined
    }
    return undefined
  }, [currentMeeting])

  const currentPhaseNumber = useMemo(() => {
    const fromLabel = parsePhaseNumber(currentPhaseLabel)
    if (fromLabel) return fromLabel
    if (phases.length > 0) {
      return phases.reduce((m, p) => (p.orderIndex > m ? p.orderIndex : m), 0) || null
    }
    return null
  }, [currentPhaseLabel, phases])

  const isPhase8 = (currentPhaseNumber ?? 0) < 8

  // Ensure meeting has proper client.isActive value for Phase layouts
  const meetingForPhase = meeting
    ? {
        ...meeting,
        client: meeting.client
          ? {
              ...meeting.client,
              isActive: meeting.client.isActive ?? true,
            }
          : meeting.client,
      }
    : meeting

  const renderPhaseLayout = () => {
    switch (phaseNumber) {
      case 1:
        return (
          <Phase1Layout
            meetingId={meetingId}
            meeting={meetingForPhase}
            phase={phaseNumber}
            onUpdate={refreshMeetingData}
          />
        )

      case 2:
        return (
          <Phase2Layout
            meetingId={meetingId}
            meeting={meetingForPhase}
            phase={phaseNumber}
          />
        )

      case 3:
        return (
          <Phase3Layout
            meetingId={meetingId}
            meeting={meetingForPhase}
            phase={phaseNumber}
          />
        )

      case 4:
        return (
          <Phase4Layout
            meetingId={meetingId}
            meeting={meetingForPhase}
            phase={phaseNumber}
          />
        )

      case 5:
        return (
          <Phase5Layout
            meetingId={meetingId}
            meeting={meetingForPhase}
            phase={phaseNumber}
          />
        )

      case 6:
        return (
          <Phase6Layout
            meetingId={meetingId}
            meeting={meetingForPhase}
            phase={phaseNumber}
          />
        )

      case 7:
        return <Phase7Layout meetingId={meetingId} meeting={meetingForPhase} />

      case 8:
        return <Phase8Layout meetingId={meetingId} meeting={meetingForPhase} />

      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="h6">Unknown Phase: {phaseNumber}</Typography>
            <Typography>This phase is not recognized.</Typography>
          </Box>
        )
    }
  }

  return (
    <Container component="main" maxWidth="xl" data-testid="meeting-dashboard">
      <Box
        display="flex"
        flexGrow={1}
        flexDirection="column"
        paddingY={{ xs: 2, sm: 3 }}
        gap={{ xs: 2, md: 3 }}
      >
        {isPhase8 ? (
          <>
            {' '}
            <TabulationTracker meetingId={meetingId} />
          </>
        ) : null}

        {renderPhaseLayout()}
      </Box>
    </Container>
  )
}
