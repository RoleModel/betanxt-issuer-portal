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

export interface VoteStatus {
  readonly id: VoteStatusId;
  readonly label: string;
  /** Ring colour per account type — the outer ring shades its parent slice. */
  readonly colorByAccountType: Readonly<Record<AccountTypeId, string>>;
}

export const accountTypes: readonly AccountType[] = [
  {
    color: "var(--mui-palette-primary-main)",
    contrastColor: "var(--mui-palette-primary-contrastText)",
    id: "dtc",
    label: "DTC/CDS",
  },
  {
    color: "var(--mui-palette-secondary-main)",
    contrastColor: "var(--mui-palette-secondary-contrastText)",
    id: "non-dtc",
    label: "Non-DTC",
  },
];

export const voteStatuses: readonly VoteStatus[] = [
  {
    colorByAccountType: {
      dtc: "var(--mui-palette-primary-main)",
      "non-dtc": "var(--mui-palette-secondary-main)",
    },
    id: "voted",
    label: "Voted",
  },
  {
    colorByAccountType: {
      dtc: "var(--mui-palette-primary-light)",
      "non-dtc": "var(--mui-palette-secondary-light)",
    },
    id: "unvoted",
    label: "Not Voted",
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

/** Greyed ring shown when the legend has hidden everything. */
export const neutralRingColor = "var(--mui-palette-action-disabledBackground)";

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
    voteStatuses.map((status): [string, string] => [
      status.colorByAccountType[accountType.id],
      accountType.contrastColor,
    ])
  ),
  [neutralRingColor, "var(--mui-palette-text-primary)"],
]);
