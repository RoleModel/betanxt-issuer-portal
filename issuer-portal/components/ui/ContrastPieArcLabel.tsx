"use client";

import type { PieArcLabelProps } from "@mui/x-charts/PieChart";

import { PieArcLabel } from "@mui/x-charts/PieChart";

/**
 * Builds a `pieArcLabel` slot that colours each label against the arc it sits
 * on, looked up by the arc's fill.
 *
 * MUI gives the slot the resolved fill but no notion of a paired foreground, so
 * the caller supplies the mapping. Colours not in the map fall back to the
 * body text colour rather than rendering something unreadable.
 */
export const createContrastPieArcLabel = (
  contrastByColor: ReadonlyMap<string, string>
) => {
  const ContrastPieArcLabel = ({
    color,
    style,
    ...props
  }: PieArcLabelProps) => (
    <PieArcLabel
      {...props}
      color={color}
      style={{
        ...style,
        fill: contrastByColor.get(color) ?? "var(--mui-palette-text-primary)",
      }}
    />
  );

  ContrastPieArcLabel.displayName = "ContrastPieArcLabel";
  return ContrastPieArcLabel;
};
