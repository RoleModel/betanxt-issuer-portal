"use client";

import { Container } from "@mui/material";
import Grid from "@mui/material/Grid";

import DownloadReportsTable from "@/components/Reporting/DownloadReportsTable";
import TabulationReportCard from "@/components/Reporting/TabulationReportCard";
import VoteDistributionChart from "@/components/Charts/VoteDistribution/VoteDistributionChart";
import { buildVoteDistributionData } from "@/components/Charts/VoteDistribution/vote-distribution-chart-data";
import TabulationUnavailableEmptyState from "@/components/Tabulation/TabulationLockedEmptyState";
import { useMeeting } from "@/contexts/MeetingContext";
import { useTabulationRelease } from "@/contexts/TabulationReleaseContext";

const ReportsPage = () => {
  const { currentMeeting, positions, positionsLoading } = useMeeting();
  const { isReleased } = useTabulationRelease();
  const meetingId = currentMeeting?.id ?? "";

  // Vote distribution is tabulation — how each account type voted — so it is
  // withheld with the rest of it. The chart reads the meeting's positions
  // rather than the gated tabulation hook, which is why it needed saying here.
  const resolvedVoteDistribution = isReleased
    ? buildVoteDistributionData(positions)
    : null;

  // The static list of reports is always shown, even before the meeting when
  // there is nothing to download yet (MED-1525). Reports generate on demand.
  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid
          order={{ xs: 2, lg: 1 }}
          size={{ xs: 12, lg: 8 }}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <DownloadReportsTable meetingId={meetingId} />
        </Grid>

        <Grid
          order={{ xs: 1, lg: 2 }}
          size={{ xs: 12, lg: 4 }}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          {resolvedVoteDistribution === null ? (
            <TabulationUnavailableEmptyState minHeight={220} />
          ) : (
            <VoteDistributionChart
              data={resolvedVoteDistribution}
              loading={positionsLoading}
            />
          )}
          <TabulationReportCard />
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReportsPage;
