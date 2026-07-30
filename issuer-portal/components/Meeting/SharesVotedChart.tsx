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
  Typography,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import React, { useMemo, useState } from "react";

import type { ProposalVoting } from "@/types/phases";

import PieCenterLabel from "@/components/Reporting/PieChartCenterLabel";
import { useVotingTabulation } from "@/hooks/useVotingTabulation";

interface SharesVotedChartProps {
  /** Meeting whose proposals are fetched via {@link useVotingTabulation}. Ignored when `proposalsOverride` is set. */
  meetingId?: string;
  /** Forces the loading state from the parent (e.g. while the page-level fetch resolves). */
  loading?: boolean;
  /** Pre-fetched proposals to render instead of fetching by `meetingId`. */
  proposalsOverride?: ProposalVoting[];
}

const TITLE_TRUNCATION_LENGTH = 20;

/**
 * Truncates a proposal title for display in the selector menu, appending an
 * ellipsis when it exceeds {@link TITLE_TRUNCATION_LENGTH} characters.
 *
 * @param title - Full proposal title
 * @returns The original title, or a trimmed prefix ending in `…`
 */
function truncateTitle(title: string): string {
  if (title.length <= TITLE_TRUNCATION_LENGTH) return title;
  return `${title.slice(0, TITLE_TRUNCATION_LENGTH).trimEnd()}…`;
}

/**
 * Resolves the display title for a proposal, falling back to its description
 * when no explicit title was provided.
 *
 * @param proposal - Proposal voting record
 * @returns Human-readable proposal title
 */
function getProposalTitle(proposal: ProposalVoting): string {
  return proposal.proposalTitle || proposal.description;
}

/**
 * Donut chart of FOR / AGAINST / ABSTAIN shares for a single proposal.
 *
 * Proposals are listed in a selector ordered by proposal number; the
 * lowest-numbered proposal is shown by default and the selector is disabled
 * for single-proposal meetings. Zero-vote slices are omitted, and an empty
 * state is rendered when the selected proposal has no recorded votes
 * (002-tabulation-enhancements contract C2).
 *
 * @example
 * <SharesVotedChart meetingId="wen-annual-meeting-2025" />
 */
const SharesVotedChart = ({
  meetingId,
  loading = false,
  proposalsOverride,
}: SharesVotedChartProps) => {
  const { proposals: fetchedProposals, loading: votingLoading } =
    useVotingTabulation(meetingId);
  const proposals = proposalsOverride ?? fetchedProposals;

  const sortedProposals = useMemo(
    () => [...proposals].sort((a, b) => a.proposalNumber - b.proposalNumber),
    [proposals]
  );

  const [selectedProposalId, setSelectedProposalId] = useState<string>("");

  const selectedProposal = useMemo(() => {
    const matched = sortedProposals.find(
      (proposal) => proposal.proposalId === selectedProposalId
    );
    return matched ?? sortedProposals[0] ?? null;
  }, [selectedProposalId, sortedProposals]);

  const votingBreakdownData = useMemo(() => {
    if (!selectedProposal) return [];

    return [
      {
        id: 0,
        label: "For",
        value: selectedProposal.votingResults.for.shares,
        color: "var(--mui-palette-chartSeries-0-main)",
      },
      {
        id: 1,
        label: "Against",
        value: selectedProposal.votingResults.against.shares,
        color: "var(--mui-palette-chartSeries-1-main)",
      },
      {
        id: 2,
        label: "Abstain",
        value: selectedProposal.votingResults.abstain.shares,
        color: "var(--mui-palette-chartSeries-2-main)",
      },
    ].filter((item) => item.value > 0);
  }, [selectedProposal]);

  const totalSharesVoted = votingBreakdownData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  if (loading || votingLoading) {
    return (
      <Card>
        <CardHeader title="Shares Voted" />
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  const headerSubtitle = selectedProposal
    ? `Viewing: Proposal ${selectedProposal.proposalNumber}`
    : undefined;

  return (
    <Card sx={{ flex: 1, height: "100%" }}>
      <CardHeader title="Shares Voted" subheader={headerSubtitle} />
      <CardContent>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="shares-voted-proposal-select-label">
            Proposal
          </InputLabel>
          <Select
            labelId="shares-voted-proposal-select-label"
            id="shares-voted-proposal-select"
            label="Proposal"
            value={selectedProposal?.proposalId ?? ""}
            onChange={(event) => setSelectedProposalId(event.target.value)}
            disabled={sortedProposals.length <= 1}
          >
            {sortedProposals.map((proposal) => (
              <MenuItem key={proposal.proposalId} value={proposal.proposalId}>
                {`Proposal ${proposal.proposalNumber}: ${truncateTitle(getProposalTitle(proposal))}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {!selectedProposal ? (
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
        ) : votingBreakdownData.length === 0 ? (
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
                  data: votingBreakdownData,
                  innerRadius: 75,
                  outerRadius: 100,
                  highlightScope: { fade: "global", highlight: "item" },
                },
              ]}
              width={250}
              height={250}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              hideLegend={false}
              slotProps={{
                legend: {
                  direction: "horizontal",
                  position: { vertical: "bottom", horizontal: "center" },
                },
              }}
            >
              <PieCenterLabel
                data={{
                  total: totalSharesVoted,
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
