"use client";

import {
  PatternCircles,
  PatternLines,
  PatternOrientation,
} from "@visx/pattern";

import {
  getPatternForeground,
  getSourcePatternId,
  patternTileSize,
  voteSources,
} from "./vote-breakdown-chart-data";

/**
 * SVG `<pattern>` definitions for every voting source.
 *
 * Each source gets its own texture so the bars stay distinguishable without
 * relying on colour alone. Rendered inside whichever SVG references them - the
 * chart itself, and each legend swatch - with `prefix` keeping the ids unique
 * between those instances.
 */
export const SourcePatternDefinitions = ({
  prefix,
}: {
  readonly prefix: string;
}) => (
  <defs>
    {voteSources.map((source) => {
      const id = getSourcePatternId(prefix, source.id);
      const patternForeground = getPatternForeground(source);

      if (source.id === "web") {
        return (
          <PatternLines
            background={source.color}
            height={patternTileSize}
            id={id}
            key={id}
            orientation={[
              PatternOrientation.horizontal,
              PatternOrientation.vertical,
            ]}
            stroke={patternForeground}
            strokeWidth={0.8}
            width={patternTileSize}
          />
        );
      }

      if (source.id === "print") {
        return (
          <PatternLines
            background={source.color}
            height={patternTileSize}
            id={id}
            key={id}
            orientation={[PatternOrientation.diagonal]}
            stroke={patternForeground}
            strokeWidth={1}
            width={patternTileSize}
          />
        );
      }

      return (
        <PatternCircles
          background={patternForeground}
          complement
          fill={source.color}
          height={patternTileSize}
          id={id}
          key={id}
          width={patternTileSize}
        />
      );
    })}
  </defs>
);

export default SourcePatternDefinitions;
