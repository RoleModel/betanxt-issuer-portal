'use client'

import { Container } from '@mui/material'
import Grid from '@mui/material/Grid'

import QuorumGaugeCard from '@/components/Meeting/QuorumGaugeCard'
import BeneficialVsRegisteredCard from '@/components/Tabulation/BeneficialVsRegisteredCard'
import ProposalDetailsCard from '@/components/Tabulation/ProposalDetailsCard'
import SharesVotedCard from '@/components/Tabulation/SharesVotedCard'
import { TabulationDistributionDrawer } from '@/components/Tabulation/TabulationDistributionDrawer'
import TabulationReportCard from '@/components/Tabulation/TabulationReportCard'
import VotingActivityCard from '@/components/Tabulation/VotingActivityCard'

import { useMeeting } from '@/contexts/MeetingContext'
import { useTabulationInsights } from '@/hooks/useTabulationInsights'

export default function TabulationPage() {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting()
  const meetingId = currentMeeting?.id ?? ''
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

  if (meetingLoading) {
    return null
  }

  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={12}>
          <TabulationDistributionDrawer
            meetingId={meetingId}
            clientTicker={clientTicker}
            initialDistribution={currentMeeting?.tabulationDistribution ?? undefined}
            meetingDate={currentMeeting?.meetingDate}
          />
        </Grid>
        <Grid size={12}>
          <Grid container columns={{ sm: 5, md: 6, lg: 5 }} spacing={{ xs: 2, md: 3 }}>
            <Grid size={{ sm: 5, md: 2, lg: 1 }}>
              <QuorumGaugeCard model={quorumGauge} loading={tabulationLoading} />
            </Grid>
            <Grid size={{ sm: 5, md: 2, lg: 1 }}>
              <VotingActivityCard
                meetingId={meetingId}
                votingSummaryOverride={summary}
                loadingOverride={tabulationLoading}
              />
            </Grid>
            <Grid size={{ sm: 5, md: 2, lg: 1 }}>
              <BeneficialVsRegisteredCard
                meetingId={meetingId}
                chartOverride={beneficialVsRegistered}
                loadingOverride={tabulationLoading}
              />
            </Grid>
            <Grid size={{ sm: 5, md: 3, lg: 1 }}>
              <SharesVotedCard
                meetingId={meetingId}
                votingSummaryOverride={summary}
                loading={tabulationLoading}
              />
            </Grid>
            <Grid size={{ sm: 5, md: 3, lg: 1 }}>
              <TabulationReportCard variant="primary" />
            </Grid>
          </Grid>
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
