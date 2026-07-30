"use client";

import type { ProposalVoting } from "@/types/phases";

import SharesVotedChart from "@/components/Meeting/SharesVotedChart";

interface SharesVotedCardProps {
  meetingId: string;
  loading?: boolean;
  /** Pre-fetched proposals forwarded to the chart's proposal selector, avoiding a duplicate fetch. */
  proposalsOverride?: ProposalVoting[];
}

/**
 * Tabulation-page wrapper around {@link SharesVotedChart}, which renders the
 * per-proposal shares-voted donut with its proposal selector. Exists so the
 * page can pass its already-fetched proposals straight through.
 */
const SharesVotedCard = ({
  meetingId,
  loading,
  proposalsOverride,
}: SharesVotedCardProps) => {
  return (
    <SharesVotedChart
      meetingId={meetingId}
      loading={loading}
      proposalsOverride={proposalsOverride}
    />
  );
};

export default SharesVotedCard;
