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
} from "../../utils/tabulation-card-layout";
import { formatTabulationMetric } from "../../utils/tabulation-display";
import { voteChartColors } from "../../utils/vote-chart-colors";
import ConfiguredPieChart from "../Reporting/ConfiguredPieChart";

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
  readonly label: string | undefined;
  readonly originalShares: number;
  readonly value: number;
}

const unavailablePieSliceColor = "var(--mui-palette-divider)";

const emptyPieSlice: VotingBreakdownSlice = {
  color: unavailablePieSliceColor,
  id: 3,
  label: undefined,
  originalShares: 0,
  value: 1,
};

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

  // Keep every category in the data so its legend item remains visible.
  const rawBreakdownData =
    selectedProposal === null
      ? []
      : [
          {
            id: 0,
            label: "For",
            shares: selectedProposal.votingResults.for.shares,
            color: voteChartColors.outcomes.for.color,
          },
          {
            id: 1,
            label: "Against",
            shares: selectedProposal.votingResults.against.shares,
            color: voteChartColors.outcomes.against.color,
          },
          {
            id: 2,
            // Abstain and Withhold are the same answer to a reader — neither is
            // a vote for or against — and as two thin arcs they read as noise.
            // The tabulation table still reports them separately.
            label: "Abstain / Withhold",
            shares:
              selectedProposal.votingResults.abstain.shares +
              (selectedProposal.votingResults.withhold?.shares ?? 0),
            color: voteChartColors.outcomes.abstain.color,
          },
        ];

  // Calculate actual total shares voted
  const totalSharesVoted = rawBreakdownData.reduce(
    (sum, item) => sum + item.shares,
    0
  );

  // Normalize populated arcs and leave missing categories as zero-value slices.
  const forcedMinimumShares = totalSharesVoted * (MIN_ARC_PERCENT / 100);

  const votingBreakdownData: VotingBreakdownSlice[] = rawBreakdownData.map(
    (item) => {
      const hasShares = item.shares > 0;
      // If a populated slice is smaller than our allowed threshold, give it a floor value for visual rendering.
      const visualValue = hasShares
        ? Math.max(item.shares, forcedMinimumShares)
        : 0;

      return {
        id: item.id,
        label: item.label,
        color: hasShares ? item.color : unavailablePieSliceColor,
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
  const hasRecordedVotes = totalSharesVoted > 0;
  const pieChartData = hasRecordedVotes
    ? votingBreakdownData
    : [...votingBreakdownData, emptyPieSlice];

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
        ) : (
          <Box
            sx={{
              minHeight: 250,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <ConfiguredPieChart
              centerLabel={{
                centerTooltip: totalMetric.alternate,
                centerValue: totalMetric.display,
                label: "Shares Voted",
                sliceData: pieChartData,
                total: totalSharesVoted,
              }}
              height={tabulationChartHeight}
              hideLegend={false}
              margin={tabulationDonutChartMargin}
              rings={[
                {
                  cx: "50%",
                  cy: tabulationDonutCenterY,
                  data: pieChartData,
                  innerRadius: tabulationDonutInnerRadius,
                  outerRadius: tabulationDonutOuterRadius,
                  highlightScope: { fade: "global", highlight: "item" },
                  // Use originalShares for the hover tooltips
                  valueFormatter: (_value, context) => {
                    const item = pieChartData[context.dataIndex];
                    if (item.label === undefined) {
                      return "";
                    }

                    const metric = formatTabulationMetric(
                      item.originalShares,
                      totalSharesVoted,
                      displayMode
                    );
                    // The tooltip already renders the series label, so return
                    // only the value. Active display mode leads.
                    return `${metric.display} (${metric.alternate})`;
                  },
                },
              ]}
              slotProps={{
                legend: {
                  direction: "horizontal",
                  position: { vertical: "bottom", horizontal: "center" },
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SharesVotedChart;
