"use client";

import { useGaugeState } from "@mui/x-charts/Gauge";

import type { PieChartData } from "./PieChartCenterLabel";

import { CenterLabelContent } from "./PieChartCenterLabel";

/**
 * The donuts' centre label, positioned for a gauge.
 *
 * @remarks
 * Rendered as a child of `Gauge` in place of its built-in `text` prop, which
 * offers one line of text and takes its type from `MuiGauge-valueText` — a
 * separate treatment that had to be restyled by hand to approximate the
 * donuts. This reuses their label outright, so a gauge and a donut sitting in
 * the same row read as the same kind of figure.
 *
 * Positioned from the gauge's `cx`/`cy` rather than the drawing area's centre:
 * a gauge arc struck between -110° and 110° sits low in its box, so the
 * drawing-area centre would float the number above the arc.
 */
export const GaugeCenterLabel = ({ data }: { readonly data: PieChartData }) => {
  const { cx, cy } = useGaugeState();

  return (
    <CenterLabelContent data={data} transform={`translate(${cx}, ${cy})`} />
  );
};

export default GaugeCenterLabel;
