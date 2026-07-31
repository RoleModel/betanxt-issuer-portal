"use client";

import type { SelectChangeEvent } from "@mui/material/Select";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  MenuItem,
  Select,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { useDrawingArea, useXScale } from "@mui/x-charts/hooks";
import { LineChart } from "@mui/x-charts/LineChart";
import React from "react";

import type {
  QuorumMilestoneKind,
  QuorumTimelineMilestone,
  QuorumTimelinePoint,
} from "./useQuorumTimeline";

export interface QuorumTimelineEvent {
  id: string;
  label: string;
}

interface QuorumTimelineChartProps {
  /** Cumulative voting progress points, ordered by date (from {@link useQuorumTimeline}). */
  readonly points: QuorumTimelinePoint[];
  /** Mailing/follow-up/deadline events rendered as dashed vertical reference lines. */
  readonly milestones: QuorumTimelineMilestone[];
  /** Percentage threshold for the horizontal reference line. Falls back to 50% when unset. */
  readonly quorumRequirementPercent?: number | string | null;
  /** Forces the skeleton state from the parent while page-level data resolves. */
  readonly loading?: boolean;
  /** Events available in the MUI selector. */
  readonly events?: QuorumTimelineEvent[];
  /** ID of the event currently represented by the chart data. */
  readonly selectedEventId?: string;
  /** Called when the user switches the selected event. */
  readonly onEventChange?: (eventId: string) => void;
  /** Card subheader; defaults to the chart description when unset. */
  readonly subheader?: string;
}

const formatAxisDate = (date: Date): string =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const labelFontSize = 11;
const labelHeight = 20;
const labelPaddingX = 8;
const labelRowGap = 4;
const emptyEvents: QuorumTimelineEvent[] = [];

const formatNumber = (value: number | null | undefined): string =>
  (value ?? 0).toLocaleString();

const formatQuorumRequirementPercentLabel = (
  value: number | string | null | undefined
): string => {
  const numericValue = Number(value);
  return `${Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 50}%`;
};

const ChartSkeleton = (): React.ReactNode => (
  <Card>
    <CardHeader title={<Skeleton variant="text" width="60%" height={32} />} />
    <CardContent>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={360}
        sx={{ borderRadius: 1 }}
      />
    </CardContent>
  </Card>
);

interface MilestoneLabelsProps {
  readonly milestones: QuorumTimelineMilestone[];
  /** Pill background per milestone kind (matches the reference line stroke). */
  readonly fillColors: Record<QuorumMilestoneKind, string>;
  /** Pill text color per milestone kind (the palette contrast token). */
  readonly textColors: Record<QuorumMilestoneKind, string>;
}

/**
 * Pill-style milestone labels rendered as an SVG overlay inside the chart.
 *
 * `ChartsReferenceLine` only supports plain text labels, so the markers are
 * drawn manually: each label is positioned on its milestone date via the x
 * scale, clamped to the drawing area, and pushed down a row when it would
 * overlap an already-placed label (frequent with close follow-up mailings).
 */
const MilestoneLabels = ({
  milestones,
  fillColors,
  textColors,
}: MilestoneLabelsProps) => {
  const xScale = useXScale<"time">();
  const drawingArea = useDrawingArea();

  const placedLabels: { left: number; right: number; row: number }[] = [];

  return (
    <g>
      {milestones.map((milestone) => {
        const lineX = xScale(milestone.date);
        if (Number.isNaN(lineX)) return null;

        // Approximate text width; SVG text can't be measured before render.
        const width = Math.ceil(
          milestone.label.length * labelFontSize * 0.62 + labelPaddingX * 2
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
        const left = Math.min(
          Math.max(preferredLeft, minLeft),
          Math.max(maxLeft, minLeft)
        );
        const right = left + width;

        let row = 0;
        while (
          placedLabels.some(
            (placed) =>
              placed.row === row &&
              left < placed.right + 12 &&
              right > placed.left - 2
          )
        ) {
          row += 1;
        }
        placedLabels.push({ left, right, row });

        const top = drawingArea.top + row * (labelHeight + labelRowGap);

        return (
          <g
            key={`${milestone.kind}-${milestone.label}-${milestone.date.getTime()}`}
            transform={`translate(${left}, ${top})`}
          >
            <rect
              width={width}
              height={labelHeight}
              rx={labelHeight / 2}
              fill={fillColors[milestone.kind]}
            />
            <text
              x={width / 2}
              y={labelHeight / 2}
              fill={textColors[milestone.kind]}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={labelFontSize}
            >
              {milestone.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

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
export const QuorumTimelineChart = ({
  points,
  milestones,
  quorumRequirementPercent,
  loading = false,
  events = emptyEvents,
  selectedEventId = "",
  onEventChange,
  subheader = "Cumulative shares voted from mail date through the vote deadline",
}: QuorumTimelineChartProps) => {
  const theme = useTheme();

  if (loading) {
    return <ChartSkeleton />;
  }

  const handleEventChange = (event: SelectChangeEvent): void => {
    onEventChange?.(event.target.value);
  };

  const hasVotes = points.some((point) => point.cumulativeSharesVoted > 0);
  const quorumPercent = Number(quorumRequirementPercent) || 50;
  const quorumLabel = `Quorum (${formatQuorumRequirementPercentLabel(quorumRequirementPercent)})`;

  const milestoneColors: Record<QuorumMilestoneKind, string> = {
    mail: theme.vars.palette.info.dark,
    followUp: theme.vars.palette.secondary.main,
    deadline: theme.vars.palette.error.main,
  };
  const milestoneTextColors: Record<QuorumMilestoneKind, string> = {
    mail: theme.vars.palette.info.contrastText,
    followUp: theme.vars.palette.secondary.contrastText,
    deadline: theme.vars.palette.error.contrastText,
  };

  const dates = points.map((point) => point.date);
  const percents = points.map((point) => point.percentOfOutstanding);
  const maxPercent = percents.length > 0 ? Math.max(...percents) : 0;
  const yMax = Math.min(
    100,
    Math.ceil(Math.max(maxPercent, quorumPercent) * 1.15)
  );
  const eventSelect =
    events.length > 0 ? (
      <Select
        aria-label="Event"
        displayEmpty
        size="small"
        value={selectedEventId}
        onChange={handleEventChange}
        sx={{ minWidth: 260 }}
      >
        {events.map((event) => (
          <MenuItem key={event.id} value={event.id}>
            {event.label}
          </MenuItem>
        ))}
      </Select>
    ) : null;

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title="Quorum Timeline"
        subheader={subheader}
        action={eventSelect}
      />
      <CardContent>
        {!hasVotes ? (
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: 300,
              textAlign: "center",
            }}
          >
            <Typography variant="body1">
              No voted positions for this event
            </Typography>
            <Typography color="text.secondary" variant="body2">
              The quorum timeline will populate as votes are recorded.
            </Typography>
          </Box>
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
                  const shares = formatNumber(point.cumulativeSharesVoted);
                  return `${value ?? 0}% of outstanding (${shares} shares)`;
                },
              },
            ]}
            height={340}
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
};
