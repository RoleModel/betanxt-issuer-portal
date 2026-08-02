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
  { color: "var(--mui-palette-primary-main)", id: "web", label: "Web" },
  { color: "var(--mui-palette-secondary-main)", id: "print", label: "Print" },
  { color: "var(--mui-palette-chartSeries-6-main)", id: "ivr", label: "IVR" },
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
