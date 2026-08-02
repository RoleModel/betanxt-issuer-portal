"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";

import type { VotingSourceBreakdown } from "@/hooks/useTabulationInsights";

import { useTabulationDisplay } from "../../contexts/TabulationDisplayContext";
import { formatNumber } from "../../utils/number-utilities";
import {
  tabulationCardContentStyles,
  tabulationCardHeaderStyles,
  tabulationCardStyles,
} from "../../utils/tabulation-card-layout";
import { formatTabulationMetric } from "../../utils/tabulation-display";

interface VotingSourceBreakdownCardProps {
  readonly breakdown: VotingSourceBreakdown;
  readonly loading: boolean;
}

interface VotingSourceSeries {
  readonly color: string;
  readonly key: keyof VotingSourceBreakdown["registered"];
  readonly label: string;
}

const votingSourceSeries: readonly VotingSourceSeries[] = [
  {
    color: "var(--mui-palette-primary-main)",
    key: "web",
    label: "Web",
  },
  {
    color: "var(--mui-palette-secondary-main)",
    key: "print",
    label: "Print",
  },
  {
    color: "var(--mui-palette-primary-light)",
    key: "ivr",
    label: "IVR",
  },
];

const holderTypes = ["Registered", "Beneficial"] as const;

/**
 * One view of voted shares by holder type and submission source. It replaces
 * the separate holder-type and registered-only voting-activity figures, so
 * both bars use the same voted-share denominator.
 */
const VotingSourceBreakdownCard = ({
  breakdown,
  loading,
}: VotingSourceBreakdownCardProps) => {
  const { displayMode } = useTabulationDisplay();
  const valuesBySource = votingSourceSeries.map((source) => [
    breakdown.registered[source.key],
    breakdown.beneficial[source.key],
  ]);
  const totalVotedShares = valuesBySource
    .flat()
    .reduce((sum, value) => sum + value, 0);

  return (
    <Card sx={tabulationCardStyles}>
      <CardHeader
        subheader="Voted shares by submission source"
        sx={tabulationCardHeaderStyles}
        title="Holder Type & Voting Source"
      />
      <CardContent sx={tabulationCardContentStyles}>
        {loading ? (
          <Skeleton height={300} variant="rectangular" width="100%" />
        ) : totalVotedShares === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography color="text.secondary" variant="body2">
              No voted shares recorded yet.
            </Typography>
          </Box>
        ) : (
          <BarChart
            grid={{ vertical: true }}
            height={300}
            layout="horizontal"
            margin={{ bottom: 36, left: 105, right: 24, top: 12 }}
            series={votingSourceSeries.map((source, sourceIndex) => {
              const sourceValues = valuesBySource[sourceIndex];
              const displayedValues = sourceValues.map((value) =>
                displayMode === "numbers"
                  ? value
                  : (value / totalVotedShares) * 100
              );

              return {
                color: source.color,
                data: displayedValues,
                label: source.label,
                stack: "voting-source",
                valueFormatter: (_value, context) => {
                  const actualValue = sourceValues[context.dataIndex] ?? 0;
                  const metric = formatTabulationMetric(
                    actualValue,
                    totalVotedShares,
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
            yAxis={[{ data: holderTypes, scaleType: "band" }]}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default VotingSourceBreakdownCard;
