'use client'

import React, { useMemo } from 'react'

import { Container, Stack } from '@mui/material'
import Grid from '@mui/material/Grid'

import EmptyState from '@/components/EmptyState'
import BeneficialVsRegisteredCard from '@/components/Tabulation/BeneficialVsRegisteredCard'
import PositionsTable from '@/components/Tabulation/PositionsTable'
import ProposalDetailsCard from '@/components/Tabulation/ProposalDetailsCard'
import SharesVotedCard from '@/components/Tabulation/SharesVotedCard'
import TabulationReportCard from '@/components/Tabulation/TabulationReportCard'
import VotingActivityCard from '@/components/Tabulation/VotingActivityCard'

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

export default function TabulationPage() {
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
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 9 }}>
            <Stack spacing={3}>
              <PositionsTable meetingId={meetingId} />
              <ProposalDetailsCard meetingId={meetingId} />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 3 }}>
            <Stack spacing={3}>
              <Stack spacing={3} direction={{ xs: 'column', sm: 'row', lg: 'column' }}>
                <TabulationReportCard />
                <VotingActivityCard meetingId={meetingId} />
              </Stack>
              <Stack spacing={3} direction={{ xs: 'column', sm: 'row', lg: 'column' }}>
                <BeneficialVsRegisteredCard meetingId={meetingId} />
                <SharesVotedCard meetingId={meetingId} />
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    )
  }
  if (!phaseIsSevenOrGreater) {
    return (
      <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
        <EmptyState
          title="Tabulation"
          description={`Tabulation data will be available starting on ${friendlyMeetingDate}. Check back after the meeting date to review voting results and participation metrics.`}
        />
      </Container>
    )
  }
  return null
}
