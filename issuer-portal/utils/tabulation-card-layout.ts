import { createElement } from "react";
import type { PieArcLabelProps } from "@mui/x-charts/PieChart";
import type { ReactElement } from "react";

export const tabulationCardMinHeight = 300;
export const tabulationCardHeaderMinHeight = 10;
export const tabulationChartHeight = 300;
export const tabulationDonutInnerRadius = 80;
export const tabulationDonutOuterRadius = 105;
export const tabulationSmallArcLabelAngle = 20;

export const shouldShowTabulationPieArcLabels = (
  dataPointCount: number
): boolean => dataPointCount > 1;
export const tabulationDonutCenterY = 120;
export const tabulationDonutChartMargin = {
  bottom: 40,
  left: 0,
  right: 0,
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
 * Keeps labels for adjacent small pie arcs readable by placing them outside
 * the donut with side anchors and a collision-safe vertical offset.
 */
export const TabulationPieArcLabel = ({
  arcLabelRadius,
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
  const labelRadius = isSmallArc ? outerRadius + 20 : arcLabelRadius;
  const labelX = Math.sin(middleAngle) * labelRadius;
  const labelY = -Math.cos(middleAngle) * labelRadius;
  const isOnRightSide = labelX >= 0;
  const verticalOffset =
    isSmallArc && labelY < 0 ? Math.max(-30, Math.min(30, -labelX)) : 0;

  return createElement(
    "text",
    {
      dominantBaseline: "middle",
      fill: "var(--mui-palette-text-primary)",
      fontSize: "12px",
      pointerEvents: "none",
      textAnchor: isSmallArc ? (isOnRightSide ? "start" : "end") : "middle",
      x: labelX,
      y: labelY + verticalOffset,
    },
    formattedArcLabel
  );
};
