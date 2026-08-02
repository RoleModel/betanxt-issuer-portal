import type { VoteMatrixRow } from "@/hooks/useTabulationInsights";

export type VoteOutcomeKey = keyof Pick<
  VoteMatrixRow,
  "against" | "abstain" | "for" | "withhold"
>;
export type VoteSourceId = "ivr" | "print" | "web";
export type HolderType = "Beneficial" | "Registered";

export interface VoteOutcome {
  readonly color: string;
  readonly contrastColor: string;
  readonly key: VoteOutcomeKey;
  readonly label: string;
}

export interface VoteSource {
  readonly color: string;
  /**
   * Foreground for anything drawn on top of `color` - the hatch strokes and
   * dots in the bar patterns. Paired explicitly rather than derived, because
   * `color` is a resolved CSS value, not a palette key.
   */
  readonly contrastColor: string;
  readonly id: VoteSourceId;
  readonly label: VoteMatrixRow["source"];
}

export const voteOutcomes: readonly VoteOutcome[] = [
  {
    color: "var(--mui-palette-secondary-main)",
    contrastColor: "var(--mui-palette-secondary-contrastText)",
    key: "for",
    label: "For",
  },
  {
    color: "var(--mui-palette-primary-main)",
    contrastColor: "var(--mui-palette-primary-contrastText)",
    key: "against",
    label: "Against",
  },
  {
    color: "var(--mui-palette-chartSeries-7-main)",
    contrastColor: "var(--mui-palette-chartSeries-7-contrastText)",
    key: "withhold",
    label: "Withhold",
  },
  {
    color: "var(--mui-palette-warning-main)",
    contrastColor: "var(--mui-palette-warning-contrastText)",
    key: "abstain",
    label: "Abstain",
  },
];

export const voteSources: readonly VoteSource[] = [
  {
    color: "var(--mui-palette-chartSeries-4-main)",
    contrastColor: "var(--mui-palette-chartSeries-4-contrastText)",
    id: "web",
    label: "Web",
  },
  {
    color: "var(--mui-palette-chartSeries-2-main)",
    contrastColor: "var(--mui-palette-chartSeries-2-contrastText)",
    id: "print",
    label: "Print",
  },
  {
    color: "var(--mui-palette-chartSeries-6-main)",
    contrastColor: "var(--mui-palette-chartSeries-6-contrastText)",
    id: "ivr",
    label: "IVR",
  },
];

export const holderTypes = ["Registered", "Beneficial"] as const;

export const holderStyles: Record<
  HolderType,
  { readonly color: string; readonly contrastColor: string }
> = {
  Beneficial: {
    color: "var(--mui-palette-chartSeries-2-main)",
    contrastColor: "var(--mui-palette-chartSeries-2-contrastText)",
  },
  Registered: {
    color: "var(--mui-palette-chartSeries-0-main)",
    contrastColor: "var(--mui-palette-chartSeries-0-contrastText)",
  },
};

export const minimumOutcomeShare = 0.035;

export const sumRowOutcomes = (row: VoteMatrixRow): number =>
  row.for + row.against + row.withhold + row.abstain;

// --- Voting-source chart -----------------------------------------------------
// Geometry and colour rules shared by the chart, its bar patterns, its legend
// swatches and the totals overlay, so the pieces cannot drift apart.

/** SVG <pattern> id for one source, namespaced by the caller's unique prefix. */
export const getSourcePatternId = (
  prefix: string,
  sourceId: VoteSourceId
): string => `${prefix}-${sourceId}`;

/**
 * How much of the contrast colour survives in the hatch marks. At 100% the
 * pattern is pure white or pure black against the bar, which reads as harsh;
 * mixing the bar colour back in keeps the texture legible without the hard
 * edge. Raise for more definition, lower for a subtler weave.
 */
export const patternContrastMix = 45;

/** Hatch colour for a pattern drawn on top of `source.color`. */
export const getPatternForeground = (source: VoteSource): string =>
  `color-mix(in srgb, ${source.contrastColor} ${patternContrastMix}%, ${source.color})`;

/** Tile size for the bar patterns and their legend swatches. */
export const patternTileSize = 6;

/** Edge length of a legend swatch. */
export const legendSwatchSize = 20;

/** Gap between a bar total and the bar end, whether it sits inside or outside. */
export const barLabelInset = 8;

/** Plot height for the voting-source bar chart. */
export const votingSourceChartHeight = 340;
