/* eslint-disable @typescript-eslint/naming-convention */
"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { useState } from "react";

import type { ProposalVoting } from "../../types/phases";

import { useTabulationDisplay } from "../../contexts/TabulationDisplayContext";
import { useVotingTabulation } from "../../hooks/use-voting-tabulation";
import {
  tabulationCardContentStyles,
  tabulationCardHeaderStyles,
  tabulationCardStyles,
  tabulationChartHeight,
  tabulationDonutCenterY,
  tabulationDonutChartMargin,
  tabulationDonutInnerRadius,
  tabulationDonutOuterRadius,
  shouldShowTabulationPieArcLabels,
  TabulationPieArcLabel,
} from "../../utils/tabulation-card-layout";
import { formatTabulationMetric } from "../../utils/tabulation-display";
import PieCenterLabel from "../Reporting/PieChartCenterLabel";

interface SharesVotedChartProps {
  /** Meeting whose proposals are fetched via {@link useVotingTabulation}. Ignored when `proposalsOverride` is set. */
  readonly meetingId?: string;
  /** Forces the loading state from the parent (e.g. while the page-level fetch resolves). */
  readonly loading?: boolean;
  /** Pre-fetched proposals to render instead of fetching by `meetingId`. */
  readonly proposalsOverride?: readonly ProposalVoting[];
}

/** Minimum percentage size for an arc slice to prevent microscopic lines */
const MIN_ARC_PERCENT = 4; // e.g., 4% minimum visual width

interface VotingBreakdownSlice {
  readonly color: string;
  readonly id: number;
  readonly label: string;
  readonly originalShares: number;
  readonly value: number;
}

/**
 * Donut chart of FOR / AGAINST / ABSTAIN shares for a single proposal.
 */
const SharesVotedChart = ({
  meetingId,
  loading = false,
  proposalsOverride,
}: SharesVotedChartProps) => {
  const { displayMode } = useTabulationDisplay();
  const { proposals: fetchedProposals, loading: votingLoading } =
    useVotingTabulation(meetingId);

  const proposals = proposalsOverride ?? fetchedProposals;

  const sortedProposals = Array.from(proposals).sort(
    (firstProposal, secondProposal) =>
      firstProposal.proposalNumber - secondProposal.proposalNumber
  );

  const [selectedProposalId, setSelectedProposalId] = useState<string>("");

  const selectedProposal =
    sortedProposals.find(
      (proposal) => proposal.proposalId === selectedProposalId
    ) ??
    sortedProposals.at(0) ??
    null;

  // 1. Gather all recorded vote categories that are > 0
  const rawBreakdownData =
    selectedProposal === null
      ? []
      : [
          {
            id: 0,
            label: "For",
            shares: selectedProposal.votingResults.for.shares,
            color: "var(--mui-palette-primary-main)",
          },
          {
            id: 1,
            label: "Against",
            shares: selectedProposal.votingResults.against.shares,
            color: "var(--mui-palette-secondary-main)",
          },
          {
            id: 2,
            label: "Abstain",
            shares: selectedProposal.votingResults.abstain.shares,
            color: "var(--mui-palette-primary-light)",
          },
        ].filter((item) => item.shares > 0);

  // Calculate actual total shares voted
  const totalSharesVoted = rawBreakdownData.reduce(
    (sum, item) => sum + item.shares,
    0
  );

  // 2. Normalize and enforce minimum layout rules for the visible arcs
  const forcedMinimumShares = totalSharesVoted * (MIN_ARC_PERCENT / 100);

  const votingBreakdownData: VotingBreakdownSlice[] = rawBreakdownData.map(
    (item) => {
      // If the slice is smaller than our allowed threshold, give it a floor value for visual rendering
      const visualValue = Math.max(item.shares, forcedMinimumShares);

      return {
        id: item.id,
        label: item.label,
        color: item.color,
        value: visualValue, // MUI X Charts calculates the angle from this property
        originalShares: item.shares, // Kept intact to drive accurate labels/tooltips
      };
    }
  );

  const totalMetric = formatTabulationMetric(
    totalSharesVoted,
    totalSharesVoted,
    displayMode
  );
  const showArcLabels = shouldShowTabulationPieArcLabels(
    votingBreakdownData.length
  );

  if (loading || votingLoading) {
    return (
      <Card sx={tabulationCardStyles}>
        <CardHeader title="Shares Voted" />
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" width="50%" height={30} />
            <Skeleton
              variant="text"
              width={tabulationChartHeight}
              height={20}
            />
            <Skeleton
              variant="text"
              width={tabulationChartHeight}
              height={20}
            />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const headerSubtitle =
    selectedProposal !== null
      ? `Viewing: Proposal ${selectedProposal.proposalNumber}`
      : undefined;

  return (
    <Card sx={tabulationCardStyles}>
      <CardHeader
        title="Shares Voted"
        subheader={headerSubtitle}
        action={
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="shares-voted-proposal-select-label">
              Proposal
            </InputLabel>
            <Select
              labelId="shares-voted-proposal-select-label"
              id="shares-voted-proposal-select"
              label="Proposal"
              value={selectedProposal?.proposalId ?? ""}
              onChange={(event) => {
                setSelectedProposalId(event.target.value);
              }}
              disabled={sortedProposals.length <= 1}
            >
              {sortedProposals.map((proposal) => (
                <MenuItem key={proposal.proposalId} value={proposal.proposalId}>
                  {`Proposal ${proposal.proposalNumber}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
        sx={tabulationCardHeaderStyles}
      />
      <CardContent sx={tabulationCardContentStyles}>
        {selectedProposal === null ? (
          <Box
            sx={{
              minHeight: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            No proposals available for this meeting
          </Box>
        ) : rawBreakdownData.length === 0 ? (
          <Box
            sx={{
              minHeight: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              textAlign: "center",
              px: 2,
            }}
          >
            {`No votes have been recorded for Proposal ${selectedProposal.proposalNumber} yet`}
          </Box>
        ) : (
          <Box
            sx={{
              minHeight: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <PieChart
              series={[
                {
                  cx: "50%",
                  cy: tabulationDonutCenterY,
                  data: votingBreakdownData,
                  innerRadius: tabulationDonutInnerRadius,
                  outerRadius: tabulationDonutOuterRadius,
                  highlightScope: { fade: "global", highlight: "item" },
                  // Use originalShares for the printed chart labels
                  arcLabel: showArcLabels
                    ? (item) => {
                        const slice = votingBreakdownData.find(
                          (currentSlice) => currentSlice.id === item.id
                        );
                        if (slice === undefined) return "";

                        const metric = formatTabulationMetric(
                          slice.originalShares,
                          totalSharesVoted,
                          displayMode
                        );
                        return `${slice.label}: ${metric.display}`;
                      }
                    : undefined,
                  arcLabelMinAngle: showArcLabels ? 5 : undefined,
                  // Use originalShares for the hover tooltips
                  valueFormatter: (_value, context) => {
                    const item = votingBreakdownData[context.dataIndex];
                    const metric = formatTabulationMetric(
                      item.originalShares,
                      totalSharesVoted,
                      displayMode
                    );
                    return `${item.label}: ${metric.display}`;
                  },
                },
              ]}
              height={tabulationChartHeight}
              margin={tabulationDonutChartMargin}
              hideLegend={false}
              slotProps={{
                legend: {
                  direction: "horizontal",
                  position: { vertical: "bottom", horizontal: "center" },
                },
              }}
              slots={{ pieArcLabel: TabulationPieArcLabel }}
            >
              <PieCenterLabel
                data={{
                  total: totalSharesVoted,
                  centerTooltip: totalMetric.alternate,
                  centerValue: totalMetric.display,
                  label: "Shares Voted",
                  sliceData: votingBreakdownData,
                }}
              />
            </PieChart>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SharesVotedChart;
