"use client";

import { Grid } from "@mui/material";
import { Suspense } from "react";
import useSWR from "swr";

import type { components } from "@/domain-models/generated-schema";
import type { Meeting } from "@/types/api-exports";

import DocumentHostingCard from "@/components/Meeting/DocumentHostingCard";
import KeyDatesCard from "@/components/Meeting/KeyDatesCard";
import QuorumGaugeCard from "@/components/Meeting/QuorumGaugeCard";
import buildApiClient from "@/domain-models/apiClient";
import { buildQuorumGaugeModel } from "@/utils/quorum";

type TabulationReport = components["schemas"]["TabulationReport"];

interface Phase1LayoutProps {
  readonly meeting?: Meeting;
}

const Phase1Layout = ({ meeting }: Phase1LayoutProps) => {
  const { data: tabulationReport, isLoading } = useSWR<TabulationReport | null>(
    meeting?.id != null ? `/tabulation-report/${meeting.id}` : null,
    async () => {
      if (meeting?.id == null) return null;
      const apiClient = await buildApiClient();
      const result = await apiClient.GET(
        "/meetings/{meetingId}/tabulation-report",
        {
          params: { path: { meetingId: meeting.id } },
        }
      );
      return result.data ?? null;
    },
    { revalidateOnFocus: false }
  );

  const representedShares = tabulationReport?.positionsVoted?.votedShares ?? 0;
  const totalOutstandingShares =
    tabulationReport?.positionsVoted?.totalShares ??
    meeting?.totalSharesOutstanding ??
    0;

  const quorumGaugeModel = buildQuorumGaugeModel({
    totalOutstandingShares,
    representedShares,
    quorumRequirementPercent: meeting?.quorumRequirement ?? 50,
  });

  return (
    <Suspense>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <KeyDatesCard meeting={meeting} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <DocumentHostingCard meeting={meeting} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <QuorumGaugeCard
            title="Percentage to Quorum"
            model={quorumGaugeModel}
            loading={isLoading}
          />
        </Grid>
      </Grid>
    </Suspense>
  );
};

export default Phase1Layout;
