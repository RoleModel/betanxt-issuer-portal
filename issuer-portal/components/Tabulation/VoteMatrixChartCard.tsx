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
import { useXScale, useYScale } from "@mui/x-charts/hooks";
import { useId, useState } from "react";

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
import {
  formatTabulationMetric,
  type TabulationDisplayMode,
} from "../../utils/tabulation-display";

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

interface VoteSource {
  readonly id: "ivr" | "print" | "web";
  readonly label: VoteMatrixRow["source"];
}

const voteOutcomes: readonly VoteOutcomeSeries[] = [
  { color: "var(--mui-palette-primary-main)", key: "for", label: "For" },
  {
    color: "var(--mui-palette-secondary-main)",
    key: "against",
    label: "Against",
  },
  {
    color: "var(--mui-palette-chartSeries-6-main)",
    key: "withhold",
    label: "Withhold",
  },
  {
    color: "var(--mui-palette-warning-main)",
    key: "abstain",
    label: "Abstain",
  },
];

const voteSources: readonly VoteSource[] = [
  { id: "web", label: "Web" },
  { id: "print", label: "Print" },
  { id: "ivr", label: "IVR" },
];

const holderTypes = ["Registered", "Beneficial"] as const;

const getPatternId = (
  prefix: string,
  outcome: VoteOutcomeSeries["key"],
  source: VoteSource["id"]
): string => `${prefix}-${outcome}-${source}`;

interface SourcePatternDefinitionsProps {
  readonly prefix: string;
}

const SourcePatternDefinitions = ({
  prefix,
}: SourcePatternDefinitionsProps) => (
  <defs>
    {voteOutcomes.flatMap((outcome) =>
      voteSources.map((source) => {
        const id = getPatternId(prefix, outcome.key, source.id);

        return (
          <pattern
            key={id}
            height="8"
            id={id}
            patternUnits="userSpaceOnUse"
            width="8"
          >
            <rect fill={outcome.color} height="8" width="8" />
            {source.id === "print" ? (
              <path
                d="M-2,2 L2,-2 M0,8 L8,0 M6,10 L10,6"
                opacity="0.6"
                stroke="var(--mui-palette-background-paper)"
                strokeWidth="1.5"
              />
            ) : null}
            {source.id === "ivr" ? (
              <circle
                cx="4"
                cy="4"
                fill="var(--mui-palette-background-paper)"
                opacity="0.65"
                r="1.15"
              />
            ) : null}
          </pattern>
        );
      })
    )}
  </defs>
);

const SourceLegendSwatch = ({ source }: { readonly source: VoteSource }) => (
  <Box
    aria-hidden="true"
    component="svg"
    sx={{ display: "block", height: 12, width: 16 }}
    viewBox="0 0 16 12"
  >
    <rect
      fill="var(--mui-palette-text-primary)"
      height="12"
      opacity={source.id === "web" ? 1 : 0.85}
      width="16"
    />
    {source.id === "print" ? (
      <path
        d="M-2,4 L4,-2 M0,12 L12,0 M8,14 L18,4"
        opacity="0.9"
        stroke="var(--mui-palette-background-paper)"
        strokeWidth="2"
      />
    ) : null}
    {source.id === "ivr" ? (
      <circle
        cx="8"
        cy="6"
        fill="var(--mui-palette-background-paper)"
        opacity="0.9"
        r="2"
      />
    ) : null}
  </Box>
);

interface BarLabelAtBaseProps {
  readonly displayMode: TabulationDisplayMode;
  readonly holderTotals: readonly number[];
  readonly totalShares: number;
}

/**
 * Renders one total at the lower-right of each full stacked bar. This is an
 * overlay rather than a regular bar label because a chart row has nine nested
 * source/outcome series but should expose only one holder-type total.
 */
const BarLabelAtBase = ({
  displayMode,
  holderTotals,
  totalShares,
}: BarLabelAtBaseProps) => {
  const xScale = useXScale<"linear">();
  const yScale = useYScale<"band">();

  return (
    <g aria-label="Holder type totals">
      {holderTypes.map((holderType, index) => {
        const total = holderTotals[index] ?? 0;
        if (total === 0) {
          return null;
        }

        const displayedTotal =
          displayMode === "numbers" ? total : (total / totalShares) * 100;
        const metric = formatTabulationMetric(total, totalShares, displayMode);
        const y = yScale(holderType);

        if (y === undefined) {
          return null;
        }

        return (
          <text
            data-testid={`vote-matrix-total-${holderType.toLowerCase()}`}
            dominantBaseline="auto"
            fill="var(--mui-palette-text-primary)"
            key={holderType}
            paintOrder="stroke"
            stroke="var(--mui-palette-background-paper)"
            strokeWidth="3"
            textAnchor="end"
            x={xScale(displayedTotal) - 6}
            y={y + yScale.bandwidth() - 7}
          >
            {metric.display}
          </text>
        );
      })}
    </g>
  );
};

/**
 * A single proposal-level figure for the three related tabulation questions:
 * holder type, voting source, and vote outcome. The two bars are holder type;
 * outcome is the primary color and the source is the pattern within it.
 */
const VoteMatrixChartCard = ({
  loading,
  proposals,
}: VoteMatrixChartCardProps) => {
  const { displayMode } = useTabulationDisplay();
  const [selectedProposalId, setSelectedProposalId] = useState("");
  const patternPrefix = `vote-matrix-${useId().replaceAll(":", "")}`;
  const selectedProposal =
    proposals.find((proposal) => proposal.proposalId === selectedProposalId) ??
    proposals[0];
  const rows = selectedProposal?.rows ?? [];
  const totalShares = rows.reduce(
    (sum, row) => sum + row.for + row.against + row.withhold + row.abstain,
    0
  );
  const holderTotals = holderTypes.map((holderType) =>
    rows
      .filter((row) => row.holderType === holderType)
      .reduce(
        (sum, row) => sum + row.for + row.against + row.withhold + row.abstain,
        0
      )
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
          <Box sx={{ width: "100%" }}>
            <BarChart
              grid={{ vertical: true }}
              height={310}
              hideLegend
              layout="horizontal"
              margin={{ bottom: 30, left: 10, right: 24, top: 12 }}
              series={voteOutcomes.flatMap((outcome) =>
                voteSources.map((source) => {
                  const actualValues = holderTypes.map((holderType) => {
                    const row = rows.find(
                      (candidate) =>
                        candidate.holderType === holderType &&
                        candidate.source === source.label
                    );
                    return row?.[outcome.key] ?? 0;
                  });

                  return {
                    color: `url(#${getPatternId(patternPrefix, outcome.key, source.id)})`,
                    data: actualValues.map((value) =>
                      displayMode === "numbers"
                        ? value
                        : (value / totalShares) * 100
                    ),
                    id: `${outcome.key}-${source.id}`,
                    label: `${outcome.label} — ${source.label}`,
                    stack: "vote-outcome",
                    valueFormatter: (_value, context) => {
                      const actualValue = actualValues[context.dataIndex] ?? 0;
                      const metric = formatTabulationMetric(
                        actualValue,
                        totalShares,
                        displayMode
                      );
                      const holderType = holderTypes[context.dataIndex] ?? "";
                      return `${holderType} · ${source.label} · ${outcome.label}: ${metric.display} (${metric.alternate})`;
                    },
                  };
                })
              )}
              xAxis={[
                {
                  valueFormatter: (value: number) =>
                    displayMode === "numbers"
                      ? formatNumber(value)
                      : `${value.toFixed(0)}%`,
                },
              ]}
              yAxis={[{ data: holderTypes, scaleType: "band" }]}
            >
              <SourcePatternDefinitions prefix={patternPrefix} />
              <BarLabelAtBase
                displayMode={displayMode}
                holderTotals={holderTotals}
                totalShares={totalShares}
              />
            </BarChart>
            <Box
              aria-label="Vote outcome and source legend"
              sx={{ display: "flex", flexWrap: "wrap", gap: 2, px: 1 }}
            >
              <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <Typography color="text.secondary" variant="caption">
                  Outcome:
                </Typography>
                {voteOutcomes.map((outcome) => (
                  <Box
                    key={outcome.key}
                    sx={{ alignItems: "center", display: "flex", gap: 0.5 }}
                  >
                    <Box
                      sx={{
                        backgroundColor: outcome.color,
                        height: 12,
                        width: 16,
                      }}
                    />
                    <Typography variant="caption">{outcome.label}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <Typography color="text.secondary" variant="caption">
                  Source:
                </Typography>
                {voteSources.map((source) => (
                  <Box
                    key={source.id}
                    sx={{ alignItems: "center", display: "flex", gap: 0.5 }}
                  >
                    <SourceLegendSwatch source={source} />
                    <Typography variant="caption">{source.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VoteMatrixChartCard;
