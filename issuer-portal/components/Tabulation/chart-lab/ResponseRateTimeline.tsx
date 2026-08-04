"use client";

import { Alert, Box } from "@mui/material";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { LineChart } from "@mui/x-charts/LineChart";

interface ResponseRateTimelineProps {
  readonly height?: number;
}

/** Submission channels, matching the inner ring of the consolidated pie. */
const SOURCES = [
  { color: "#1b3a54", key: "solicitor", label: "Solicitor", ceiling: 91 },
  { color: "#3f9d5a", key: "web", label: "Web", ceiling: 50 },
  { color: "#6d9aa8", key: "email", label: "Email", ceiling: 70 },
  { color: "#9b6ede", key: "paper", label: "Paper", ceiling: 64 },
  { color: "#2f9fd0", key: "mail", label: "Mail", ceiling: 66 },
  { color: "#e4692a", key: "ivr", label: "IVR", ceiling: 81 },
] as const;

const DAY_COUNT = 16;

/**
 * Deterministic stand-in curve. Rates climb toward each channel's ceiling with
 * a dip mid-window, which is the shape solicitation response actually takes —
 * enough to judge the layout without pretending to be real data.
 */
const buildSeries = (ceiling: number, offset: number): number[] =>
  Array.from({ length: DAY_COUNT }, (_, day) => {
    const progress = day / (DAY_COUNT - 1);
    const ramp = ceiling * (1 - Math.exp(-3.2 * progress));
    const wobble = Math.sin(progress * Math.PI * 2 + offset) * ceiling * 0.12;
    return Math.max(0, Math.round((ramp + wobble) * 10) / 10);
  });

const DAY_LABELS = Array.from({ length: DAY_COUNT }, (_, day) => {
  const start = new Date(Date.UTC(2025, 8, 30));
  start.setUTCDate(start.getUTCDate() + day);
  return `${start.getUTCMonth() + 1}/${start.getUTCDate()}`;
});

/**
 * Response rate by submission channel over the solicitation window, with the
 * milestones that explain the inflections.
 *
 * The series are synthetic: every seeded `position_vote` currently carries the
 * same `createdAt`, so there is no date spread to chart. Seeding vote
 * timestamps across the solicitation window would make this real with no change
 * to the component beyond its data source.
 */
export const ResponseRateTimeline = ({
  height = 380,
}: ResponseRateTimelineProps) => (
  <Box>
    <Alert severity="warning" sx={{ mb: 2 }}>
      Illustrative curve — seeded votes all share one timestamp, so there is no
      real per-day series yet.
    </Alert>
    <LineChart
      grid={{ horizontal: true }}
      height={height}
      margin={{ bottom: 8, left: 8, right: 16, top: 8 }}
      series={SOURCES.map((source, index) => ({
        color: source.color,
        curve: "monotoneX",
        data: buildSeries(source.ceiling, index * 0.7),
        label: source.label,
        showMark: false,
        valueFormatter: (value: number | null) =>
          value === null ? "" : `${value.toFixed(0)}%`,
      }))}
      xAxis={[{ data: DAY_LABELS, scaleType: "point" }]}
      yAxis={[
        {
          label: "Response Rate %",
          max: 100,
          min: 0,
          valueFormatter: (value: number) => `${value}%`,
        },
      ]}
    >
      <ChartsReferenceLine
        label="Solicitation Calling Begins"
        labelAlign="start"
        lineStyle={{ stroke: "#3f9d5a", strokeWidth: 2 }}
        x={DAY_LABELS[4]}
      />
      <ChartsReferenceLine
        label="Quorum Achieved"
        labelAlign="end"
        lineStyle={{ stroke: "#2f9fd0", strokeWidth: 2 }}
        x={DAY_LABELS[13]}
      />
    </LineChart>
  </Box>
);
