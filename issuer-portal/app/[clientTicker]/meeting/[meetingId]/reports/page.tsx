"use client";

import { Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useEffect, useMemo } from "react";

import DownloadReportsTable from "@/components/Reporting/DownloadReportsTable";
import TabulationReportCard from "@/components/Reporting/TabulationReportCard";
import VoteDistributionChart from "@/components/Reporting/VoteDistributionChart";
import { useMeeting } from "@/contexts/MeetingContext";
import buildApiClient from "@/domain-models/apiClient";
import { useReports } from "@/hooks/useReports";

export default function ReportsPage() {
  const { currentMeeting, positions, positionsLoading } = useMeeting();
  const meetingId = currentMeeting?.id ?? "";
  const { voteDistribution, loading: reportsLoading } = useReports(meetingId);

  // Fetch proposals for the meeting (reserved for future use)
  useEffect(() => {
    if (!meetingId) {
      return;
    }

    const fetchProposals = async () => {
      try {
        const apiClient = await buildApiClient();
        await apiClient.GET("/meetings/{meetingId}/proposals", {
          params: { path: { meetingId } },
        });
      } catch (error) {
        console.error("Failed to fetch proposals:", error);
      }
    };

    void fetchProposals();
  }, [meetingId]);

  const resolvedVoteDistribution = useMemo(() => {
    if (voteDistribution.length > 0) {
      return voteDistribution;
    }

    const colors = [
      "var(--mui-palette-chartSeries-1-main)",
      "var(--mui-palette-chartSeries-2-main)",
      "var(--mui-palette-chartSeries-3-main)",
      "var(--mui-palette-chartSeries-4-main)",
    ];

    const dtcVotedShares = positions
      .filter(
        (position) =>
          position.accountType === "DTC/CDS" && position.voteStatus === "Voted"
      )
      .reduce((sum, position) => sum + (position.sharesVoted ?? 0), 0);

    const dtcUnvotedShares = positions
      .filter(
        (position) =>
          position.accountType === "DTC/CDS" &&
          position.voteStatus === "Unvoted"
      )
      .reduce((sum, position) => sum + (position.shares ?? 0), 0);

    const nonDtcVotedShares = positions
      .filter(
        (position) =>
          position.accountType === "Non-DTC" && position.voteStatus === "Voted"
      )
      .reduce((sum, position) => sum + (position.sharesVoted ?? 0), 0);

    const nonDtcUnvotedShares = positions
      .filter(
        (position) =>
          position.accountType === "Non-DTC" &&
          position.voteStatus === "Unvoted"
      )
      .reduce((sum, position) => sum + (position.shares ?? 0), 0);

    return [
      {
        id: "dtc-voted",
        label: "DTC/CDS Voted",
        value: dtcVotedShares,
        color: colors[0],
      },
      {
        id: "dtc-unvoted",
        label: "DTC/CDS Not Voted",
        value: dtcUnvotedShares,
        color: colors[1],
      },
      {
        id: "non-dtc-voted",
        label: "Non-DTC Voted",
        value: nonDtcVotedShares,
        color: colors[2],
      },
      {
        id: "non-dtc-unvoted",
        label: "Non-DTC Not Voted",
        value: nonDtcUnvotedShares,
        color: colors[3],
      },
    ].filter((item) => item.value > 0);
  }, [positions, voteDistribution]);

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
          <VoteDistributionChart
            data={resolvedVoteDistribution}
            loading={reportsLoading || positionsLoading}
          />
          <TabulationReportCard />
        </Grid>
      </Grid>
    </Container>
  );
}
