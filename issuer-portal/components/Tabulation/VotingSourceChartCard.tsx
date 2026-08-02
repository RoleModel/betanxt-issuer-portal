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
import BarChartIcon from "@rolemodel/betanxt-design-system/components/icons/brand/BarChartIcon";
import {
  PatternCircles,
  PatternLines,
  PatternOrientation,
} from "@visx/pattern";
import { useId, useLayoutEffect, useRef, useState } from "react";

import type { VoteMatrixRow } from "@/hooks/useTabulationInsights";

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
import { EmptyState } from "../EmptyState";
import {
  holderStyles,
  type HolderType,
  holderTypes,
  sumRowOutcomes,
  type VoteSource,
  type VoteSourceId,
  voteSources,
} from "./vote-breakdown-chart-data";

const getSourcePatternId = (prefix: string, source: VoteSourceId): string =>
  `${prefix}-${source}`;

/**
 * How much of the contrast colour survives in the hatch marks. At 100% the
 * pattern is pure white or pure black against the bar, which reads as harsh;
 * mixing the bar colour back in keeps the texture legible without the hard
 * edge. Raise for more definition, lower for a subtler weave.
 */
const patternContrastMix = 45;

/** Hatch colour for a pattern drawn on top of `source.color`. */
const getPatternForeground = (source: VoteSource): string =>
  `color-mix(in srgb, ${source.contrastColor} ${patternContrastMix}%, ${source.color})`;

const SourcePatternDefinitions = ({ prefix }: { readonly prefix: string }) => {
  return (
    <defs>
      {voteSources.map((source) => {
        const id = getSourcePatternId(prefix, source.id);
        const patternForeground = getPatternForeground(source);

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
            background={patternForeground}
            fill={source.color}
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
  /** Parallel to `holderTypes` - both must describe the same visible bands. */
  readonly holderTotals: readonly number[];
  readonly holderTypes: readonly HolderType[];
  readonly totalShares: number;
}

/** Gap between the label and the bar end, inside or outside. */
const labelInset = 8;

const BarLabelAtBase = ({
  displayMode,
  holderTotals,
  holderTypes: visibleHolderTypes,
  totalShares,
}: BarLabelAtBaseProps) => {
  const xScale = useXScale<"linear">();
  const yScale = useYScale<"band">();
  const labelNodes = useRef(new Map<string, SVGTextElement | null>());
  const [labelWidths, setLabelWidths] = useState<ReadonlyMap<string, number>>(
    () => new Map()
  );

  const labels = visibleHolderTypes.flatMap((holderType, index) => {
    const total = holderTotals[index] ?? 0;
    const y = yScale(holderType);

    if (total === 0 || y === undefined) {
      return [];
    }

    return [
      {
        displayedTotal:
          displayMode === "numbers" ? total : (total / totalShares) * 100,
        holderType,
        text: formatTabulationMetric(total, totalShares, displayMode).display,
        y,
      },
    ];
  });

  // Re-measure only when the rendered strings change. Glyph width depends on
  // the text and the (fixed) font, not on the scales, so resizing does not need
  // a fresh measurement - the fit calculation below reads the scales directly.
  const labelSignature = labels
    .map((label) => `${label.holderType}:${label.text}`)
    .join("|");

  // Measured rather than estimated from character count: an estimate misjudges
  // exactly the boundary cases this exists to catch. A layout effect runs
  // before paint, so the flip is never visible. The equality bail is a second
  // guard - without it a re-render would re-measure and loop.
  // Measuring before paint is the one case React prescribes a layout effect
  // plus state for, so the set-state-in-effect rule is suppressed deliberately
  // rather than worked around. The equality bail below is what keeps it from
  // becoming the update chain that rule is guarding against.
  useLayoutEffect(() => {
    const measured = new Map<string, number>();
    for (const [key, node] of labelNodes.current) {
      if (node) {
        measured.set(key, node.getComputedTextLength());
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabelWidths((previous) => {
      const unchanged =
        previous.size === measured.size &&
        [...measured].every(([key, width]) => previous.get(key) === width);
      return unchanged ? previous : measured;
    });
  }, [labelSignature]);

  return (
    <g aria-label="Holder type totals">
      {labels.map(({ displayedTotal, holderType, text, y }) => {
        const barStart = xScale(0);
        const barEnd = xScale(displayedTotal);
        const measuredWidth = labelWidths.get(holderType);
        // Before the first measurement, assume it fits: that keeps the label in
        // its usual place for one frame instead of flicking it outside.
        const fitsInsideBar =
          measuredWidth === undefined ||
          measuredWidth + labelInset * 2 <= barEnd - barStart;

        return (
          <text
            data-testid={`vote-matrix-total-${holderType.toLowerCase()}`}
            fill="var(--mui-palette-text-primary)"
            fontSize="24"
            fontWeight="bold"
            key={holderType}
            paintOrder="stroke"
            ref={(node) => {
              labelNodes.current.set(holderType, node);
            }}
            stroke="var(--mui-palette-background-paper)"
            strokeWidth="2"
            textAnchor={fitsInsideBar ? "end" : "start"}
            x={fitsInsideBar ? barEnd - labelInset : barEnd + labelInset}
            y={y + yScale.bandwidth() - 8}
          >
            {text}
          </text>
        );
      })}
    </g>
  );
};

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
  // Filtered, not flagged: `hidden` exists on MUI's internal
  // DefaultizedBarSeriesType, not on the BarSeriesType input, so passing it
  // here was silently ignored and the bars stayed on screen. MUI only sets it
  // itself from its built-in legend, which this card replaces.
  // The y-axis bands and every series' `data` array are indexed the same way,
  // so hiding a holder type means dropping it from both.
  const visibleHolderTypes = holderTypes.filter(
    (holderType) => !hiddenHolderTypes.has(holderType)
  );
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

  return (
    <Card sx={tabulationCardStyles}>
      <CardHeader
        title="Voting Activity"
        subheader="Compare Registered vs. Beneficial by source"
        sx={tabulationCardHeaderStyles}
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
                yAxis={[
                  { data: visibleHolderTypes, scaleType: "band", width: 100 },
                ]}
              >
                <SourcePatternDefinitions prefix={patternPrefix} />
                <BarLabelAtBase
                  displayMode={displayMode}
                  holderTotals={visibleHolderTotals}
                  holderTypes={visibleHolderTypes}
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
                {holderTypes.map((holderType) => (
                  <Box
                    aria-pressed={!hiddenHolderTypes.has(holderType)}
                    component="button"
                    data-testid={`holder-legend-${holderType.toLowerCase()}`}
                    key={holderType}
                    onClick={() => {
                      onHolderTypeToggle(holderType);
                    }}
                    sx={{
                      alignItems: "center",
                      background: "none",
                      border: 0,
                      color: "text.primary",
                      cursor: "pointer",
                      display: "flex",
                      gap: 0.5,
                      opacity: hiddenHolderTypes.has(holderType) ? 0.45 : 1,
                      p: 0,
                    }}
                    type="button"
                  >
                    <Box
                      aria-hidden="true"
                      sx={{
                        backgroundColor: holderStyles[holderType].color,
                        borderRadius: "2px",
                        height: 20,
                        width: 20,
                      }}
                    />
                    <Typography variant="caption">{holderType}</Typography>
                  </Box>
                ))}
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
