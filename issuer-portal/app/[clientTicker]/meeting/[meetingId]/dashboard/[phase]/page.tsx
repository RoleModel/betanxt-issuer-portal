'use client'

import { useParams } from 'next/navigation'
import React, { useMemo } from 'react'

import { Box, Container, Typography } from '@mui/material'

// Dynamically load heavy phase layouts & tracker to reduce initial JS
import Phase1Layout from '@/components/Meeting/Phase1Layout'
import Phase2Layout from '@/components/Meeting/Phase2Layout'
import Phase3Layout from '@/components/Meeting/Phase3Layout'
import Phase4Layout from '@/components/Meeting/Phase4Layout'
import Phase5Layout from '@/components/Meeting/Phase5Layout'
import Phase6Layout from '@/components/Meeting/Phase6Layout'
import Phase7Layout from '@/components/Meeting/Phase7Layout'
import Phase8Layout from '@/components/Meeting/Phase8Layout'
import TabulationTracker from '@/components/Meeting/TabulationTracker'

import { useMeeting } from '@/contexts/MeetingContext'
import { usePhases } from '@/hooks/usePhases'

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
    const match = phaseLabel.match(/(\d+)/)
    if (!match) return null
    const num = Number(match[1])
    return Number.isFinite(num) ? num : null
  }

  const currentPhaseLabel = useMemo(() => {
    if (!currentMeeting || typeof currentMeeting !== 'object') return undefined
    if ('currentPhase' in currentMeeting) {
      const val = (currentMeeting as Record<string, unknown>)['currentPhase']
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

  const renderPhaseLayout = () => {
    switch (phaseNumber) {
      case 1:
        return (
          <Phase1Layout
            meetingId={meetingId}
            meeting={meeting}
            phase={phaseNumber}
            onUpdate={refreshMeetingData}
          />
        )

      case 2:
        return (
          <Phase2Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} />
        )

      case 3:
        return (
          <Phase3Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} />
        )

      case 4:
        return (
          <Phase4Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} />
        )

      case 5:
        return (
          <Phase5Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} />
        )

      case 6:
        return (
          <Phase6Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} />
        )

      case 7:
        return <Phase7Layout meetingId={meetingId} meeting={meeting} />

      case 8:
        return <Phase8Layout meetingId={meetingId} meeting={meeting} />

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
