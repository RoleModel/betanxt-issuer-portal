"use client";

import { Container } from "@mui/material";
import Grid from "@mui/material/Grid";

import QuorumGaugeCard from "@/components/Meeting/QuorumGaugeCard";
import BeneficialVsRegisteredCard from "@/components/Tabulation/BeneficialVsRegisteredCard";
import ProposalDetailsCard from "@/components/Tabulation/ProposalDetailsCard";
import SharesVotedCard from "@/components/Tabulation/SharesVotedCard";
import { TabulationDistributionDrawer } from "@/components/Tabulation/TabulationDistributionDrawer";
import TabulationReportCard from "@/components/Tabulation/TabulationReportCard";
import VotingActivityCard from "@/components/Tabulation/VotingActivityCard";
import { useMeeting } from "@/contexts/MeetingContext";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { useTabulationInsights } from "@/hooks/useTabulationInsights";

/**
 * Tabulation tab for a meeting. Feeds the insight cards from a single
 * {@link useTabulationInsights} fetch: the registered-only voting method
 * counts go to `VotingActivityCard` and the full proposal list goes to
 * `SharesVotedCard` for its per-proposal selector (both replacing the former
 * aggregate voting summary).
 */

const TabulationPage = () => {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting();
  const meetingId = currentMeeting?.id ?? "";
  const { flags } = useFeatureFlags();
  const showConfiguration = flags.configureDistribution;

  const {
    proposals,
    filteredPositions,
    quorumGauge,
    filters,
    setFilters,
    accountTypes,
    setKeys,
    directors,
    beneficialVsRegistered,
    registeredVotingMethods,
    loading: tabulationLoading,
    meetingTitle,
    clientTicker,
  } = useTabulationInsights(currentMeeting?.id, currentMeeting);

  if (meetingLoading) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={12}>
          {showConfiguration ? (
            <TabulationDistributionDrawer
              meetingId={meetingId}
              clientTicker={clientTicker}
              initialDistribution={
                currentMeeting?.tabulationDistribution ?? undefined
              }
              meetingDate={currentMeeting?.meetingDate}
            />
          ) : null}
        </Grid>
        <Grid size={12}>
          <Grid
            container
            columns={{ sm: 5, md: 6, lg: 5 }}
            spacing={{ xs: 2, md: 3 }}
          >
            <Grid size={{ sm: 5, md: 2, lg: 1 }}>
              <QuorumGaugeCard
                model={quorumGauge}
                loading={tabulationLoading}
              />
            </Grid>
            <Grid size={{ sm: 5, md: 2, lg: 1 }}>
              <VotingActivityCard
                meetingId={meetingId}
                registeredVotingMethodsOverride={registeredVotingMethods}
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
                proposalsOverride={proposals}
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
            meetingTitle={
              meetingTitle || currentMeeting?.title || "Meeting Positions"
            }
            clientTicker={clientTicker || currentMeeting?.ticker || ""}
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
  );
};

export default TabulationPage;
