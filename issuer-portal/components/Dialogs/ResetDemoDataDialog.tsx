import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import React from "react";

import { useResetDemoData } from "@/hooks/useResetDemoData";

interface ResetDemoDataDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export const ResetDemoDataDialog = ({
  open,
  onClose,
}: ResetDemoDataDialogProps) => {
  const { resetDemoData, isResetting, error } = useResetDemoData();

  const handleConfirm = async () => {
    await resetDemoData();
  };

  return (
    <Dialog
      open={open}
      onClose={isResetting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Reset</DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <Typography variant="body1" gutterBottom>
          This will reset all meeting data.
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 2, fontWeight: "bold", color: "warning.main" }}
        >
          This action cannot be undone. The page will reload after reset.
          Continue?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isResetting} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={isResetting}
        >
          {isResetting ? "Resetting..." : "Reset"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
