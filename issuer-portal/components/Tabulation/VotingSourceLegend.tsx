"use client";

import { Box } from "@mui/material";
import { useId } from "react";

import { LegendToggle } from "./LegendToggle";
import { SourcePatternDefinitions } from "./SourcePatternDefinitions";
import {
  getSourcePatternId,
  holderStyles,
  type HolderType,
  holderTypes,
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
  readonly hiddenHolderTypes: ReadonlySet<HolderType>;
  readonly hiddenSourceIds: ReadonlySet<VoteSourceId>;
  readonly onHolderTypeToggle: (holderType: HolderType) => void;
  readonly onSourceToggle: (sourceId: VoteSourceId) => void;
}

/**
 * Legend for the voting-source chart. Holder types filter the axis bands,
 * sources filter the stacked series; both are toggled here.
 */
export const VotingSourceLegend = ({
  hiddenHolderTypes,
  hiddenSourceIds,
  onHolderTypeToggle,
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
    {holderTypes.map((holderType) => (
      <LegendToggle
        hidden={hiddenHolderTypes.has(holderType)}
        key={holderType}
        label={holderType}
        onToggle={() => {
          onHolderTypeToggle(holderType);
        }}
        testId={`source-holder-legend-${holderType.toLowerCase()}`}
      >
        <Box
          aria-hidden="true"
          sx={{
            backgroundColor: holderStyles[holderType].color,
            borderRadius: "2px",
            height: legendSwatchSize,
            width: legendSwatchSize,
          }}
        />
      </LegendToggle>
    ))}
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
