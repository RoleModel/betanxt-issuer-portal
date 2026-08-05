"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { PieChartProps, PieSeries } from "@mui/x-charts/PieChart";

import { PieChart as MuiPieChart } from "@mui/x-charts/PieChart";

import PieCenterLabel, {
  type PieChartData,
} from "@/components/Charts/config/PieChartCenterLabel";

/** Configuration for a reusable concentric-ring pie chart. */
export interface ConfiguredPieChartProps {
  /** Optional metric and supporting text drawn in the donut centre. */
  readonly centerLabel?: PieChartData;
  /** SVG chart height in pixels. */
  readonly height: number;
  /** Hides MUI's built-in legend when a card supplies its own controls. */
  readonly hideLegend?: boolean;
  /** MUI chart margins. */
  readonly margin?: PieChartProps["margin"];
  /** One configuration object per concentric pie ring. */
  readonly rings: readonly PieSeries[];
  /** MUI slot props, for example legend positioning. */
  readonly slotProps?: PieChartProps["slotProps"];
  /** Shared styling for the chart SVG. */
  readonly sx?: SxProps<Theme>;
}

/**
 * Renders one or more pie rings from declarative series configuration.
 *
 * @remarks
 * Cards own their title, loading state, empty state, legends, and data
 * derivation. This component owns the repeated MUI wiring: concentric series
 * and the optional centre metric. Keeping those concerns here prevents
 * chart-specific copies from drifting as client palettes evolve.
 */
const ConfiguredPieChart = ({
  centerLabel,
  height,
  hideLegend = true,
  margin,
  rings,
  slotProps,
  sx,
}: ConfiguredPieChartProps) => {
  return (
    <MuiPieChart
      height={height}
      hideLegend={hideLegend}
      margin={margin}
      series={rings}
      slotProps={slotProps}
      sx={sx}
    >
      {centerLabel === undefined ? null : <PieCenterLabel data={centerLabel} />}
    </MuiPieChart>
  );
};

export default ConfiguredPieChart;
