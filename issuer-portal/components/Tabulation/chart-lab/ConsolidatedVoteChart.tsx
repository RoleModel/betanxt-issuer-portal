"use client";

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { PieChart } from "@mui/x-charts/PieChart";

import PieCenterLabel from "@/components/Reporting/PieChartCenterLabel";

import type { VoteBreakdownLeaf } from "./useVoteBreakdown";

interface ConsolidatedVoteChartProps {
  readonly leaves: readonly VoteBreakdownLeaf[];
  readonly totalShares: number;
  readonly height?: number;
}

/** Base hue per source; rings step lighter as they move outward. */
const SOURCE_PALETTE = [
  "var(--mui-palette-chartSeries-6-main)",
  "var(--mui-palette-chartSeries-7-main)",
  "var(--mui-palette-chartSeries-5-main)",
  "var(--mui-palette-warning-main)",
];

/** Hex fallbacks — `alpha()` cannot operate on CSS variables. */
const SOURCE_HEX = ["#7e57c2", "#447a44", "#eb6333", "#e0a458"];

const VOTE_ORDER: VoteBreakdownLeaf["vote"][] = ["For", "Against", "Abstain"];
const HOLDER_ORDER: VoteBreakdownLeaf["holderType"][] = [
  "Registered",
  "Beneficial",
];

const formatShares = (value: number): string => value.toLocaleString("en-US");

/**
 * One figure for what previously took three cards: the centre ring is the
 * channel a vote arrived through, the middle ring splits that channel into
 * registered and beneficial holders, and the outer ring splits each of those
 * into For / Against / Abstain.
 *
 * Slices are emitted parent-order-first at every level, which is what keeps a
 * child visually seated under its parent — MUI X draws each series
 * independently and does not enforce the hierarchy itself.
 */
export const ConsolidatedVoteChart = ({
  leaves,
  totalShares,
  height = 420,
}: ConsolidatedVoteChartProps) => {
  const sources = [...new Set(leaves.map((leaf) => leaf.source))].sort(
    (first, second) => {
      const sum = (source: string) =>
        leaves
          .filter((leaf) => leaf.source === source)
          .reduce((total, leaf) => total + leaf.shares, 0);
      return sum(second) - sum(first);
    }
  );

  const sourceSlices: {
    id: string;
    value: number;
    label: string;
    color: string;
  }[] = [];
  const holderSlices: typeof sourceSlices = [];
  const voteSlices: typeof sourceSlices = [];

  sources.forEach((source, sourceIndex) => {
    const baseHex = SOURCE_HEX[sourceIndex % SOURCE_HEX.length];
    const sourceLeaves = leaves.filter((leaf) => leaf.source === source);
    const sourceTotal = sourceLeaves.reduce(
      (total, leaf) => total + leaf.shares,
      0
    );

    sourceSlices.push({
      color: SOURCE_PALETTE[sourceIndex % SOURCE_PALETTE.length],
      id: `source-${source}`,
      label: source,
      value: sourceTotal,
    });

    for (const holderType of HOLDER_ORDER) {
      const holderLeaves = sourceLeaves.filter(
        (leaf) => leaf.holderType === holderType
      );
      const holderTotal = holderLeaves.reduce(
        (total, leaf) => total + leaf.shares,
        0
      );
      if (holderTotal <= 0) {
        continue;
      }

      holderSlices.push({
        color: alpha(baseHex, holderType === "Registered" ? 0.75 : 0.5),
        id: `holder-${source}-${holderType}`,
        label: `${source} · ${holderType}`,
        value: holderTotal,
      });

      VOTE_ORDER.forEach((vote, voteIndex) => {
        const voteTotal = holderLeaves
          .filter((leaf) => leaf.vote === vote)
          .reduce((total, leaf) => total + leaf.shares, 0);
        if (voteTotal <= 0) {
          return;
        }
        voteSlices.push({
          color: alpha(baseHex, 0.42 - voteIndex * 0.1),
          id: `vote-${source}-${holderType}-${vote}`,
          label: `${holderType} · ${vote}`,
          value: voteTotal,
        });
      });
    }
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

  const arcLabel = (item: { value: number }) => {
    const share = (item.value / totalShares) * 100;
    return share >= 6 ? `${share.toFixed(0)}%` : "";
  };

  return (
    <PieChart
      height={height}
      hideLegend={false}
      margin={{ bottom: 8, left: 8, right: 8, top: 8 }}
      series={[
        {
          arcLabel,
          arcLabelMinAngle: 18,
          data: sourceSlices,
          highlightScope: { fade: "global", highlight: "item" },
          innerRadius: 52,
          outerRadius: 108,
          valueFormatter: (item) => `${formatShares(item.value)} shares`,
        },
        {
          arcLabel,
          arcLabelMinAngle: 18,
          data: holderSlices,
          highlightScope: { fade: "global", highlight: "item" },
          innerRadius: 112,
          outerRadius: 154,
          valueFormatter: (item) => `${formatShares(item.value)} shares`,
        },
        {
          arcLabel,
          arcLabelMinAngle: 20,
          data: voteSlices,
          highlightScope: { fade: "global", highlight: "item" },
          innerRadius: 158,
          outerRadius: 196,
          valueFormatter: (item) => `${formatShares(item.value)} shares`,
        },
      ]}

      sx={{
        "& .MuiPieArcLabel-root": {
          fill: "var(--mui-palette-common-white)",
          fontSize: 12,
          fontWeight: 600,
        },
      }}
    >
      <PieCenterLabel
        data={{
          centerValue: formatShares(totalShares),
          centerTooltip: `${formatShares(totalShares)} shares voted`,
          label: "Shares voted",
          sliceData: [],
          total: totalShares,
        }}
      />
    </PieChart>
  );
};
