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
  { color: "var(--mui-palette-primary-main)", id: "dtc", label: "DTC/CDS" },
  {
    color: "var(--mui-palette-secondary-main)",
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

/** Greyed ring shown when the legend has hidden everything. */
export const neutralRingColor = "var(--mui-palette-action-disabledBackground)";
