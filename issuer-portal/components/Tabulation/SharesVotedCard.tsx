"use client";

import type { VotingSummary } from "@/types/phases";

import SharesVotedChart from "@/components/Meeting/SharesVotedChart";

interface SharesVotedCardProps {
  meetingId: string;
  loading?: boolean;
  votingSummaryOverride?: VotingSummary | null;
}

export default function SharesVotedCard({
  meetingId,
  loading,
  votingSummaryOverride,
}: SharesVotedCardProps) {
  return (
    <SharesVotedChart
      meetingId={meetingId}
      loading={loading}
      votingSummaryOverride={votingSummaryOverride}
    />
  );
}
