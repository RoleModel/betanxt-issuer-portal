"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface VerifyConfirmDialogProps {
  readonly isFinalReport: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly open: boolean;
  readonly saving: boolean;
}

/** Confirms the CSM's report verification or final business sign-off. */
export const VerifyConfirmDialog = ({
  isFinalReport,
  onCancel,
  onConfirm,
  open,
  saving,
}: VerifyConfirmDialogProps) => (
  <Dialog
    aria-labelledby="verify-report-title"
    fullWidth
    maxWidth="xs"
    onClose={onCancel}
    open={open}
  >
    <DialogTitle id="verify-report-title">
      {isFinalReport ? "Sign off on the final report?" : "Verify this report?"}
    </DialogTitle>
    <DialogContent>
      <DialogContentText>
        {isFinalReport
          ? "This is the business sign-off. The verified report is filed with the company, so confirm every number is accurate before signing off."
          : "This records that you have reviewed today's tabulation numbers for accuracy."}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button disabled={saving} onClick={onCancel} variant="outlined">
        Cancel
      </Button>
      <Button disabled={saving} onClick={onConfirm} variant="contained">
        {saving ? "Saving..." : isFinalReport ? "Sign off" : "Verify"}
      </Button>
    </DialogActions>
  </Dialog>
);
