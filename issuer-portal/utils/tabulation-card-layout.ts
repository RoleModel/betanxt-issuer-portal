/* eslint-disable sonarjs/function-name */
import { createElement } from "react";
import type { PieArcLabelProps } from "@mui/x-charts/PieChart";
import type { ReactElement } from "react";

export const tabulationCardMinHeight = 300;
export const tabulationCardHeaderMinHeight = 10;
export const tabulationChartHeight = 300;
export const tabulationDonutInnerRadius = 80;
export const tabulationDonutOuterRadius = 105;
/** Distance from the outer edge of the donut to the arc label baseline. */
export const tabulationArcLabelGap = 10;
export const centerLabelOffset = 2;
export const centerLalbeSecondaryOffset = 1.6;

/**
 * Smallest rendered arc angle that still gets a label.
 *
 * Labels are placed at their slice's mid-angle, so two adjacent slices need
 * roughly 7 degrees between mid-angles before a 12px line of text stops
 * overlapping its neighbour. Anything under about 4% of the circle is therefore
 * unlabelable in practice. Suppressed slices are still named in the legend and
 * carry their exact number and percentage in the tooltip.
 *
 * This also covers charts that inflate slivers to a minimum visual width: a
 * slice pinned to that floor renders at or below this angle, so it is caught
 * here rather than needing a separate rule.
 */
export const tabulationMinArcLabelAngle = 10;

export const shouldShowTabulationPieArcLabels = (
  dataPointCount: number
): boolean => dataPointCount > 1;
export const tabulationDonutCenterY = 120;
// Horizontal room for the outside arc labels. With left/right at 0 the
// side-anchored text was clipped at the edges of the card.
export const tabulationDonutChartMargin = {
  bottom: 40,
  left: 90,
  right: 90,
  top: 30,
} as const;

export const tabulationCardStyles = {
  display: "flex",
  flex: 1,
  flexDirection: "column",
  height: "100%",
  minHeight: tabulationCardMinHeight,
  width: "100%",
} as const;

export const tabulationCardHeaderStyles = {
  alignItems: "flex-start",
  minHeight: tabulationCardHeaderMinHeight,
} as const;

export const tabulationCardContentStyles = {
  alignItems: "center",
  display: "flex",
  flex: 1,
  justifyContent: "center",
  pt: 0,
} as const;

export const tabulationCardContentStartStyles = {
  alignItems: "start",
  display: "flex",
  flex: 1,
  justifyContent: "center",
  pt: 0,
} as const;

/**
 * Renders pie arc labels just outside the donut, hugging their own slice.
 *
 * MUI's default `arcLabelRadius` sits at the midpoint of the ring, so text was
 * drawn onto the fill and lost contrast against saturated colours such as
 * primary.main. Labels are placed radially at `outerRadius` plus a small gap
 * and anchored away from the centre, which keeps each one next to the slice it
 * describes while never crossing the arc.
 *
 * That it cannot cross the arc holds for every angle: the anchor sits at
 * (sin0 * R, -cos0 * R) and the text runs outward, so it clears the ring when
 * sin0 * R >= sqrt(r^2 - (cos0 * R)^2), which reduces to R^2 >= r^2 — true for
 * any R greater than the outer radius.
 */
export const TabulationPieArcLabel = ({
  endAngle,
  formattedArcLabel,
  outerRadius,
  startAngle,
}: PieArcLabelProps): ReactElement | null => {
  if (formattedArcLabel === null || formattedArcLabel === undefined) {
    return null;
  }

  const middleAngle = (startAngle + endAngle) / 2;
  const labelRadius = outerRadius + tabulationArcLabelGap;
  const labelX = Math.sin(middleAngle) * labelRadius;
  const labelY = -Math.cos(middleAngle) * labelRadius;
  const isOnRightSide = labelX >= 0;

  return createElement(
    "text",
    {
      dominantBaseline: "middle",
      fill: "var(--mui-palette-text-primary)",
      fontSize: "12px",
      pointerEvents: "none",
      textAnchor: isOnRightSide ? "start" : "end",
      x: labelX,
      y: labelY,
    },
    formattedArcLabel
  );
};
