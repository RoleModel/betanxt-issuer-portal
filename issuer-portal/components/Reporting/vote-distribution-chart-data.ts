/**
 * Config for the Vote Distribution donut.
 *
 * The chart is two concentric rings: account type on the inside, voted vs not
 * voted on the outside. Both dimensions are toggled from the legend, so the
 * ids, labels and colours all live here rather than being split between the
 * chart and whatever builds its data.
 */

export type AccountTypeId = "dtc" | "non-dtc";
export type VoteStatusId = "unvoted" | "voted";

/** Slice ids used by the upstream distribution data, e.g. `dtc-voted`. */
export type VoteDistributionSliceId = `${AccountTypeId}-${VoteStatusId}`;

export interface AccountType {
  readonly color: string;
  /**
   * Foreground for arc labels drawn on this account's slices - the inner ring
   * and both of its outer segments. The `light` shade of each account colour
   * stays on the same side of the light/dark line as its `main`, so one
   * contrast value covers both rings and MUI exposes no `lightContrastText`.
   */
  readonly contrastColor: string;
  readonly id: AccountTypeId;
  readonly label: string;
}

/**
 * Washed-out variant for the "Not Voted" arcs. Each account needs three
 * distinct steps — inner ring, voted, not voted — and the palette only ships
 * two tones per hue family, so the third is derived. 55% white lands far
 * enough from the base to read as a separate segment while staying light
 * enough for dark label text.
 */
const lighten = (color: string): string =>
  `color-mix(in srgb, ${color} 45%, #fff)`;

/**
 * Label colours are the measured WCAG choice for each fill, not the palette's
 * own `contrastText`. Those tokens are not all AA: chartSeries-5 (#eb6333)
 * declares #fff, which is 3.30:1 and fails, where black is 6.36:1. Ratios
 * against white / black, measured from the rendered fills:
 *
 *   #053f5a  11.26 / 1.87   -> white
 *   #117dac   4.61 / 4.55   -> white (both marginal; white is the better half)
 *   #cc5d00   4.09 / 5.13   -> dark
 *   #eb6333   3.30 / 6.36   -> dark
 *   lightened 1.70-1.87 / 11.21-12.37 -> dark
 *
 * Re-measure if any fill changes.
 */
const onDark = "var(--mui-palette-common-white)";
const onLight = "var(--mui-palette-text-primary)";

export interface RingStyle {
  readonly color: string;
  readonly contrastColor: string;
}

export interface VoteStatus {
  readonly id: VoteStatusId;
  readonly label: string;
  /**
   * Fill and label colour per account type — the outer ring shades its parent
   * slice, and each chartSeries token carries its own contrastText, so the two
   * travel together.
   */
  readonly styleByAccountType: Readonly<Record<AccountTypeId, RingStyle>>;
}

/**
 * Teal for DTC/CDS, orange for Non-DTC: complementary, so the accounts stay
 * distinct, with a dark/light pair inside each so Voted and Not Voted separate
 * clearly. `primary`/`secondary` could not do this - their `light` variant is
 * a 20% white mix, too close to `main` to read as a different segment, and MUI
 * exposes no contrastText for it.
 */
/** Inner ring. Each account takes the same hue as its "Voted" segment. */
export const accountTypes: readonly AccountType[] = [
  {
    color: "var(--mui-palette-chartSeries-0-main)",
    contrastColor: onDark,
    id: "dtc",
    label: "DTC/CDS",
  },
  {
    color: "var(--mui-palette-chartSeries-3-main)",
    contrastColor: onLight,
    id: "non-dtc",
    label: "Non-DTC",
  },
];

export const voteStatuses: readonly VoteStatus[] = [
  {
    id: "voted",
    label: "Voted",
    styleByAccountType: {
      dtc: {
        color: "var(--mui-palette-chartSeries-4-main)",
        contrastColor: onDark,
      },
      "non-dtc": {
        color: "var(--mui-palette-chartSeries-5-main)",
        contrastColor: onLight,
      },
    },
  },
  {
    id: "unvoted",
    label: "Not Voted",
    styleByAccountType: {
      dtc: {
        color: lighten("var(--mui-palette-chartSeries-4-main)"),
        contrastColor: onLight,
      },
      "non-dtc": {
        color: lighten("var(--mui-palette-chartSeries-5-main)"),
        contrastColor: onLight,
      },
    },
  },
];

export const buildSliceId = (
  accountType: AccountTypeId,
  status: VoteStatusId
): VoteDistributionSliceId => `${accountType}-${status}`;

/**
 * Floor for an outer slice's share of its parent, so a near-zero segment stays
 * visible instead of collapsing to an invisible sliver. Matches the vote
 * breakdown donut.
 */
export const minimumStatusShare = 0.035;

/**
 * Where each ring's arc labels sit, measured from the centre. The inner ring
 * is a filled circle, so without this its labels land on top of the centre
 * total; pushing them outward keeps both readable.
 */
export const accountArcLabelRadius = 68;
export const statusArcLabelRadius = 110;

/**
 * Id of the invisible slice that holds the space left by hidden series.
 * Without it the remaining slices stretch to fill the circle, so a filtered
 * view reads as 100% no matter how little is actually selected.
 */
export const hiddenRemainderId = "__hidden-remainder";

/** Fill for that gap. Matches the quorum gauge's empty reference arc. */
export const hiddenRemainderColor = "var(--mui-palette-divider)";

/** Greyed ring shown when the legend has hidden everything. */
export const neutralRingColor = "var(--mui-palette-divider)";

/**
 * Every fill the donut can paint, mapped to the foreground its arc labels
 * should use. Built from the same definitions the rings are, so a colour
 * change cannot leave a label unreadable behind it.
 */
export const arcLabelContrastByColor: ReadonlyMap<string, string> = new Map([
  ...accountTypes.map((accountType): [string, string] => [
    accountType.color,
    accountType.contrastColor,
  ]),
  ...accountTypes.flatMap((accountType) =>
    voteStatuses.map((status): [string, string] => {
      const style = status.styleByAccountType[accountType.id];
      return [style.color, style.contrastColor];
    })
  ),
  [neutralRingColor, "var(--mui-palette-text-primary)"],
]);
