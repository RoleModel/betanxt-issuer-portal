"use client";

import { Container } from "@mui/material";
import Grid from "@mui/material/Grid";

import QuorumGaugeCard from "@/components/Charts/QuorumGauge/QuorumGaugeCard";
import VoteMatrixChartCard from "@/components/Charts/VoteMatrix/VoteMatrixChartCard";
import ProposalDetailsCard from "@/components/Tabulation/ProposalDetailsCard";
import { TabulationDistributionDrawer } from "@/components/Tabulation/TabulationDistributionDrawer";
import TabulationReportCard from "@/components/Tabulation/TabulationReportCard";
import TabulationUnavailableEmptyState from "@/components/Tabulation/TabulationLockedEmptyState";
import { useMeeting } from "@/contexts/MeetingContext";
import { useTabulationRelease } from "@/contexts/TabulationReleaseContext";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { useTabulationInsights } from "@/hooks/useTabulationInsights";

/**
 * Tabulation tab for a meeting. Feeds a single chart from
 * {@link useTabulationInsights}, combining holder type, voting source, and
 * proposal-level vote outcome while keeping the detailed table below it.
 */

const TabulationPageContent = () => {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting();
  const meetingId = currentMeeting?.id ?? "";
  const { flags } = useFeatureFlags();
  const showConfiguration = flags.configureDistribution;
  // The same context the quorum card and the dashboard tracker read, so every
  // withheld surface agrees without each one re-deriving the flag.
  const { isReleased } = useTabulationRelease();

  const {
    proposals,
    filteredPositions,
    quorumGauge,
    voteMatrixProposals,
    loading: tabulationLoading,
    clientTicker,
  } = useTabulationInsights(currentMeeting?.id, currentMeeting);

  if (meetingLoading) {
    return null;
  }

  // Until a CSM releases tabulation, this tab is the empty state and nothing
  // else — no charts, no tables, and no distribution configuration.
  if (!isReleased) {
    return (
      <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
        <TabulationUnavailableEmptyState />
      </Container>
    );
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
          size={{ sm: 12, md: 6, lg: 9 }}
          sx={{ display: "flex", width: "100%" }}
        >
          <VoteMatrixChartCard
            loading={tabulationLoading}
            proposals={voteMatrixProposals}
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
