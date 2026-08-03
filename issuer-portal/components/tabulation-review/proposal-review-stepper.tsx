"use client";

import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";

import type {
  ChecklistState,
  ProposalRow,
  ReviewSaveOutcome,
} from "@/hooks/use-tabulation-report-review";

import { useProposalReviewStepper } from "@/hooks/use-proposal-review-stepper";

import { ChecklistSection } from "./checklist-section";
import { ProposalClassificationSentence } from "./proposal-classification-sentence";
import { ProposalTotalsSentence } from "./proposal-totals-sentence";

interface ProposalReviewStepperProps {
  readonly allChecked: boolean;
  readonly checklist: ChecklistState;
  readonly dirtyCount: number;
  readonly isFinalReport: boolean;
  readonly loading: boolean;
  readonly onRequestVerify: () => void;
  readonly onRowUpdate: (newRow: ProposalRow, oldRow: ProposalRow) => ProposalRow;
  readonly onSaveAdjustments: () => void;
  readonly onToggleChecklist: (key: keyof ChecklistState, checked: boolean) => void;
  readonly originalRows: ProposalRow[];
  readonly rows: ProposalRow[];
  readonly saveOutcome: ReviewSaveOutcome;
  readonly saving: boolean;
  readonly verified: boolean;
}

/** Renders the CSM's three-step proposal review and verification workflow. */
export const ProposalReviewStepper = ({
  allChecked,
  checklist,
  dirtyCount,
  isFinalReport,
  loading,
  onRequestVerify,
  onRowUpdate,
  onSaveAdjustments,
  onToggleChecklist,
  originalRows,
  rows,
  saveOutcome,
  saving,
  verified,
}: ProposalReviewStepperProps) => {
  const {
    activeStep,
    goToClassification,
    goToTotals,
    goToVerification,
    nonRoutineCount,
    originalRowsById,
    routineCount,
  } = useProposalReviewStepper(rows, originalRows);

  return (
    <Box>
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        sx={{ mb: 1, px: 2 }}
      >
        <Typography variant="subtitle2">Proposals & vote totals</Typography>
        <Stack direction="row" spacing={1}>
          <Chip color="info" label={`${routineCount} routine`} size="small" variant="outlined" />
          <Chip
            color="warning"
            label={`${nonRoutineCount} non-routine`}
            size="small"
            variant="outlined"
          />
          {dirtyCount > 0 ? (
            <Chip
              color="secondary"
              label={`${dirtyCount} unsaved edit${dirtyCount === 1 ? "" : "s"}`}
              size="small"
            />
          ) : null}
        </Stack>
      </Stack>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step>
          <StepLabel
            optional={
              dirtyCount > 0 ? (
                <Typography color="warning.main" variant="caption">
                  {dirtyCount} unsaved edit{dirtyCount === 1 ? "" : "s"}
                </Typography>
              ) : null
            }
          >
            Review vote totals
          </StepLabel>
          <StepContent slotProps={{ transition: { unmountOnExit: false } }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={2}>
                {rows.map((row) => (
                  <ProposalTotalsSentence
                    disabled={verified}
                    key={row.id}
                    onRowUpdate={onRowUpdate}
                    original={originalRowsById.get(row.id)}
                    row={row}
                  />
                ))}
              </Stack>
            )}
            <Box sx={{ mt: 2 }}>
              <Button onClick={goToClassification} variant="contained">
                Continue
              </Button>
            </Box>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>{`${routineCount} routine - ${nonRoutineCount} non-routine`}</StepLabel>
          <StepContent slotProps={{ transition: { unmountOnExit: false } }}>
            <Stack spacing={1.5}>
              {rows.map((row) => (
                <ProposalClassificationSentence
                  disabled={verified}
                  key={row.id}
                  onRowUpdate={onRowUpdate}
                  original={originalRowsById.get(row.id)}
                  row={row}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button onClick={goToTotals} variant="outlined">
                Back
              </Button>
              <Button onClick={goToVerification} variant="contained">
                Continue
              </Button>
            </Stack>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>Verify and sign off</StepLabel>
          <StepContent slotProps={{ transition: { unmountOnExit: false } }}>
            <ChecklistSection
              checklist={checklist}
              disabled={verified}
              onToggle={onToggleChecklist}
            />
            <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 2 }}>
              <Button onClick={goToClassification} variant="outlined">
                Back
              </Button>
              {!verified ? (
                <>
                  <Button
                    color={saveOutcome === "saved" ? "inherit" : "primary"}
                    disabled={saving}
                    onClick={onSaveAdjustments}
                    startIcon={
                      saveOutcome === "saved" ? <CheckCircleIcon fontSize="small" /> : undefined
                    }
                    variant="contained"
                  >
                    {saving ? "Saving..." : saveOutcome === "saved" ? "Saved" : "Save adjustments"}
                  </Button>
                  <Button
                    color={allChecked ? "success" : "inherit"}
                    disabled={saving || !allChecked}
                    onClick={onRequestVerify}
                    variant="contained"
                  >
                    {isFinalReport ? "Verify & sign off" : "Verify report"}
                  </Button>
                </>
              ) : null}
            </Stack>
          </StepContent>
        </Step>
      </Stepper>
    </Box>
  );
};
