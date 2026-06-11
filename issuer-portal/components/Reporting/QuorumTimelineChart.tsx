"use client";

import { Card, CardContent, CardHeader, useTheme } from "@mui/material";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
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
}

const formatAxisDate = (date: Date): string =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
}: QuorumTimelineChartProps) {
  const theme = useTheme();

  if (loading) {
    return <SkeletonChart title="Quorum Timeline" height={360} showLegend />;
  }

  const hasVotes = points.some((point) => point.cumulativeSharesVoted > 0);
  const quorumPercent = Number(quorumRequirementPercent) || 50;
  const quorumLabel = `Quorum (${formatQuorumRequirementPercentLabel(quorumRequirementPercent)})`;

  const milestoneColors: Record<QuorumMilestoneKind, string> = {
    mail: theme.palette.info.main,
    followUp: theme.palette.warning.main,
    deadline: theme.palette.error.main,
  };

  const dates = points.map((point) => point.date);
  const percents = points.map((point) => point.percentOfOutstanding);
  const maxPercent = percents.length > 0 ? Math.max(...percents) : 0;
  const yMax = Math.min(100, Math.ceil(Math.max(maxPercent, quorumPercent) * 1.15));

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title="Quorum Timeline"
        subheader="Cumulative shares voted from mail date through the vote deadline"
        action={action}
      />
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
            height={420}
            margin={{ left: 10, right: 30, top: 40, bottom: 10 }}
            grid={{ horizontal: true }}
            slotProps={{
              legend: {
                direction: "horizontal",
                position: { vertical: "bottom", horizontal: "center" },
              },
            }}
            sx={{
              "& .MuiAreaElement-root": { opacity: 0.15 },
            }}
          >
            {milestones.map((milestone) => (
              <ChartsReferenceLine
                key={`${milestone.kind}-${milestone.label}-${milestone.date.getTime()}`}
                x={milestone.date}
                label={milestone.label}
                labelAlign="start"
                lineStyle={{
                  stroke: milestoneColors[milestone.kind],
                  strokeDasharray: "6 4",
                }}
                labelStyle={{
                  fill: milestoneColors[milestone.kind],
                  fontSize: 11,
                }}
              />
            ))}
            <ChartsReferenceLine
              y={quorumPercent}
              label={quorumLabel}
              labelAlign="end"
              lineStyle={{
                stroke: theme.palette.text.secondary,
                strokeDasharray: "2 4",
              }}
              labelStyle={{
                fill: theme.palette.text.secondary,
                fontSize: 11,
              }}
            />
          </LineChart>
        )}
      </CardContent>
    </Card>
  );
}
