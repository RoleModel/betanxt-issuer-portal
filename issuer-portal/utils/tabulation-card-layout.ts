import { createElement } from "react";
import type { PieArcLabelProps } from "@mui/x-charts/PieChart";
import type { ReactElement } from "react";

export const tabulationCardMinHeight = 300;
export const tabulationCardHeaderMinHeight = 10;
export const tabulationChartHeight = 300;
export const tabulationDonutInnerRadius = 80;
export const tabulationDonutOuterRadius = 105;
export const tabulationSmallArcLabelAngle = 20;
/** Distance from the outer edge of the donut to the arc label baseline. */
export const tabulationArcLabelGap = 10;

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
  top: 20,
} as const;

export const tabulationVoteDistributionColors: Readonly<
  Record<string, string>
> = {
  "dtc-unvoted": "var(--mui-palette-primary-light)",
  "dtc-voted": "var(--mui-palette-primary-main)",
  "non-dtc-unvoted": "var(--mui-palette-secondary-light)",
  "non-dtc-voted": "var(--mui-palette-secondary-main)",
};

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
 * Renders pie arc labels entirely outside the donut.
 *
 * Labels are never drawn over the arc itself. MUI's default `arcLabelRadius`
 * sits at the midpoint of the ring, so text landed on the fill and lost
 * contrast against saturated colours such as primary.main — unreadable for
 * some users regardless of the text colour chosen. Every label is therefore
 * pushed past `outerRadius` and anchored away from the chart, with a
 * collision-safe vertical nudge for adjacent small arcs.
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
  const arcAngle = ((endAngle - startAngle) * 180) / Math.PI;
  const isSmallArc = arcAngle <= tabulationSmallArcLabelAngle;
  const labelRadius = outerRadius + tabulationArcLabelGap;
  const isOnRightSide = Math.sin(middleAngle) >= 0;
  // Pin x to a column beside the donut rather than following the arc radially.
  // Radial placement collapses x towards 0 near the 12 and 6 o'clock positions,
  // which put the text straight across the top or bottom of the ring even when
  // the radius cleared it. Anchoring outward from a fixed column means the text
  // always runs away from the chart and can never cross the arc.
  const labelX = (isOnRightSide ? 1 : -1) * labelRadius;
  const labelY = -Math.cos(middleAngle) * labelRadius;
  // Adjacent thin slices resolve to nearly the same y; fan them apart a little.
  // Exact de-collision would need to lay out every label at once, which a
  // per-label slot cannot do — raise `arcLabelMinAngle` to drop labels for
  // slices too thin to annotate.
  const verticalOffset = isSmallArc
    ? Math.max(-30, Math.min(30, -Math.sin(middleAngle) * labelRadius))
    : 0;

  return createElement(
    "text",
    {
      dominantBaseline: "middle",
      fill: "var(--mui-palette-text-primary)",
      fontSize: "12px",
      pointerEvents: "none",
      textAnchor: isOnRightSide ? "start" : "end",
      x: labelX,
      y: labelY + verticalOffset,
    },
    formattedArcLabel
  );
};
