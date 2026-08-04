"use client";

import { Box } from "@mui/material";
import { useId } from "react";

import { LegendToggle } from "@/components/ui/LegendToggle";
import { SourcePatternDefinitions } from "./SourcePatternDefinitions";
import {
  getSourcePatternId,
  legendSwatchSize,
  type VoteSource,
  type VoteSourceId,
  voteSources,
} from "./vote-breakdown-chart-data";

/** A source's texture, rendered as a standalone swatch for the legend. */
const SourceLegendSwatch = ({ source }: { readonly source: VoteSource }) => {
  const patternId = `source-legend-${source.id}-${useId().replaceAll(":", "")}`;

  return (
    <Box
      aria-hidden="true"
      component="svg"
      sx={{
        display: "block",
        height: legendSwatchSize,
        width: legendSwatchSize,
      }}
      viewBox={`0 0 ${legendSwatchSize} ${legendSwatchSize}`}
    >
      <SourcePatternDefinitions prefix={patternId} />
      <rect
        fill={`url(#${getSourcePatternId(patternId, source.id)})`}
        height={legendSwatchSize}
        rx="2"
        ry="2"
        width={legendSwatchSize}
      />
    </Box>
  );
};

export interface VotingSourceLegendProps {
  readonly hiddenSourceIds: ReadonlySet<VoteSourceId>;
  readonly onSourceToggle: (sourceId: VoteSourceId) => void;
}

/** Legend for the voting-source chart: one toggle per source, filtering the axis bands. */
export const VotingSourceLegend = ({
  hiddenSourceIds,
  onSourceToggle,
}: VotingSourceLegendProps) => (
  <Box
    aria-label="Voting source legend"
    sx={{
      display: "flex",
      flexWrap: "wrap",
      gap: 1.5,
      justifyContent: "center",
    }}
  >
    {voteSources.map((source) => (
      <LegendToggle
        hidden={hiddenSourceIds.has(source.id)}
        key={source.id}
        label={source.label}
        onToggle={() => {
          onSourceToggle(source.id);
        }}
        testId={`source-legend-${source.id}`}
      >
        <SourceLegendSwatch source={source} />
      </LegendToggle>
    ))}
  </Box>
);

export default VotingSourceLegend;
