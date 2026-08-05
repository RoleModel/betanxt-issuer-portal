"use client";

import { Box } from "@mui/material";
import { useState } from "react";

import type { VoteMatrixProposal } from "@/hooks/useTabulationInsights";

import HolderOutcomeChartCard from "@/components/Charts/HolderOutcome/HolderOutcomeChartCard";
import VotingSourceChartCard from "@/components/Charts/VotingSource/VotingSourceChartCard";
import {
  type HolderType,
  holderTypes,
  sumRowOutcomes,
  type VoteOutcomeKey,
  type VoteSourceId,
} from "@/components/Charts/series/vote-breakdown-chart-data";

interface VoteMatrixChartCardProps {
  readonly loading: boolean;
  readonly proposals: readonly VoteMatrixProposal[];
}

/** Coordinates the shared proposal and legend-filter state for two independent cards. */
const VoteMatrixChartCard = ({
  loading,
  proposals,
}: VoteMatrixChartCardProps) => {
  const [hiddenOutcomeKeys, setHiddenOutcomeKeys] = useState<
    ReadonlySet<VoteOutcomeKey>
  >(() => new Set());
  const [hiddenSourceIds, setHiddenSourceIds] = useState<
    ReadonlySet<VoteSourceId>
  >(() => new Set());
  const [hiddenHolderTypes, setHiddenHolderTypes] = useState<
    ReadonlySet<HolderType>
  >(() => new Set());
  const [selectedProposalId, setSelectedProposalId] = useState("");
  const selectedProposal =
    proposals.find((proposal) => proposal.proposalId === selectedProposalId) ??
    proposals.at(0);
  const rows = selectedProposal?.rows ?? [];
  const totalShares = rows.reduce((sum, row) => sum + sumRowOutcomes(row), 0);
  const toggleOutcome = (outcomeKey: VoteOutcomeKey): void => {
    setHiddenOutcomeKeys((previous) => {
      const next = new Set(previous);
      if (next.has(outcomeKey)) {
        next.delete(outcomeKey);
      } else {
        next.add(outcomeKey);
      }
      return next;
    });
  };
  const toggleHolderType = (holderType: HolderType): void => {
    setHiddenHolderTypes((previous) => {
      const next = new Set(previous);
      if (next.has(holderType)) {
        next.delete(holderType);
      } else {
        next.add(holderType);
      }
      // Never hide the last one - an axis with no bands renders nothing and
      // leaves no way back other than reloading.
      return next.size === holderTypes.length ? previous : next;
    });
  };
  const toggleSource = (sourceId: VoteSourceId): void => {
    setHiddenSourceIds((previous) => {
      const next = new Set(previous);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  };

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { lg: "minmax(0, 1fr) minmax(0, 1fr)", xs: "1fr" },
        width: "100%",
      }}
    >
      <VotingSourceChartCard
        hiddenSourceIds={hiddenSourceIds}
        loading={loading}
        onSourceToggle={toggleSource}
        rows={rows}
        totalShares={totalShares}
      />
      <HolderOutcomeChartCard
        hiddenHolderTypes={hiddenHolderTypes}
        hiddenOutcomeKeys={hiddenOutcomeKeys}
        loading={loading}
        onHolderTypeToggle={toggleHolderType}
        onOutcomeToggle={toggleOutcome}
        onProposalChange={setSelectedProposalId}
        proposals={proposals}
        rows={rows}
        selectedProposalId={selectedProposal?.proposalId ?? ""}
        totalShares={totalShares}
      />
    </Box>
  );
};

export default VoteMatrixChartCard;
