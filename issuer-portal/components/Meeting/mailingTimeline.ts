import { parseLocalDate } from "@/utils/dateUtils";

export type MailingStatus =
  | "Preparing for Mailing"
  | "Proofing & Approval"
  | "Mailing In Progress"
  | "Mailing Completed";

export interface WorkflowStep {
  readonly label: MailingStatus;
  readonly paletteVar: string;
  readonly color?: string;
}

export const WORKFLOW_STEPS: readonly WorkflowStep[] = [
  {
    label: "Preparing for Mailing",
    paletteVar: "var(--mui-palette-statusPending-main)",
    color: "var(--mui-palette-statusPending-contrastText)",
  },
  {
    label: "Proofing & Approval",
    paletteVar: "var(--mui-palette-statusProofing-main)",
    color: "var(--mui-palette-statusProofing-contrastText)",
  },
  {
    label: "Mailing In Progress",
    paletteVar: "var(--mui-palette-statusProduction-main)",
    color: "var(--mui-palette-statusProduction-contrastText)",
  },
  {
    label: "Mailing Completed",
    paletteVar: "var(--mui-palette-statusComplete-main)",
    color: "var(--mui-palette-statusComplete-contrastText)",
  },
];

export const formatMailingStatusDate = (
  statusDate: string | null | undefined
): string | null =>
  statusDate
    ? parseLocalDate(statusDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
