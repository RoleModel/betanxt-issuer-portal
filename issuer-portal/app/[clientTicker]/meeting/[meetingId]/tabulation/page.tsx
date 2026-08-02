"use client";

import { Container } from "@mui/material";
import Grid from "@mui/material/Grid";

import QuorumGaugeCard from "@/components/Meeting/QuorumGaugeCard";
import ProposalDetailsCard from "@/components/Tabulation/ProposalDetailsCard";
import SharesVotedCard from "@/components/Tabulation/SharesVotedCard";
import { TabulationDistributionDrawer } from "@/components/Tabulation/TabulationDistributionDrawer";
import TabulationReportCard from "@/components/Tabulation/TabulationReportCard";
import VotingSourceBreakdownCard from "@/components/Tabulation/VotingSourceBreakdownCard";
import { useMeeting } from "@/contexts/MeetingContext";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { useTabulationInsights } from "@/hooks/useTabulationInsights";

/**
 * Tabulation tab for a meeting. Feeds the cards from one
 * {@link useTabulationInsights} fetch, including one combined holder-type and
 * voting-source chart plus the separate per-proposal vote-outcome chart.
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
    votingSourceBreakdown,
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
          <TabulationReportCard variant="secondary" />
        </Grid>
        <Grid
          size={{ sm: 12, md: 6, lg: 6 }}
          sx={{ display: "flex", width: "100%" }}
        >
          <VotingSourceBreakdownCard
            breakdown={votingSourceBreakdown}
            loading={tabulationLoading}
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
