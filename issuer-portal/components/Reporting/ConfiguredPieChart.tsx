"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import type { PieChartProps, PieSeries } from "@mui/x-charts/PieChart";

import { PieChart as MuiPieChart, pieClasses } from "@mui/x-charts/PieChart";
import { useMemo } from "react";

import { createContrastPieArcLabel } from "@/components/ui/ContrastPieArcLabel";

import PieCenterLabel, { type PieChartData } from "./PieChartCenterLabel";

/** Configuration for a reusable concentric-ring pie chart. */
export interface ConfiguredPieChartProps {
  /** Paired foreground colors for labels rendered inside color-filled arcs. */
  readonly arcLabelContrastByColor?: ReadonlyMap<string, string>;
  /** Overrides the standard contrast-aware label renderer when geometry differs. */
  readonly arcLabelSlot?: NonNullable<PieChartProps["slots"]>["pieArcLabel"];
  /** Optional metric and supporting text drawn in the donut centre. */
  readonly centerLabel?: PieChartData;
  /** SVG chart height in pixels. */
  readonly height: number;
  /** Hides MUI's built-in legend when a card supplies its own controls. */
  readonly hideLegend?: boolean;
  /** MUI chart margins, including room for external arc labels. */
  readonly margin?: PieChartProps["margin"];
  /** One configuration object per concentric pie ring. */
  readonly rings: readonly PieSeries[];
  /** MUI slot props, for example legend positioning. */
  readonly slotProps?: PieChartProps["slotProps"];
  /** Shared styling for the chart SVG and arc labels. */
  readonly sx?: SxProps<Theme>;
}

/**
 * Renders one or more pie rings from declarative series configuration.
 *
 * @remarks
 * Cards own their title, loading state, empty state, legends, and data
 * derivation. This component owns the repeated MUI wiring: concentric series,
 * contrast-aware labels, consistent label typography, and the optional centre
 * metric. Keeping those concerns here prevents chart-specific copies from
 * drifting as client palettes evolve.
 */
const ConfiguredPieChart = ({
  arcLabelContrastByColor,
  arcLabelSlot,
  centerLabel,
  height,
  hideLegend = true,
  margin,
  rings,
  slotProps,
  sx,
}: ConfiguredPieChartProps) => {
  const ContrastPieArcLabel = useMemo(
    () =>
      arcLabelContrastByColor === undefined
        ? undefined
        : createContrastPieArcLabel(arcLabelContrastByColor),
    [arcLabelContrastByColor]
  );
  const pieArcLabel = arcLabelSlot ?? ContrastPieArcLabel;

  return (
    <MuiPieChart
      height={height}
      hideLegend={hideLegend}
      margin={margin}
      series={rings}
      slotProps={slotProps}
      slots={pieArcLabel === undefined ? undefined : { pieArcLabel }}
      sx={{
        [`& .${pieClasses.arcLabel}`]: {
          fontSize: 12,
          fontWeight: 700,
        },
        ...sx,
      }}
    >
      {centerLabel === undefined ? null : <PieCenterLabel data={centerLabel} />}
    </MuiPieChart>
  );
};

export default ConfiguredPieChart;
