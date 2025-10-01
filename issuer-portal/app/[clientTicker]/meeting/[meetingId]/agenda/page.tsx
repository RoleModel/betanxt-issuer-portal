'use client'

import React, { useMemo } from 'react'

import { Container } from '@mui/material'

import AgendaTable from '@/components/Agenda/AgendaTable'
import EmptyState from '@/components/EmptyState'

import { useMeeting } from '@/contexts/MeetingContext'
import { usePhases } from '@/hooks/usePhases'
import { friendlyDate } from '@/utils/dateUtils'

const parsePhaseNumber = (phaseLabel?: string | null): number | null => {
  if (!phaseLabel) return null
  const match = phaseLabel.match(/(\d+)/)
  if (!match) return null
  const num = Number(match[1])
  return Number.isFinite(num) ? num : null
}

export default function AgendaPage() {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting()
  const meetingId = currentMeeting?.id ?? ''
  const { phases, loading: phasesLoading } = usePhases(meetingId)

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

  const phaseIsSevenOrGreater = (currentPhaseNumber ?? 0) >= 7

  const meetingDateStr = currentMeeting?.meetingDate
  const friendlyMeetingDate = meetingDateStr ? friendlyDate(meetingDateStr) : 'TBD'

  // Show loading state while data is being fetched
  if (meetingLoading || phasesLoading) {
    return null
  }

  if (phaseIsSevenOrGreater) {
    return (
      <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
        <AgendaTable />
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      <EmptyState
        title="Meeting Agenda"
        description={`The meeting agenda will be available starting on ${friendlyMeetingDate}. Check back after the meeting date to view the agenda items.`}
      />
    </Container>
  )
}
