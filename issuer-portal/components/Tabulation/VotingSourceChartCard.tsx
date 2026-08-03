"use client";

import { Box, Card, CardContent, CardHeader, Skeleton } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import BarChartIcon from "@rolemodel/betanxt-design-system/components/icons/brand/BarChartIcon";
import { useId } from "react";

import type { VoteMatrixRow } from "@/hooks/useTabulationInsights";

import { useTabulationDisplay } from "../../contexts/TabulationDisplayContext";
import { formatNumber } from "../../utils/number-utilities";
import {
  tabulationCardContentStyles,
  tabulationCardHeaderStyles,
  tabulationCardStyles,
} from "../../utils/tabulation-card-layout";
import { formatTabulationMetric } from "../../utils/tabulation-display";
import { EmptyState } from "../EmptyState";
import { HolderTotalsBarLabels } from "./HolderTotalsBarLabels";
import { SourcePatternDefinitions } from "./SourcePatternDefinitions";
import {
  getSourcePatternId,
  type HolderType,
  holderTypes,
  sumRowOutcomes,
  type VoteSourceId,
  voteSources,
  votingSourceChartHeight,
} from "./vote-breakdown-chart-data";
import { VotingSourceLegend } from "./VotingSourceLegend";

export interface VotingSourceChartCardProps {
  readonly hiddenHolderTypes: ReadonlySet<HolderType>;
  readonly hiddenSourceIds: ReadonlySet<VoteSourceId>;
  readonly loading: boolean;
  readonly onHolderTypeToggle: (holderType: HolderType) => void;
  readonly onSourceToggle: (sourceId: VoteSourceId) => void;
  readonly rows: readonly VoteMatrixRow[];
  readonly totalShares: number;
}

const VotingSourceChartCard = ({
  hiddenHolderTypes,
  hiddenSourceIds,
  loading,
  onHolderTypeToggle,
  onSourceToggle,
  rows,
  totalShares,
}: VotingSourceChartCardProps) => {
  const { displayMode } = useTabulationDisplay();
  const patternPrefix = `vote-source-${useId().replaceAll(":", "")}`;

  // The y-axis bands and every series' `data` array are indexed the same way,
  // so hiding a holder type means dropping it from both.
  const visibleHolderTypes = holderTypes.filter(
    (holderType) => !hiddenHolderTypes.has(holderType)
  );

  // Hidden sources are skipped while the series are built rather than flagged:
  // `hidden` exists on MUI's internal DefaultizedBarSeriesType, not on the
  // BarSeriesType input, so setting it here would be silently ignored.
  const sourceSeries = voteSources.flatMap((source) => {
    if (hiddenSourceIds.has(source.id)) {
      return [];
    }

    const actualValues = visibleHolderTypes.map((holderType) =>
      rows
        .filter(
          (row) => row.holderType === holderType && row.source === source.label
        )
        .reduce((sum, row) => sum + sumRowOutcomes(row), 0)
    );

    return [
      {
        color: `url(#${getSourcePatternId(patternPrefix, source.id)})`,
        data: actualValues.map((value) =>
          displayMode === "numbers" ? value : (value / totalShares) * 100
        ),
        id: source.id,
        label: source.label,
        stack: "source",
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
      },
    ];
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
  const visibleHolderTotals = visibleHolderTypes.map((holderType) =>
    rows
      .filter(
        (row) =>
          row.holderType === holderType && visibleSourceLabels.has(row.source)
      )
      .reduce((sum, row) => sum + sumRowOutcomes(row), 0)
  );
  // The total label is anchored against the bar's right edge, so it sits over
  // the final visible source segment. Its paired foreground is legible over
  // that pattern without needing a high-contrast outline.
  const insideTotalLabelColors = visibleHolderTypes.map((holderType) => {
    const terminalSource = [...voteSources].reverse().find((source) => {
      if (hiddenSourceIds.has(source.id)) {
        return false;
      }

      return rows.some(
        (row) =>
          row.holderType === holderType &&
          row.source === source.label &&
          sumRowOutcomes(row) > 0
      );
    });

    return terminalSource?.contrastColor ?? "var(--mui-palette-text-primary)";
  });

  return (
    <Card sx={tabulationCardStyles}>
      <CardHeader
        subheader="Compare Registered vs. Beneficial by source"
        sx={tabulationCardHeaderStyles}
        title="Voting Activity"
      />
      <CardContent sx={tabulationCardContentStyles}>
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
          }}
        >
          {loading ? (
            <Skeleton height={300} variant="rectangular" width="100%" />
          ) : totalShares === 0 ? (
            <EmptyState
              description="Once shares are voted, they will appear here."
              icon={
                <BarChartIcon
                  accentColor="var(--mui-palette-primary-light)"
                  fontSize="large"
                />
              }
              minHeight="unset"
              title="No votes recorded yet"
            />
          ) : (
            <Box sx={{ width: "100%" }}>
              <BarChart
                grid={{ vertical: true }}
                height={votingSourceChartHeight}
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
                yAxis={[
                  { data: visibleHolderTypes, scaleType: "band", width: 100 },
                ]}
              >
                <SourcePatternDefinitions prefix={patternPrefix} />
                <HolderTotalsBarLabels
                  displayMode={displayMode}
                  holderTotals={visibleHolderTotals}
                  holderTypes={visibleHolderTypes}
                  insideTextColors={insideTotalLabelColors}
                  totalShares={totalShares}
                />
              </BarChart>
              <VotingSourceLegend
                hiddenHolderTypes={hiddenHolderTypes}
                hiddenSourceIds={hiddenSourceIds}
                onHolderTypeToggle={onHolderTypeToggle}
                onSourceToggle={onSourceToggle}
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default VotingSourceChartCard;
