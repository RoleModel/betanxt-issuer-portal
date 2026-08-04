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
import { deselectedChartColor } from "../../utils/vote-chart-colors";
import { EmptyState } from "../EmptyState";
import { HolderTotalsBarLabels } from "./HolderTotalsBarLabels";
import { SourcePatternDefinitions } from "./SourcePatternDefinitions";
import {
  emptySourceBarShare,
  getSourcePatternId,
  sumRowOutcomes,
  type VoteSourceId,
  voteSources,
  votingSourceChartHeight,
} from "./vote-breakdown-chart-data";
import { VotingSourceLegend } from "./VotingSourceLegend";

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

  // Registered Holder voting only (see the card subheader below). The axis
  // bands are the sources themselves, so - unlike the holder/source matrix
  // this card used to render - there is no second grouping dimension left to
  // stack: each band holds exactly one source's total.
  const visibleSources = voteSources.filter(
    (source) => !hiddenSourceIds.has(source.id)
  );
  const sourceTotals = new Map(
    visibleSources.map((source) => [
      source.id,
      rows
        .filter(
          (row) =>
            row.holderType === "Registered" && row.source === source.label
        )
        .reduce((sum, row) => sum + sumRowOutcomes(row), 0),
    ])
  );

  // Hidden sources are skipped while the series are built rather than flagged:
  // `hidden` exists on MUI's internal DefaultizedBarSeriesType, not on the
  // BarSeriesType input, so setting it here would be silently ignored.
  //
  // Each source is its own series holding a value at only its own band index
  // (and `null` everywhere else) so the bars can carry distinct pattern
  // fills; `stack` keeps them from being laid out as separate axis groups.
  const maxDisplayedValue = displayMode === "numbers" ? totalShares : 100;

  const sourceSeries = visibleSources.map((source, sourceIndex) => {
    const actualValue = sourceTotals.get(source.id) ?? 0;
    const isEmpty = actualValue === 0;
    const displayedValue = isEmpty
      ? maxDisplayedValue * emptySourceBarShare
      : displayMode === "numbers"
        ? actualValue
        : (actualValue / totalShares) * 100;

    return {
      color: isEmpty
        ? deselectedChartColor
        : `url(#${getSourcePatternId(patternPrefix, source.id)})`,
      data: visibleSources.map((_, bandIndex) =>
        bandIndex === sourceIndex ? displayedValue : null
      ),
      id: source.id,
      label: source.label,
      stack: "source",
      valueFormatter: (displayedBandValue: number | null) => {
        if (displayedBandValue === null) {
          return null;
        }
        const metric = formatTabulationMetric(
          actualValue,
          totalShares,
          displayMode
        );
        return `${source.label}: ${metric.display} (${metric.alternate})`;
      },
    };
  });

  const bands = visibleSources.map((source) => source.label);
  const bandTotals = visibleSources.map(
    (source) => sourceTotals.get(source.id) ?? 0
  );
  const insideTotalLabelColors = new Map(
    visibleSources.map((source) => [source.label, source.contrastColor])
  );

  return (
    <Card sx={tabulationCardStyles}>
      <CardHeader
        subheader="Reflects Registered Holder voting only"
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
                yAxis={[{ data: bands, scaleType: "band", width: 100 }]}
              >
                <SourcePatternDefinitions prefix={patternPrefix} />
                <HolderTotalsBarLabels
                  bandTotals={bandTotals}
                  bands={bands}
                  displayMode={displayMode}
                  insideTextColors={insideTotalLabelColors}
                  totalShares={totalShares}
                />
              </BarChart>
              <VotingSourceLegend
                hiddenSourceIds={hiddenSourceIds}
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
