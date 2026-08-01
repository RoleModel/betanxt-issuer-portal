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
  Beneficial: "var(--mui-palette-primary-light)",
  Registered: "var(--mui-palette-secondary-main)",
};

const HOLDER_ORDER: VoteBreakdownLeaf["holderType"][] = ["Registered", "Beneficial"];
const VOTE_ORDER: VoteBreakdownLeaf["vote"][] = ["For", "Against", "Withhold", "Abstain"];

/** Opacity steps outward so each ring stays legible against its parent. */
const VOTE_ALPHA = [0.85, 0.62, 0.45, 0.3];
const SOURCE_ALPHA = [0.55, 0.32, 0.22];

const withAlpha = (hex: string, alpha: number): string =>
  `color-mix(in srgb, ${hex} ${mix(0, 100, alpha)}%, transparent ${mix(100, 0, alpha)}%)`;

const formatShares = (value: number): string => value.toLocaleString("en-US");

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

  const sourcesInOrder = [...new Set(leaves.map((leaf) => leaf.source))].sort();

  for (const holderType of HOLDER_ORDER) {
    const holderLeaves = leaves.filter((leaf) => leaf.holderType === holderType);
    const holderTotal = sumOf(holderLeaves);
    if (holderTotal <= 0) {
      continue;
    }

    const baseHex = HOLDER_HEX[holderType];
    const holderId = `holder-${holderType}`;
    holderSlices.push({
      color: baseHex,
      id: holderId,
      label: holderType,
      value: holderTotal,
    });
    parentShare.set(holderId, totalShares > 0 ? (holderTotal / totalShares) * 100 : 0);

    VOTE_ORDER.forEach((vote, voteIndex) => {
      const voteLeaves = holderLeaves.filter((leaf) => leaf.vote === vote);
      const voteTotal = sumOf(voteLeaves);
      if (voteTotal <= 0) {
        return;
      }

      const voteId = `vote-${holderType}-${vote}`;
      voteSlices.push({
        color: withAlpha(baseHex, VOTE_ALPHA[voteIndex] ?? 0.3),
        id: voteId,
        label: vote,
        value: voteTotal,
      });
      parentShare.set(voteId, (voteTotal / holderTotal) * 100);

      sourcesInOrder.forEach((source, sourceIndex) => {
        const sourceTotal = sumOf(voteLeaves.filter((leaf) => leaf.source === source));
        if (sourceTotal <= 0) {
          return;
        }
        const sourceId = `source-${holderType}-${vote}-${source}`;
        sourceSlices.push({
          color: withAlpha(baseHex, SOURCE_ALPHA[sourceIndex] ?? 0.2),
          id: sourceId,
          label: source,
          value: sourceTotal,
        });
        parentShare.set(sourceId, (sourceTotal / voteTotal) * 100);
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
    return `${item.label ?? ""} (${share.toFixed(0)}%)`;
  };

  const valueFormatter = (item: { value: number }): string =>
    `${formatShares(item.value)} shares — ${((item.value / totalShares) * 100).toFixed(0)}% of all voted`;

  const shared = {
    arcLabel,
    cornerRadius: 10,
    highlightScope: { fade: "global", highlight: "item" } as const,
    highlighted: { additionalRadius: 2 },
    valueFormatter,
  };

  return (
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
          fill: "var(--mui-palette-primary-contrastText)",
          sliceData: [],
          total: totalShares,
        }}
      />
    </PieChart>
  );
};
