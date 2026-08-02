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
import { useXScale, useYScale } from "@mui/x-charts/hooks";
import {
  PatternCircles,
  PatternLines,
  PatternOrientation,
} from "@visx/pattern";
import { useId } from "react";

import type { VoteMatrixRow } from "@/hooks/useTabulationInsights";

import { EmptyState } from "../EmptyState";
import { HowToVoteOutlined } from "@mui/icons-material";

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
import {
  holderTypes,
  sumRowOutcomes,
  type VoteSource,
  type VoteSourceId,
  voteSources,
} from "./vote-breakdown-chart-data";

const patternForeground = "var(--mui-palette-common-black)";

const getSourcePatternId = (prefix: string, source: VoteSourceId): string =>
  `${prefix}-${source}`;

const SourcePatternDefinitions = ({ prefix }: { readonly prefix: string }) => {
  return (
    <defs>
      {voteSources.map((source) => {
        const id = getSourcePatternId(prefix, source.id);

        if (source.id === "web") {
          return (
            <PatternLines
              background={source.color}
              height={6}
              id={id}
              key={id}
              orientation={[
                PatternOrientation.horizontal,
                PatternOrientation.vertical,
              ]}
              stroke={patternForeground}
              strokeWidth={0.8}
              width={6}
            />
          );
        }

        if (source.id === "print") {
          return (
            <PatternLines
              background={source.color}
              height={6}
              id={id}
              key={id}
              orientation={[PatternOrientation.diagonal]}
              stroke={patternForeground}
              strokeWidth={1}
              width={6}
            />
          );
        }

        return (
          <PatternCircles
            background={source.color}
            fill={patternForeground}
            height={6}
            id={id}
            key={id}
            width={6}
            complement
          />
        );
      })}
    </defs>
  );
};

const SourceLegendSwatch = ({ source }: { readonly source: VoteSource }) => {
  const patternId = `source-legend-${source.id}-${useId().replaceAll(":", "")}`;

  return (
    <Box
      aria-hidden="true"
      component="svg"
      sx={{ display: "block", height: 20, width: 20 }}
      viewBox="0 0 20 20"
    >
      <SourcePatternDefinitions prefix={patternId} />
      <rect
        fill={`url(#${getSourcePatternId(patternId, source.id)})`}
        height="20"
        rx="2"
        ry="2"
        width="20"
      />
    </Box>
  );
};

interface BarLabelAtBaseProps {
  readonly displayMode: TabulationDisplayMode;
  readonly holderTotals: readonly number[];
  readonly totalShares: number;
}

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
        const y = yScale(holderType);

        if (total === 0 || y === undefined) {
          return null;
        }

        const displayedTotal =
          displayMode === "numbers" ? total : (total / totalShares) * 100;
        const metric = formatTabulationMetric(total, totalShares, displayMode);

        return (
          <text
            data-testid={`vote-matrix-total-${holderType.toLowerCase()}`}
            fill="var(--mui-palette-text-primary)"
            fontSize="24"
            fontWeight="bold"
            key={holderType}
            paintOrder="stroke"
            stroke="var(--mui-palette-background-paper)"
            strokeWidth="2"
            textAnchor="end"
            x={xScale(displayedTotal) - 8}
            y={y + yScale.bandwidth() - 8}
          >
            {metric.display}
          </text>
        );
      })}
    </g>
  );
};

export interface VotingSourceChartCardProps {
  readonly hiddenSourceIds: ReadonlySet<VoteSourceId>;
  readonly loading: boolean;
  readonly onSourceToggle: (sourceId: VoteSourceId) => void;
  readonly rows: readonly VoteMatrixRow[];
  readonly totalShares: number;
}

const VotingSourceChartCard = ({
  hiddenSourceIds,
  loading,
  onSourceToggle,
  rows,
  totalShares,
}: VotingSourceChartCardProps) => {
  const { displayMode } = useTabulationDisplay();
  const patternPrefix = `vote-source-${useId().replaceAll(":", "")}`;
  const sourceSeries = voteSources.map((source) => {
    const actualValues = holderTypes.map((holderType) =>
      rows
        .filter(
          (row) => row.holderType === holderType && row.source === source.label
        )
        .reduce((sum, row) => sum + sumRowOutcomes(row), 0)
    );

    return {
      color: `url(#${getSourcePatternId(patternPrefix, source.id)})`,
      data: actualValues.map((value) =>
        displayMode === "numbers" ? value : (value / totalShares) * 100
      ),
      id: source.id,
      label: source.label,
      stack: "source",
      ...(hiddenSourceIds.has(source.id) ? { hidden: true } : {}),
      valueFormatter: (
        displayedValue: number | null,
        context: { dataIndex: number }
      ) => {
        const actualValue =
          displayMode === "numbers"
            ? (displayedValue ?? 0)
            : (actualValues[context.dataIndex] ?? 0);
        const metric = formatTabulationMetric(
          actualValue,
          totalShares,
          displayMode
        );
        return `${source.label}: ${metric.display} (${metric.alternate})`;
      },
    };
  });
  const visibleSourceLabels = voteSources.reduce<Set<VoteMatrixRow["source"]>>(
    (labels, source) => {
      if (!hiddenSourceIds.has(source.id)) {
        labels.add(source.label);
      }
      return labels;
    },
    new Set()
  );
  const visibleHolderTotals = holderTypes.map((holderType) =>
    rows
      .filter(
        (row) =>
          row.holderType === holderType && visibleSourceLabels.has(row.source)
      )
      .reduce((sum, row) => sum + sumRowOutcomes(row), 0)
  );

  return (
    <Card sx={tabulationCardStyles}>
      <CardHeader
        subheader="Votes by source"
        sx={tabulationCardHeaderStyles}
        title="Voting Activity"
      />
      <CardContent sx={tabulationCardContentStyles}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            width: "100%",
            height: "100%",
          }}
        >
          {loading ? (
            <Skeleton height={300} variant="rectangular" width="100%" />
          ) : totalShares === 0 ? (
            <EmptyState
              description="Once shares are voted, this chart will show the results by source."
              icon={<HowToVoteOutlined color="disabled" fontSize="large" />}
              minHeight="unset"
              title="No votes recorded yet"
            />
          ) : (
            <Box
              sx={{
                width: "100%",
              }}
            >
              <BarChart
                grid={{ vertical: true }}
                height={340}
                hideLegend
                layout="horizontal"
                margin={{ bottom: 30, left: 0, right: 24, top: 16 }}
                series={sourceSeries}
                slotProps={{ tooltip: { trigger: "item" } }}
                xAxis={[
                  {
                    valueFormatter: (value: number) =>
                      displayMode === "numbers"
                        ? formatNumber(value)
                        : `${value.toFixed(0)}%`,
                  },
                ]}
                yAxis={[{ data: holderTypes, scaleType: "band", width: 100 }]}
              >
                <SourcePatternDefinitions prefix={patternPrefix} />
                <BarLabelAtBase
                  displayMode={displayMode}
                  holderTotals={visibleHolderTotals}
                  totalShares={totalShares}
                />
              </BarChart>
              <Box
                aria-label="Voting source legend"
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.5,
                  justifyContent: "center",
                }}
              >
                {voteSources.map((source) => (
                  <Box
                    aria-pressed={!hiddenSourceIds.has(source.id)}
                    component="button"
                    data-testid={`source-legend-${source.id}`}
                    key={source.id}
                    onClick={() => {
                      onSourceToggle(source.id);
                    }}
                    sx={{
                      alignItems: "center",
                      background: "none",
                      border: 0,
                      color: "text.primary",
                      cursor: "pointer",
                      display: "flex",
                      gap: 0.5,
                      opacity: hiddenSourceIds.has(source.id) ? 0.45 : 1,
                      p: 0,
                    }}
                    type="button"
                  >
                    <SourceLegendSwatch source={source} />
                    <Typography variant="caption">{source.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default VotingSourceChartCard;
