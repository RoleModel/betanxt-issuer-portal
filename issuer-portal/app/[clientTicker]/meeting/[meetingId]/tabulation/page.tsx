"use client";

import NumbersIcon from "@mui/icons-material/Numbers";
import PercentIcon from "@mui/icons-material/Percent";
import { Container, ToggleButton, ToggleButtonGroup } from "@mui/material";
import Grid from "@mui/material/Grid";
import { styled } from "@mui/material/styles";

import QuorumGaugeCard from "@/components/Meeting/QuorumGaugeCard";
import BeneficialVsRegisteredCard from "@/components/Tabulation/BeneficialVsRegisteredCard";
import ProposalDetailsCard from "@/components/Tabulation/ProposalDetailsCard";
import SharesVotedCard from "@/components/Tabulation/SharesVotedCard";
import { TabulationDistributionDrawer } from "@/components/Tabulation/TabulationDistributionDrawer";
import TabulationReportCard from "@/components/Tabulation/TabulationReportCard";
import VotingActivityCard from "@/components/Tabulation/VotingActivityCard";
import { useMeeting } from "@/contexts/MeetingContext";
import {
  TabulationDisplayProvider,
  useTabulationDisplay,
} from "@/contexts/TabulationDisplayContext";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { useTabulationInsights } from "@/hooks/useTabulationInsights";

/**
 * Tabulation tab for a meeting. Feeds the insight cards from a single
 * {@link useTabulationInsights} fetch: the registered-only voting method
 * counts go to `VotingActivityCard` and the full proposal list goes to
 * `SharesVotedCard` for its per-proposal selector (both replacing the former
 * aggregate voting summary).
 */

const CustomToggleButton = styled(ToggleButton)(({ theme }) => ({
  color: theme.vars.palette.text.primary,
  border: `1px solid ${theme.vars.palette.text.primary}`,
  blockSize: 32,
  "&.Mui-selected": {
    color: "#fff",
    backgroundColor: theme.vars.palette.action.selected,
    "&:hover": {
      backgroundColor: theme.vars.palette.action.active,
    },
  },
}));

const TabulationPageContent = () => {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting();
  const { displayMode, setDisplayMode } = useTabulationDisplay();
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
      <Grid container spacing={2}>
        <Grid size={12}>
          {showConfiguration ? (
            <TabulationDistributionDrawer
              meetingId={meetingId}
              clientTicker={clientTicker}
              initialDistribution={currentMeeting?.tabulationDistribution ?? undefined}
              meetingDate={currentMeeting?.meetingDate}
            />
          ) : null}
        </Grid>
        <Grid size={12}>
          <Grid container alignItems="stretch" columns={{ sm: 1, md: 12 }} spacing={2}>
            <Grid
              size={{ sm: 12, md: 6, lg: 3 }}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <QuorumGaugeCard model={quorumGauge} loading={tabulationLoading} />
              <TabulationReportCard variant="primary" />
              <ToggleButtonGroup
                exclusive
                fullWidth
                aria-label="Tabulation display format"
                size="small"
                color="warning"
                value={displayMode}
                onChange={(event, nextDisplayMode: string | null) => {
                  event.persist();
                  if (nextDisplayMode === "numbers" || nextDisplayMode === "percentages") {
                    setDisplayMode(nextDisplayMode);
                  }
                }}
              >
                <CustomToggleButton value="numbers">
                  <NumbersIcon />
                </CustomToggleButton>
                <CustomToggleButton value="percentages">
                  <PercentIcon />
                </CustomToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid size={{ sm: 12, md: 6, lg: 3 }} sx={{ display: "flex" }}>
              <VotingActivityCard
                meetingId={meetingId}
                registeredVotingMethodsOverride={registeredVotingMethods}
                loadingOverride={tabulationLoading}
              />
            </Grid>
            <Grid size={{ sm: 12, md: 6, lg: 3 }} sx={{ display: "flex" }}>
              <SharesVotedCard
                meetingId={meetingId}
                proposalsOverride={proposals}
                loading={tabulationLoading}
              />
            </Grid>
            <Grid size={{ sm: 12, md: 6, lg: 3 }} sx={{ display: "flex" }}>
              <BeneficialVsRegisteredCard
                meetingId={meetingId}
                chartOverride={beneficialVsRegistered}
                loadingOverride={tabulationLoading}
              />
            </Grid>
          </Grid>
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

const TabulationPage = () => (
  <TabulationDisplayProvider>
    <TabulationPageContent />
  </TabulationDisplayProvider>
);

export default TabulationPage;
