/* eslint-disable @typescript-eslint/naming-convention */
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
    color: "var(--mui-palette-statusPending-contrastText)",
    label: "Preparing for Mailing",
    paletteVar: "var(--mui-palette-statusPending-main)",
  },
  {
    color: "var(--mui-palette-statusProofing-contrastText)",
    label: "Proofing & Approval",
    paletteVar: "var(--mui-palette-statusProofing-main)",
  },
  {
    color: "var(--mui-palette-statusProduction-contrastText)",
    label: "Mailing In Progress",
    paletteVar: "var(--mui-palette-statusProduction-main)",
  },
  {
    color: "var(--mui-palette-statusComplete-contrastText)",
    label: "Mailing Completed",
    paletteVar: "var(--mui-palette-statusComplete-main)",
  },
];

export const formatMailingStatusDate = (statusDate: string | null | undefined): string | null =>
  statusDate
    ? parseLocalDate(statusDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
