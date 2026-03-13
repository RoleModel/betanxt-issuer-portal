'use client'

import ChecklistDocumentIcon from '@rolemodel/betanxt-design-system/components/icons/brand/ChecklistDocumentIcon'
import React, { useMemo } from 'react'

import { Container, Stack } from '@mui/material'
import Grid from '@mui/material/Grid'

import EmptyState from '@/components/EmptyState'
import QuorumGaugeCard from '@/components/Meeting/QuorumGaugeCard'
import BeneficialVsRegisteredCard from '@/components/Tabulation/BeneficialVsRegisteredCard'
import ProposalDetailsCard from '@/components/Tabulation/ProposalDetailsCard'
import SharesVotedCard from '@/components/Tabulation/SharesVotedCard'
import TabulationReportCard from '@/components/Tabulation/TabulationReportCard'
import VotingActivityCard from '@/components/Tabulation/VotingActivityCard'

import { useMeeting } from '@/contexts/MeetingContext'
import { usePhases } from '@/hooks/usePhases'
import { useTabulationInsights } from '@/hooks/useTabulationInsights'

const parsePhaseNumber = (phaseLabel?: string | null): number | null => {
  if (!phaseLabel) return null
  const match = /(\d+)/.exec(phaseLabel)
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

  const phaseIsSevenOrGreater = (currentPhaseNumber ?? 0) >= 7
  const {
    proposals,
    filteredPositions,
    summary,
    quorumGauge,
    filters,
    setFilters,
    accountTypes,
    setKeys,
    directors,
    beneficialVsRegistered,
    loading: tabulationLoading,
    meetingTitle,
    clientTicker,
  } = useTabulationInsights(currentMeeting?.id, currentMeeting)

  // Show loading state while data is being fetched
  if (meetingLoading || phasesLoading) {
    return null
  }

  if (phaseIsSevenOrGreater) {
    return (
      <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
        <Grid container spacing={{ xs: 2, md: 3 }}>


          <Grid size={12}>
            <Stack
              useFlexGap
              spacing={{ xs: 2, md: 3 }}
              direction={{ xs: 'column', sm: 'row' }}
              alignItems="stretch"
              justifyContent="stretch"
            >

              <QuorumGaugeCard model={quorumGauge} loading={tabulationLoading} />

              <VotingActivityCard
                meetingId={meetingId}
                votingSummaryOverride={summary}
                loadingOverride={tabulationLoading}
              />
              <BeneficialVsRegisteredCard
                meetingId={meetingId}
                chartOverride={beneficialVsRegistered}
                loadingOverride={tabulationLoading}
              />
              <SharesVotedCard
                meetingId={meetingId}
                votingSummaryOverride={summary}
                loading={tabulationLoading}
              />
              <TabulationReportCard variant="primary" />
            </Stack>
          </Grid>
          <Grid size={12}>
            <ProposalDetailsCard
              loading={tabulationLoading}
              proposals={proposals}
              positions={filteredPositions}
              meetingTitle={meetingTitle || currentMeeting?.title || 'Meeting Positions'}
              clientTicker={clientTicker || currentMeeting?.ticker || ''}
              filters={filters}
              onFiltersChange={(nextFilters) => setFilters(nextFilters)}
              accountTypes={accountTypes.map((accountType) => ({
                label: accountType,
                value: accountType,
              }))}
              setKeys={setKeys.map((setKey) => ({
                label: setKey,
                value: setKey,
              }))}
              directors={directors.map((director) => ({
                label: director.label,
                value: director.id,
              }))}
            />
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
          icon={<ChecklistDocumentIcon />}
          description={`Tabulation results will appear once voting activity starts.`}
        />
      </Container>
    )
  }
  return null
}
