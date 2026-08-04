"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import React, { useState } from "react";

interface ScheduleDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSchedule: (date: Date, notes?: string) => void;
  readonly title: string;
  readonly description: string;
}

const ScheduleDialog = ({
  open,
  onClose,
  onSchedule,
  title,
  description,
}: ScheduleDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");

  const handleSchedule = () => {
    if (selectedDate) {
      onSchedule(selectedDate, notes);
      setSelectedDate(null);
      setNotes("");
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedDate(null);
    setNotes("");
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <DateTimePicker
              label="Select Date and Time"
              value={selectedDate}
              onChange={(newValue) => {
                setSelectedDate(newValue);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
            <TextField
              label="Notes (Optional)"
              multiline
              rows={4}
              fullWidth
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
              }}
              placeholder={description}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            variant="contained"
            disabled={!selectedDate}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ScheduleDialog;
