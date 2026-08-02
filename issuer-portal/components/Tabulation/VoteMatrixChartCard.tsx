"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { useState } from "react";

import type {
  VoteMatrixProposal,
  VoteMatrixRow,
} from "@/hooks/useTabulationInsights";

import { useTabulationDisplay } from "../../contexts/TabulationDisplayContext";
import { formatNumber } from "../../utils/number-utilities";
import {
  tabulationCardContentStyles,
  tabulationCardHeaderStyles,
  tabulationCardStyles,
} from "../../utils/tabulation-card-layout";
import { formatTabulationMetric } from "../../utils/tabulation-display";

interface VoteMatrixChartCardProps {
  readonly loading: boolean;
  readonly proposals: readonly VoteMatrixProposal[];
}

interface VoteOutcomeSeries {
  readonly color: string;
  readonly key: keyof Pick<
    VoteMatrixRow,
    "against" | "abstain" | "for" | "withhold"
  >;
  readonly label: string;
}

const voteOutcomeSeries: readonly VoteOutcomeSeries[] = [
  { color: "var(--mui-palette-success-main)", key: "for", label: "For" },
  { color: "var(--mui-palette-error-main)", key: "against", label: "Against" },
  {
    color: "var(--mui-palette-warning-main)",
    key: "withhold",
    label: "Withhold",
  },
  {
    color: "var(--mui-palette-primary-light)",
    key: "abstain",
    label: "Abstain",
  },
];

/**
 * A single proposal-level figure for the three related tabulation questions:
 * holder type, voting source, and vote outcome. Rows nest each voting source
 * under Registered and Beneficial; the horizontal stacks show the outcome.
 */
const VoteMatrixChartCard = ({
  loading,
  proposals,
}: VoteMatrixChartCardProps) => {
  const { displayMode } = useTabulationDisplay();
  const [selectedProposalId, setSelectedProposalId] = useState("");
  const selectedProposal =
    proposals.find((proposal) => proposal.proposalId === selectedProposalId) ??
    proposals[0];
  const rows = selectedProposal?.rows ?? [];
  const totalShares = rows.reduce(
    (sum, row) => sum + row.for + row.against + row.withhold + row.abstain,
    0
  );

  return (
    <Card sx={tabulationCardStyles}>
      <CardHeader
        action={
          proposals.length > 1 ? (
            <TextField
              label="Proposal"
              onChange={(event) => {
                setSelectedProposalId(event.target.value);
              }}
              select
              size="small"
              sx={{ minWidth: 280 }}
              value={selectedProposal?.proposalId ?? ""}
            >
              {proposals.map((proposal) => (
                <MenuItem key={proposal.proposalId} value={proposal.proposalId}>
                  {proposal.proposalLabel}
                </MenuItem>
              ))}
            </TextField>
          ) : undefined
        }
        subheader="Voted shares by holder type, voting source, and outcome"
        sx={tabulationCardHeaderStyles}
        title="Vote Breakdown"
      />
      <CardContent sx={tabulationCardContentStyles}>
        {loading ? (
          <Skeleton height={360} variant="rectangular" width="100%" />
        ) : totalShares === 0 ? (
          <Box sx={{ py: 10, textAlign: "center" }}>
            <Typography color="text.secondary" variant="body2">
              No source-attributed votes recorded for this proposal yet.
            </Typography>
          </Box>
        ) : (
          <BarChart
            grid={{ vertical: true }}
            height={360}
            layout="horizontal"
            margin={{ bottom: 36, left: 150, right: 24, top: 12 }}
            series={voteOutcomeSeries.map((outcome) => {
              const actualValues = rows.map((row) => row[outcome.key]);

              return {
                color: outcome.color,
                data: actualValues.map((value) =>
                  displayMode === "numbers"
                    ? value
                    : (value / totalShares) * 100
                ),
                label: outcome.label,
                stack: "vote-outcome",
                valueFormatter: (_value, context) => {
                  const actualValue = actualValues[context.dataIndex] ?? 0;
                  const metric = formatTabulationMetric(
                    actualValue,
                    totalShares,
                    displayMode
                  );
                  return `${metric.display} (${metric.alternate})`;
                },
              };
            })}
            slotProps={{
              legend: {
                direction: "horizontal",
                position: { horizontal: "center", vertical: "bottom" },
              },
            }}
            xAxis={[
              {
                valueFormatter: (value: number) =>
                  displayMode === "numbers"
                    ? formatNumber(value)
                    : `${value.toFixed(0)}%`,
              },
            ]}
            yAxis={[
              {
                data: rows.map((row) => `${row.holderType} — ${row.source}`),
                scaleType: "band",
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default VoteMatrixChartCard;
