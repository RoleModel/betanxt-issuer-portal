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

export type MailingTimelineDates = Record<MailingStatus, string | null>;

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

export const hasNonEmptyString = (
  value: string | null | undefined
): value is string => value !== null && value !== undefined && value.length > 0;

/**
 * The API models `mailingStatus` as a plain string, so it has to be validated
 * against the workflow before it can be treated as a `MailingStatus`.
 */
export const isMailingStatus = (
  value: string | null | undefined
): value is MailingStatus =>
  WORKFLOW_STEPS.some((step) => step.label === value);

/** Narrows an API-supplied status, discarding values outside the workflow. */
export const toMailingStatus = (
  value: string | null | undefined
): MailingStatus | null => (isMailingStatus(value) ? value : null);

export const formatMailingStatusDate = (
  statusDate: string | null | undefined
): string | null =>
  hasNonEmptyString(statusDate)
    ? parseLocalDate(statusDate).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
