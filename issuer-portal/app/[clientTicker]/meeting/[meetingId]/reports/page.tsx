"use client";

import { Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useEffect, useMemo } from "react";

import EmptyState from "@/components/EmptyState";
import DownloadReportsTable from "@/components/Reporting/DownloadReportsTable";
import TabulationReportCard from "@/components/Reporting/TabulationReportCard";
import VoteDistributionChart from "@/components/Reporting/VoteDistributionChart";
import { useMeeting } from "@/contexts/MeetingContext";
import buildApiClient from "@/domain-models/apiClient";
import { usePhases } from "@/hooks/usePhases";
import { useReports } from "@/hooks/useReports";
import { friendlyDate } from "@/utils/dateUtils";

const parsePhaseNumber = (phaseLabel?: string | null): number | null => {
  if (!phaseLabel) return null;
  const match = /(\d+)/.exec(phaseLabel);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : null;
};

export default function ReportsPage() {
  const { currentMeeting, positions, positionsLoading } = useMeeting();
  const meetingId = currentMeeting?.id ?? "";
  const { phases } = usePhases(meetingId);
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

  const currentPhaseLabel = useMemo(() => {
    if (!currentMeeting || typeof currentMeeting !== "object") return undefined;
    if ("currentPhase" in currentMeeting) {
      const val = (currentMeeting as Record<string, unknown>).currentPhase;
      return typeof val === "string" ? val : undefined;
    }
    return undefined;
  }, [currentMeeting]);

  const currentPhaseNumber = useMemo(() => {
    const fromLabel = parsePhaseNumber(currentPhaseLabel);
    if (fromLabel) return fromLabel;
    if (phases.length > 0) {
      return phases.reduce((m, p) => (p.orderIndex > m ? p.orderIndex : m), 0) || null;
    }
    return null;
  }, [currentPhaseLabel, phases]);

  const phaseIsSevenOrGreater = (currentPhaseNumber ?? 0) >= 7;

  const meetingDateStr = currentMeeting?.meetingDate;
  const friendlyMeetingDate = meetingDateStr ? friendlyDate(meetingDateStr) : "TBD";

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
      .filter((position) => position.accountType === "DTC/CDS" && position.voteStatus === "Voted")
      .reduce((sum, position) => sum + (position.sharesVoted ?? 0), 0);

    const dtcUnvotedShares = positions
      .filter((position) => position.accountType === "DTC/CDS" && position.voteStatus === "Unvoted")
      .reduce((sum, position) => sum + (position.shares ?? 0), 0);

    const nonDtcVotedShares = positions
      .filter((position) => position.accountType === "Non-DTC" && position.voteStatus === "Voted")
      .reduce((sum, position) => sum + (position.sharesVoted ?? 0), 0);

    const nonDtcUnvotedShares = positions
      .filter((position) => position.accountType === "Non-DTC" && position.voteStatus === "Unvoted")
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

  // Show empty state only if phase is determined to be less than 7
  // Don't show it while loading (phases.length === 0 could mean loading or no phases)
  if (currentPhaseNumber !== null && !phaseIsSevenOrGreater) {
    return (
      <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
        <EmptyState
          title="Reports"
          description={`Reports will be available starting on ${friendlyMeetingDate}.`}
        />
      </Container>
    );
  }

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
