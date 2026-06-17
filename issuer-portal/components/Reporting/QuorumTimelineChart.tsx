"use client";

import { Card, CardContent, CardHeader, useTheme } from "@mui/material";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { useDrawingArea, useXScale } from "@mui/x-charts/hooks";
import { LineChart } from "@mui/x-charts/LineChart";
import React from "react";

import type {
  QuorumMilestoneKind,
  QuorumTimelineMilestone,
  QuorumTimelinePoint,
} from "@/hooks/useQuorumTimeline";

import { EmptyState } from "@/components/EmptyState";
import SkeletonChart from "@/components/ui/SkeletonChart";
import { formatNumber } from "@/utils/numberUtils";
import { formatQuorumRequirementPercentLabel } from "@/utils/quorum";

interface QuorumTimelineChartProps {
  /** Cumulative voting progress points, ordered by date (from {@link useQuorumTimeline}). */
  points: QuorumTimelinePoint[];
  /** Mailing/follow-up/deadline events rendered as dashed vertical reference lines. */
  milestones: QuorumTimelineMilestone[];
  /** Meeting quorum requirement; drives the horizontal threshold line. Falls back to 50% when unset. */
  quorumRequirementPercent?: number | string | null;
  /** Forces the skeleton state from the parent while page-level data resolves. */
  loading?: boolean;
  /** Optional header action node (e.g. an event selector). */
  action?: React.ReactNode;
  /** Card subheader; defaults to the chart description when unset. */
  subheader?: string;
}

const formatAxisDate = (date: Date): string =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const LABEL_FONT_SIZE = 11;
const LABEL_HEIGHT = 20;
const LABEL_PADDING_X = 8;
const LABEL_ROW_GAP = 4;

interface MilestoneLabelsProps {
  milestones: QuorumTimelineMilestone[];
  /** Pill background per milestone kind (matches the reference line stroke). */
  fillColors: Record<QuorumMilestoneKind, string>;
  /** Pill text color per milestone kind (the palette contrast token). */
  textColors: Record<QuorumMilestoneKind, string>;
}

/**
 * Pill-style milestone labels rendered as an SVG overlay inside the chart.
 *
 * `ChartsReferenceLine` only supports plain text labels, so the markers are
 * drawn manually: each label is positioned on its milestone date via the x
 * scale, clamped to the drawing area, and pushed down a row when it would
 * overlap an already-placed label (frequent with close follow-up mailings).
 */
function MilestoneLabels({ milestones, fillColors, textColors }: MilestoneLabelsProps) {
  const xScale = useXScale<"time">();
  const drawingArea = useDrawingArea();

  const placedLabels: { left: number; right: number; row: number }[] = [];

  return (
    <g>
      {milestones.map((milestone) => {
        const lineX = xScale(milestone.date);
        if (lineX === undefined || Number.isNaN(lineX)) return null;

        // Approximate text width; SVG text can't be measured before render.
        const width = Math.ceil(
          milestone.label.length * LABEL_FONT_SIZE * 0.62 + LABEL_PADDING_X * 2,
        );
        // Mail sits 4px right of its line, deadline 4px left, follow-ups centered.
        const preferredLeft =
          milestone.kind === "mail"
            ? lineX + 4
            : milestone.kind === "deadline"
              ? lineX - width - 4
              : lineX - width / 2;
        const minLeft = drawingArea.left + 2;
        const maxLeft = drawingArea.left + drawingArea.width - width - 2;
        const left = Math.min(Math.max(preferredLeft, minLeft), Math.max(maxLeft, minLeft));
        const right = left + width;

        let row = 0;
        while (
          placedLabels.some(
            (placed) => placed.row === row && left < placed.right + 12 && right > placed.left - 2,
          )
        ) {
          row += 1;
        }
        placedLabels.push({ left, right, row });

        const top = drawingArea.top + 0 + row * (LABEL_HEIGHT + LABEL_ROW_GAP);

        return (
          <g
            key={`${milestone.kind}-${milestone.label}-${milestone.date.getTime()}`}
            transform={`translate(${left}, ${top})`}
          >
            <rect
              width={width}
              height={LABEL_HEIGHT}
              rx={LABEL_HEIGHT / 2}
              fill={fillColors[milestone.kind]}
            />
            <text
              x={width / 2}
              y={LABEL_HEIGHT / 2}
              fill={textColors[milestone.kind]}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={LABEL_FONT_SIZE}
            >
              {milestone.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * Step line chart of cumulative shares voted (as % of outstanding shares)
 * from the mail date through the vote deadline.
 *
 * Milestones are drawn as color-coded vertical reference lines (mail = info,
 * follow-up = warning, deadline = error) and the quorum requirement as a
 * horizontal dashed line. The y-axis is scaled to 115% of the larger of the
 * peak vote percentage and the quorum threshold, capped at 100%.
 *
 * Shows a skeleton while `loading` and an empty state when no points carry
 * any voted shares.
 */
export function QuorumTimelineChart({
  points,
  milestones,
  quorumRequirementPercent,
  loading = false,
  action,
  subheader = "Cumulative shares voted from mail date through the vote deadline",
}: QuorumTimelineChartProps) {
  const theme = useTheme();

  if (loading) {
    return <SkeletonChart title="Quorum Timeline" height={360} showLegend />;
  }

  const hasVotes = points.some((point) => point.cumulativeSharesVoted > 0);
  const quorumPercent = Number(quorumRequirementPercent) || 50;
  const quorumLabel = `Quorum (${formatQuorumRequirementPercentLabel(quorumRequirementPercent)})`;

  const milestoneColors: Record<QuorumMilestoneKind, string> = {
    mail: theme.vars.palette.info.dark,
    followUp: theme.vars.palette.warning.main,
    deadline: theme.vars.palette.error.main,
  };
  const milestoneTextColors: Record<QuorumMilestoneKind, string> = {
    mail: theme.vars.palette.info.contrastText,
    followUp: theme.vars.palette.warning.contrastText,
    deadline: theme.vars.palette.error.contrastText,
  };

  const dates = points.map((point) => point.date);
  const percents = points.map((point) => point.percentOfOutstanding);
  const maxPercent = percents.length > 0 ? Math.max(...percents) : 0;
  const yMax = Math.min(100, Math.ceil(Math.max(maxPercent, quorumPercent) * 1.15));

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Quorum Timeline" subheader={subheader} action={action} />
      <CardContent>
        {!hasVotes ? (
          <EmptyState
            title="No voted positions for this event"
            description="The quorum timeline will populate as votes are recorded."
            minHeight={300}
          />
        ) : (
          <LineChart
            xAxis={[
              {
                scaleType: "time",
                data: dates,
                valueFormatter: (value: Date) => formatAxisDate(value),
              },
            ]}
            yAxis={[
              {
                min: 0,
                max: yMax,
                label: "% of Outstanding Shares",
                valueFormatter: (value: number | null) => `${value ?? 0}%`,
                width: 60,
              },
            ]}
            series={[
              {
                data: percents,
                label: "Cumulative Shares Voted",
                area: true,

                showMark: false,
                curve: "stepAfter",
                color: "var(--mui-palette-chartSeries-1-main)",
                valueFormatter: (value, { dataIndex }) => {
                  const point = points[dataIndex];
                  const shares = point ? formatNumber(point.cumulativeSharesVoted) : "0";
                  return `${value ?? 0}% of outstanding (${shares} shares)`;
                },
              },
            ]}
            height={480}
            margin={{ left: 10, right: 40, top: 40, bottom: 10 }}
            grid={{ horizontal: true }}
            slotProps={{
              legend: {
                direction: "horizontal",
                position: { vertical: "bottom", horizontal: "center" },
              },
            }}
            sx={{
              "& .MuiAreaElement-root": { opacity: 0.1 },
            }}
          >
            {milestones.map((milestone) => (
              <ChartsReferenceLine
                key={`${milestone.kind}-${milestone.label}-${milestone.date.getTime()}`}
                x={milestone.date}
                lineStyle={{
                  stroke: milestoneColors[milestone.kind],
                  strokeDasharray: "6 4",
                  strokeWidth: 2,
                }}
              />
            ))}
            <MilestoneLabels
              milestones={milestones}
              fillColors={milestoneColors}
              textColors={milestoneTextColors}
            />
            <ChartsReferenceLine
              y={quorumPercent}
              label={quorumLabel}
              labelAlign="end"
              lineStyle={{
                stroke: theme.vars.palette.text.primary,
                strokeDasharray: "6 4",
                strokeWidth: 1,
              }}
              labelStyle={{
                fill: theme.vars.palette.text.secondary,
                fontSize: 11,
              }}
            />
          </LineChart>
        )}
      </CardContent>
    </Card>
  );
}
