"use client";

import { CheckCircleOutline, Close as CloseIcon } from "@mui/icons-material";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

interface RevisionRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (revisionRequest: string) => Promise<void>;
  title?: string;
  description?: string;
}

const RevisionRequestDialog: React.FC<RevisionRequestDialogProps> = ({
  open,
  onClose,
  onSubmit,
  title = "Request Revision",
  description = "Please describe the revisions needed for this document hosting site.",
}) => {
  const [revisionText, setRevisionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSubmit = async () => {
    if (!revisionText.trim()) {
      setError("Please provide revision details.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(revisionText.trim());
      // Reset form on successful submission
      setRevisionText("");
      setShowSuccessToast(true);
      onClose();
    } catch (err) {
      console.error("Error submitting revision request:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit revision request"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRevisionText("");
      setError(null);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {title}
            <IconButton
              onClick={handleClose}
              disabled={loading}
              size="small"
              sx={{ color: "text.secondary" }}
            >
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body3" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>

          <TextField
            fullWidth
            label="Revision Details"
            multiline
            rows={4}
            value={revisionText}
            onChange={(e) => setRevisionText(e.target.value)}
            placeholder="Please describe the specific revisions needed..."
            variant="outlined"
            disabled={loading}
            error={!!error}
            helperText={error}
            sx={{ mb: 2 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !revisionText.trim()}
            variant="contained"
            color="primary"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccessToast}
        autoHideDuration={6000}
        onClose={() => setShowSuccessToast(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccessToast(false)}
          severity="success"
          icon={<CheckCircleOutline />}
          sx={{ width: "100%" }}
        >
          We received your revision request and will review it promptly. You
          will be notified once the updates are complete.
        </Alert>
      </Snackbar>
    </>
  );
};

export default RevisionRequestDialog;
