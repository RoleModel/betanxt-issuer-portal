"use client";

import type { ProposalVoting } from "@/types/phases";

import SharesVotedChart from "@/components/Meeting/SharesVotedChart";

interface SharesVotedCardProps {
  readonly meetingId: string;
  readonly loading?: boolean;
  /** Pre-fetched proposals forwarded to the chart's proposal selector, avoiding a duplicate fetch. */
  readonly proposalsOverride?: ProposalVoting[];
}

/**
 * Tabulation-page wrapper around {@link SharesVotedChart}, which renders the
 * per-proposal shares-voted donut with its proposal selector. The chart reads
 * the page-level display mode from `TabulationDisplayContext`.
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
