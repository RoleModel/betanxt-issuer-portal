"use client";

import { useXScale, useYScale } from "@mui/x-charts/hooks";
import { useLayoutEffect, useRef, useState } from "react";

import {
  formatTabulationMetric,
  type TabulationDisplayMode,
} from "../../utils/tabulation-display";
import { barLabelInset, type HolderType } from "./vote-breakdown-chart-data";

export interface HolderTotalsBarLabelsProps {
  readonly displayMode: TabulationDisplayMode;
  /** Parallel to `holderTypes` - both must describe the same visible bands. */
  readonly holderTotals: readonly number[];
  readonly holderTypes: readonly HolderType[];
  /** Foregrounds for labels that fit inside each holder's terminal source bar. */
  readonly insideTextColors: ReadonlyMap<HolderType, string>;
  readonly totalShares: number;
}

/**
 * Total per holder-type band, drawn over the bars as a chart child so it can
 * read the axis scales.
 *
 * Each label sits inside its bar's right edge using the terminal source
 * segment's paired contrast color. It flips to `text.primary` just outside
 * when the bar is too short to hold it, avoiding both the former outline and
 * an unreadable foreground on the card background.
 */
export const HolderTotalsBarLabels = ({
  displayMode,
  holderTotals,
  holderTypes: visibleHolderTypes,
  insideTextColors,
  totalShares,
}: HolderTotalsBarLabelsProps) => {
  const xScale = useXScale<"linear">();
  const yScale = useYScale<"band">();
  const labelNodes = useRef(new Map<string, SVGTextElement | null>());
  const [labelWidths, setLabelWidths] = useState<ReadonlyMap<string, number>>(
    () => new Map()
  );

  const labels = visibleHolderTypes.flatMap((holderType, index) => {
    const total = holderTotals[index] ?? 0;
    const y = yScale(holderType);

    if (total === 0 || y === undefined) {
      return [];
    }

    return [
      {
        displayedTotal:
          displayMode === "numbers" ? total : (total / totalShares) * 100,
        holderType,
        text: formatTabulationMetric(total, totalShares, displayMode).display,
        y,
      },
    ];
  });

  // Re-measure only when the rendered strings change. Glyph width depends on
  // the text and the (fixed) font, not on the scales, so resizing does not need
  // a fresh measurement - the fit calculation below reads the scales directly.
  const labelSignature = labels
    .map((label) => `${label.holderType}:${label.text}`)
    .join("|");

  // Measured rather than estimated from character count: an estimate misjudges
  // exactly the boundary cases this exists to catch. A layout effect runs
  // before paint, so the flip is never visible.
  //
  // Measuring before paint is the case React prescribes a layout effect plus
  // state for, so the rule below is suppressed deliberately. The equality bail
  // is what keeps it from becoming the update chain that rule guards against.
  useLayoutEffect(() => {
    const measured = new Map<string, number>();
    for (const [key, node] of labelNodes.current) {
      if (node) {
        measured.set(key, node.getComputedTextLength());
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabelWidths((previous) => {
      const unchanged =
        previous.size === measured.size &&
        [...measured].every(([key, width]) => previous.get(key) === width);
      return unchanged ? previous : measured;
    });
  }, [labelSignature]);

  return (
    <g aria-label="Holder type totals">
      {labels.map(({ displayedTotal, holderType, text, y }) => {
        const barStart = xScale(0);
        const barEnd = xScale(displayedTotal);
        const measuredWidth = labelWidths.get(holderType);
        const insideTextColor =
          insideTextColors.get(holderType) ?? "var(--mui-palette-text-primary)";
        // Before the first measurement, assume it fits: that keeps the label in
        // its usual place for one frame instead of flicking it outside.
        const fitsInsideBar =
          measuredWidth === undefined ||
          measuredWidth + barLabelInset * 2 <= barEnd - barStart;

        return (
          <text
            data-inside-fill={insideTextColor}
            data-testid={`vote-matrix-total-${holderType.toLowerCase()}`}
            fill={
              fitsInsideBar
                ? insideTextColor
                : "var(--mui-palette-text-primary)"
            }
            fontSize="24"
            fontWeight="bold"
            key={holderType}
            ref={(node) => {
              labelNodes.current.set(holderType, node);
            }}
            textAnchor={fitsInsideBar ? "end" : "start"}
            x={fitsInsideBar ? barEnd - barLabelInset : barEnd + barLabelInset}
            y={y + yScale.bandwidth() - barLabelInset}
          >
            {text}
          </text>
        );
      })}
    </g>
  );
};

export default HolderTotalsBarLabels;
