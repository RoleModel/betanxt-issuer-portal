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

const TabulationPageContent = () => {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting();
  const meetingId = currentMeeting?.id ?? "";
  const { flags } = useFeatureFlags();
  const showConfiguration = flags.configureDistribution;

  const {
    proposals,
    filteredPositions,
    quorumGauge,
    beneficialVsRegistered,
    registeredVotingMethods,
    loading: tabulationLoading,
    clientTicker,
  } = useTabulationInsights(currentMeeting?.id, currentMeeting);

  if (meetingLoading) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      <Grid container alignItems="stretch" columns={12} spacing={2}>
        {showConfiguration ? (
          <Grid size={12}>
            <TabulationDistributionDrawer
              meetingId={meetingId}
              clientTicker={clientTicker}
              initialDistribution={
                currentMeeting?.tabulationDistribution ?? undefined
              }
              meetingDate={currentMeeting?.meetingDate}
            />
          </Grid>
        ) : null}
        <Grid
          size={{ sm: 12, md: 6, lg: 3 }}
          sx={{
            display: "flex",
            width: "100%",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <QuorumGaugeCard model={quorumGauge} loading={tabulationLoading} />
          <TabulationReportCard variant="primary" />
        </Grid>
        <Grid
          size={{ sm: 12, md: 6, lg: 3 }}
          sx={{ display: "flex", width: "100%" }}
        >
          <VotingActivityCard
            meetingId={meetingId}
            registeredVotingMethodsOverride={registeredVotingMethods}
            loadingOverride={tabulationLoading}
          />
        </Grid>
        <Grid
          size={{ sm: 12, md: 6, lg: 3 }}
          sx={{ display: "flex", width: "100%" }}
        >
          <SharesVotedCard
            meetingId={meetingId}
            proposalsOverride={proposals}
            loading={tabulationLoading}
          />
        </Grid>
        <Grid
          size={{ sm: 12, md: 6, lg: 3 }}
          sx={{ display: "flex", width: "100%" }}
        >
          <BeneficialVsRegisteredCard
            meetingId={meetingId}
            chartOverride={beneficialVsRegistered}
            loadingOverride={tabulationLoading}
          />
        </Grid>
        <Grid size={12}>
          <ProposalDetailsCard
            clientTicker={clientTicker}
            loading={tabulationLoading}
            meetingTitle={currentMeeting?.meetingType ?? "Meeting Positions"}
            proposals={proposals}
            positions={filteredPositions}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default TabulationPageContent;
