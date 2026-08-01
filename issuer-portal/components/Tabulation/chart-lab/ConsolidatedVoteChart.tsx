"use client";

import { Box, Typography } from "@mui/material";
import { PieChart, pieClasses } from "@mui/x-charts/PieChart";
import { mix } from "framer-motion";

import PieCenterLabel from "@/components/Reporting/PieChartCenterLabel";

import type { VoteBreakdownLeaf } from "./useVoteBreakdown";

interface ConsolidatedVoteChartProps {
  readonly leaves: readonly VoteBreakdownLeaf[];
  readonly totalShares: number;
  readonly height?: number;
}

interface Slice {
  id: string;
  label: string;
  value: number;
  color: string;
}

/** Base hue per holder type — the innermost split. */
const HOLDER_HEX: Record<VoteBreakdownLeaf["holderType"], string> = {
  Beneficial: "color-mix(in srgb, var(--mui-palette-primary-light) 80%, transparent 0%)",
  Registered: "color-mix(in srgb, var(--mui-palette-secondary-main) 80%, transparent 0%)",
};

const HOLDER_ORDER: VoteBreakdownLeaf["holderType"][] = ["Registered", "Beneficial"];
const VOTE_ORDER: VoteBreakdownLeaf["vote"][] = ["For", "Against", "Withhold", "Abstain"];

/** Opacity steps outward so each ring stays legible against its parent. */
const VOTE_ALPHA = [0.5, 0.62, 0.45, 0.3];
const SOURCE_ALPHA = [0.35, 0.32, 0.22];

const withAlpha = (hex: string, alpha: number): string =>
  `color-mix(in srgb, ${hex} ${mix(0, 100, alpha)}%, transparent ${mix(100, 0, alpha)}%)`;

const formatShares = (value: number): string => value.toLocaleString("en-US");

/** Smallest fraction of its parent's arc any slice may occupy. */
const MIN_PARENT_SHARE = 0.08;

/**
 * Spreads a parent's arc across its children, guaranteeing each a floor.
 *
 * Real tabulation data produces sub-1% leaves — under a degree of arc, which
 * cannot be seen or hovered. Children keep their order and always sum back to
 * the parent's span, so a slice still sits under its parent. When the floor
 * cannot be met for every child, normalisation degrades toward equal slices
 * rather than overflowing the parent.
 *
 * @param totals - True values, in render order
 * @param parentSpan - Display span the children must fill
 * @returns Display spans, summing to `parentSpan`
 */
const allocateSpans = (totals: readonly number[], parentSpan: number): number[] => {
  const total = totals.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return totals.map(() => 0);
  }
  const floored = totals.map((value) => Math.max(value / total, MIN_PARENT_SHARE));
  const flooredTotal = floored.reduce((sum, value) => sum + value, 0);
  return floored.map((value) => (value / flooredTotal) * parentSpan);
};

/**
 * Holder type, then how those shares were cast, then the channel they arrived
 * through — one figure covering what the beneficial-vs-registered and voting
 * activity cards showed separately.
 *
 * Percentages are relative to the parent slice: "For (92%)" means 92% of that
 * holder type, not of all shares, so each ring reads on its own. Children are
 * emitted in parent order at every level, which is what seats a slice under its
 * parent — MUI X draws each series independently and does not enforce the
 * hierarchy itself.
 */
export const ConsolidatedVoteChart = ({
  leaves,
  totalShares,
  height = 440,
}: ConsolidatedVoteChartProps) => {
  const sumOf = (subset: readonly VoteBreakdownLeaf[]): number =>
    subset.reduce((total, leaf) => total + leaf.shares, 0);

  const holderSlices: Slice[] = [];
  const voteSlices: Slice[] = [];
  const sourceSlices: Slice[] = [];
  // id -> share of its parent, so arc labels need no type assertions.
  const parentShare = new Map<string, number>();
  // id -> true share count, so tooltips report real figures even though arc
  // sizes are normalised for legibility.
  const trueValue = new Map<string, number>();
  let normalised = false;

  const sourcesInOrder = [...new Set(leaves.map((leaf) => leaf.source))].sort();

  /** Records how far a normalised span drifts from the true proportion. */
  const noteDrift = (span: number, parentSpan: number, ratio: number): void => {
    if (parentSpan > 0 && Math.abs(span / parentSpan - ratio) > 0.005) {
      normalised = true;
    }
  };

  const presentHolders = HOLDER_ORDER.filter(
    (holderType) => sumOf(leaves.filter((l) => l.holderType === holderType)) > 0,
  );
  const holderSpans = new Map<string, number>();
  allocateSpans(
    presentHolders.map((holderType) => sumOf(leaves.filter((l) => l.holderType === holderType))),
    1,
  ).forEach((span, index) => holderSpans.set(presentHolders[index], span));

  for (const holderType of presentHolders) {
    const holderLeaves = leaves.filter((leaf) => leaf.holderType === holderType);
    const holderTotal = sumOf(holderLeaves);
    const holderSpan = holderSpans.get(holderType) ?? 0;

    const baseHex = HOLDER_HEX[holderType];
    const holderId = `holder-${holderType}`;
    holderSlices.push({
      color: baseHex,
      id: holderId,
      label: holderType,
      value: holderSpan,
    });
    parentShare.set(holderId, totalShares > 0 ? (holderTotal / totalShares) * 100 : 0);
    trueValue.set(holderId, holderTotal);
    noteDrift(holderSpan, 1, totalShares > 0 ? holderTotal / totalShares : 0);

    const presentVotes = VOTE_ORDER.filter(
      (vote) => sumOf(holderLeaves.filter((l) => l.vote === vote)) > 0,
    );
    const voteSpans = new Map<string, number>();
    allocateSpans(
      presentVotes.map((vote) => sumOf(holderLeaves.filter((l) => l.vote === vote))),
      holderSpan,
    ).forEach((span, index) => voteSpans.set(presentVotes[index], span));

    VOTE_ORDER.forEach((vote, voteIndex) => {
      const voteLeaves = holderLeaves.filter((leaf) => leaf.vote === vote);
      const voteTotal = sumOf(voteLeaves);
      if (voteTotal <= 0) {
        return;
      }
      const voteSpan = voteSpans.get(vote) ?? 0;

      const voteId = `vote-${holderType}-${vote}`;
      voteSlices.push({
        color: withAlpha(baseHex, VOTE_ALPHA[voteIndex] ?? 0.3),
        id: voteId,
        label: vote,
        value: voteSpan,
      });
      parentShare.set(voteId, (voteTotal / holderTotal) * 100);
      trueValue.set(voteId, voteTotal);
      noteDrift(voteSpan, holderSpan, voteTotal / holderTotal);

      const presentSources = sourcesInOrder.filter(
        (source) => sumOf(voteLeaves.filter((l) => l.source === source)) > 0,
      );
      const sourceSpans = new Map<string, number>();
      allocateSpans(
        presentSources.map((source) => sumOf(voteLeaves.filter((l) => l.source === source))),
        voteSpan,
      ).forEach((span, index) => sourceSpans.set(presentSources[index], span));

      sourcesInOrder.forEach((source, sourceIndex) => {
        const sourceTotal = sumOf(voteLeaves.filter((leaf) => leaf.source === source));
        if (sourceTotal <= 0) {
          return;
        }
        const sourceSpan = sourceSpans.get(source) ?? 0;
        const sourceId = `source-${holderType}-${vote}-${source}`;
        sourceSlices.push({
          color: withAlpha(baseHex, SOURCE_ALPHA[sourceIndex] ?? 0.2),
          id: sourceId,
          label: source,
          value: sourceSpan,
        });
        parentShare.set(sourceId, (sourceTotal / voteTotal) * 100);
        trueValue.set(sourceId, sourceTotal);
        noteDrift(sourceSpan, voteSpan, sourceTotal / voteTotal);
      });
    });
  }

  if (totalShares <= 0) {
    return (
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          height,
          justifyContent: "center",
        }}
      >
        <Typography color="var(--mui-palette-primary-contrastText)" variant="body2">
          No votes recorded for this proposal yet.
        </Typography>
      </Box>
    );
  }

  // Radii derive from the available height so the outer ring and its labels
  // stay inside the box instead of overflowing the card.
  const radius = Math.max(120, Math.min(height / 2 - 56, 190));
  const innerRadius = radius * 0.3;
  const holderOuter = radius * 0.72;
  const voteOuter = radius * 0.92;
  const sourceOuter = radius;

  const arcLabel = (item: { id?: string | number; label?: string }): string => {
    const share = parentShare.get(String(item.id ?? "")) ?? 0;
    const shown = share > 0 && share < 1 ? share.toFixed(1) : share.toFixed(0);
    return `${item.label ?? ""} (${shown}%)`;
  };

  // item.value is the normalised span, not a share count — always report the
  // figure recorded for this slice instead.
  const valueFormatter = (item: { id?: string | number; value: number }): string => {
    const actual = trueValue.get(String(item.id ?? "")) ?? 0;
    return `${formatShares(actual)} shares — ${((actual / totalShares) * 100).toFixed(2)}% of all voted`;
  };

  const shared = {
    arcLabel,
    cornerRadius: 10,
    highlightScope: { fade: "global", highlight: "item" } as const,
    highlighted: { additionalRadius: 2 },
    valueFormatter,
  };

  return (
    <Box>
      <PieChart
        height={height}
        hideLegend
        margin={{ bottom: 8, left: 8, right: 8, top: 8 }}
        series={[
          {
            ...shared,
            arcLabelRadius: (innerRadius + holderOuter) / 2,
            data: holderSlices,
            innerRadius,
            outerRadius: holderOuter,
          },
          {
            ...shared,
            arcLabelRadius: (holderOuter + voteOuter) / 2,
            data: voteSlices,
            innerRadius: holderOuter,
            outerRadius: voteOuter,
          },
          {
            ...shared,
            // Just outside the last ring so the deepest labels stay readable
            // without colliding with the ring they describe.
            arcLabelRadius: sourceOuter + 26,
            data: sourceSlices,
            innerRadius: voteOuter,
            outerRadius: sourceOuter,
          },
        ]}
        sx={{
          [`& .${pieClasses.arcLabel}`]: {
            fontSize: 11,
            fontWeight: 600,
          },
        }}
      >
        <PieCenterLabel
          data={{
            centerTooltip: `${formatShares(totalShares)} shares voted`,
            centerValue: formatShares(totalShares),
            label: "Shares voted",
            fill: "var(--mui-palette-text-primary)",
            sliceData: [],
            total: totalShares,
          }}
        />
      </PieChart>
      {normalised ? (
        <Typography color="text.secondary" component="p" variant="body3">
          Arc sizes are normalised so every segment stays readable — small slices are drawn larger
          than their true share. Percentages and tooltips show the real figures.
        </Typography>
      ) : null}
    </Box>
  );
};
