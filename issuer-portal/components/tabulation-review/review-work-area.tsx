"use client";

import { Alert, Card, CardContent, CardHeader, Chip, Stack } from "@mui/material";

import type {
  ChecklistState,
  ProposalRow,
  ReviewSaveOutcome,
} from "@/hooks/use-tabulation-report-review";
import type { ReviewQueueItem } from "@/hooks/use-tabulation-review-queue";

import { parseLocalDate } from "@/utils/dateUtils";

import { ProposalReviewStepper } from "./proposal-review-stepper";
import { VerifiedBanner } from "./verified-banner";
import { VerifyConfirmDialog } from "./verify-confirm-dialog";

const formatMeetingDate = (dateString: string): string =>
  parseLocalDate(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

interface ReviewWorkAreaProps {
  readonly allChecked: boolean;
  readonly checklist: ChecklistState;
  readonly confirmOpen: boolean;
  readonly dirtyCount: number;
  readonly isFinalReport: boolean;
  readonly item: ReviewQueueItem;
  readonly onCancelConfirm: () => void;
  readonly onConfirmVerify: () => void;
  readonly onReopen: () => void;
  readonly onRequestVerify: () => void;
  readonly onRowUpdate: (newRow: ProposalRow, oldRow: ProposalRow) => ProposalRow;
  readonly onSaveAdjustments: () => void;
  readonly onToggleChecklist: (key: keyof ChecklistState, checked: boolean) => void;
  readonly originalRows: ProposalRow[];
  readonly proposalsLoading: boolean;
  readonly rows: ProposalRow[];
  readonly saveOutcome: ReviewSaveOutcome;
  readonly saving: boolean;
}

/**
 * Presentational surface for one report. Editing state and persistence are
 * supplied by the tabulation review hooks.
 */
export const ReviewWorkArea = ({
  allChecked,
  checklist,
  confirmOpen,
  dirtyCount,
  isFinalReport,
  item,
  onCancelConfirm,
  onConfirmVerify,
  onReopen,
  onRequestVerify,
  onRowUpdate,
  onSaveAdjustments,
  onToggleChecklist,
  originalRows,
  proposalsLoading,
  rows,
  saveOutcome,
  saving,
}: ReviewWorkAreaProps) => (
  <Card sx={{ display: "flex", flexDirection: "column", height: "fit-content" }}>
    <CardHeader
      title={item.companyName + " - " + item.meetingTitle}
      subheader={`Meeting ${formatMeetingDate(item.meetingDate)} - Set Key ${item.setKey ?? "-"} - CUSIP ${item.cusip}`}
      action={
        <Chip
          color={isFinalReport ? "error" : "info"}
          label={isFinalReport ? "Final report - business sign-off" : "First report QC"}
          variant="outlined"
        />
      }
      sx={{
        "& .MuiCardHeader-action": {
          alignSelf: "flex-start",
          ml: { xs: 0, sm: 2 },
          mt: { xs: 1, sm: 0 },
        },
        "& .MuiCardHeader-content": {
          minWidth: 0,
        },
        alignItems: "flex-start",
        flexDirection: { xs: "column", sm: "row" },
      }}
    />
    <CardContent>
      <Stack spacing={3}>
        {item.verified ? <VerifiedBanner item={item} onReopen={onReopen} saving={saving} /> : null}

        <ProposalReviewStepper
          allChecked={allChecked}
          checklist={checklist}
          dirtyCount={dirtyCount}
          isFinalReport={isFinalReport}
          loading={proposalsLoading}
          onRequestVerify={onRequestVerify}
          onRowUpdate={onRowUpdate}
          onSaveAdjustments={onSaveAdjustments}
          onToggleChecklist={onToggleChecklist}
          originalRows={originalRows}
          rows={rows}
          saveOutcome={saveOutcome}
          saving={saving}
          verified={item.verified}
        />

        {saveOutcome === "error" ? (
          <Alert severity="error">Failed to save. Please try again.</Alert>
        ) : null}
      </Stack>
    </CardContent>
    <VerifyConfirmDialog
      isFinalReport={isFinalReport}
      onCancel={onCancelConfirm}
      onConfirm={onConfirmVerify}
      open={confirmOpen}
      saving={saving}
    />
  </Card>
);
