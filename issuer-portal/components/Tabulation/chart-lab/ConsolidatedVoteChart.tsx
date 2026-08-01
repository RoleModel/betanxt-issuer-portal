"use client";

import { Box, Typography } from "@mui/material";
import { PieChart, pieClasses } from "@mui/x-charts/PieChart";

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

/** Base hue per submission channel; rings step more transparent outward. */
const SOURCE_HEX = ["#fa938e", "#98bf45", "#51cbcf", "#d397ff", "#f5b942"];

const VOTE_ORDER: VoteBreakdownLeaf["vote"][] = [
  "For",
  "Against",
  "Withhold",
  "Abstain",
];
const HOLDER_ORDER: VoteBreakdownLeaf["holderType"][] = [
  "Registered",
  "Beneficial",
];

/** Opacity per ring position, mirroring the MUI nested-pie demo. */
const HOLDER_ALPHA = [0.85, 0.55];
const VOTE_ALPHA = [0.8, 0.6, 0.4, 0.25];

const withAlpha = (hex: string, alpha: number): string => {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const formatShares = (value: number): string => value.toLocaleString("en-US");

const INNER_RADIUS = 62;
const SOURCE_OUTER = 122;
const HOLDER_OUTER = 162;
const VOTE_OUTER = 200;

/**
 * One figure for what previously took two cards: the centre ring is the channel
 * a vote arrived through, the middle ring splits that channel into registered
 * and beneficial holders, and the outer ring splits each of those into
 * For / Against / Abstain.
 *
 * Every percentage is relative to its own parent — "Beneficial (62%)" means 62%
 * of that channel, not of all shares — which is what makes each ring readable
 * on its own. Slices are emitted parent-order-first at every level so a child
 * sits under its parent; MUI X draws each series independently and does not
 * enforce the hierarchy itself.
 */
export const ConsolidatedVoteChart = ({
  leaves,
  totalShares,
  height = 460,
}: ConsolidatedVoteChartProps) => {
  const sumOf = (subset: readonly VoteBreakdownLeaf[]): number =>
    subset.reduce((total, leaf) => total + leaf.shares, 0);

  const sources = [...new Set(leaves.map((leaf) => leaf.source))].sort(
    (first, second) =>
      sumOf(leaves.filter((leaf) => leaf.source === second)) -
      sumOf(leaves.filter((leaf) => leaf.source === first))
  );

  const sourceSlices: Slice[] = [];
  const holderSlices: Slice[] = [];
  const voteSlices: Slice[] = [];
  // id -> percentage of its parent, so arc labels need no type assertions.
  const parentShare = new Map<string, number>();

  sources.forEach((source, sourceIndex) => {
    const baseHex = SOURCE_HEX[sourceIndex % SOURCE_HEX.length];
    const sourceLeaves = leaves.filter((leaf) => leaf.source === source);
    const sourceTotal = sumOf(sourceLeaves);
    const sourceId = `source-${source}`;

    sourceSlices.push({
      color: baseHex,
      id: sourceId,
      label: source,
      value: sourceTotal,
    });
    parentShare.set(
      sourceId,
      totalShares > 0 ? (sourceTotal / totalShares) * 100 : 0
    );

    HOLDER_ORDER.forEach((holderType, holderIndex) => {
      const holderLeaves = sourceLeaves.filter(
        (leaf) => leaf.holderType === holderType
      );
      const holderTotal = sumOf(holderLeaves);
      if (holderTotal <= 0) {
        return;
      }

      const holderId = `holder-${source}-${holderType}`;
      holderSlices.push({
        color: withAlpha(baseHex, HOLDER_ALPHA[holderIndex] ?? 0.5),
        id: holderId,
        label: holderType,
        value: holderTotal,
      });
      parentShare.set(
        holderId,
        sourceTotal > 0 ? (holderTotal / sourceTotal) * 100 : 0
      );

      VOTE_ORDER.forEach((vote, voteIndex) => {
        const voteTotal = sumOf(
          holderLeaves.filter((leaf) => leaf.vote === vote)
        );
        if (voteTotal <= 0) {
          return;
        }
        const voteId = `vote-${source}-${holderType}-${vote}`;
        voteSlices.push({
          color: withAlpha(baseHex, VOTE_ALPHA[voteIndex] ?? 0.25),
          id: voteId,
          label: vote,
          value: voteTotal,
        });
        parentShare.set(
          voteId,
          holderTotal > 0 ? (voteTotal / holderTotal) * 100 : 0
        );
      });
    });
  });

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
        <Typography color="text.secondary">
          No votes recorded for this proposal yet.
        </Typography>
      </Box>
    );
  }

  const arcLabel = (item: { id?: string | number; label?: string }): string => {
    const share = parentShare.get(String(item.id ?? "")) ?? 0;
    return `${item.label ?? ""} (${share.toFixed(0)}%)`;
  };

  const valueFormatter = (item: { value: number }): string =>
    `${formatShares(item.value)} shares — ${((item.value / totalShares) * 100).toFixed(0)}% of all voted`;

  const shared = {
    arcLabel,
    cornerRadius: 3,
    highlightScope: { fade: "global", highlight: "item" } as const,
    highlighted: { additionalRadius: 2 },
    valueFormatter,
  };

  return (
    <PieChart
      height={height}
      hideLegend
      series={[
        {
          ...shared,
          arcLabelRadius: (INNER_RADIUS + SOURCE_OUTER) / 2,
          data: sourceSlices,
          innerRadius: INNER_RADIUS,
          outerRadius: SOURCE_OUTER,
        },
        {
          ...shared,
          arcLabelRadius: (SOURCE_OUTER + HOLDER_OUTER) / 2,
          data: holderSlices,
          innerRadius: SOURCE_OUTER,
          outerRadius: HOLDER_OUTER,
        },
        {
          ...shared,
          // Pushed beyond the outer edge so the third ring's labels sit outside
          // the chart rather than being dropped for want of room.
          arcLabelRadius: VOTE_OUTER + 34,
          data: voteSlices,
          innerRadius: HOLDER_OUTER,
          outerRadius: VOTE_OUTER,
        },
      ]}
      sx={{
        [`& .${pieClasses.arcLabel}`]: {
          fontSize: 12,
          fontWeight: 600,
        },
      }}
    >
      <PieCenterLabel
        data={{
          centerTooltip: `${formatShares(totalShares)} shares voted`,
          centerValue: formatShares(totalShares),
          label: "Shares voted",
          sliceData: [],
          total: totalShares,
        }}
      />
    </PieChart>
  );
};
