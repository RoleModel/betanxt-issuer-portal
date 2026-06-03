"use client";

import { Close as CloseIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import { useMeeting } from "@/contexts/MeetingContext";
import { useTasks } from "@/hooks/useTasks";

type TaskStatus =
  | "Need Authorization"
  | "Incomplete"
  | "Complete"
  | "In Progress"
  | "Request form to follow";
type TaskType = "upload" | "signature" | "external" | "authorize" | "approve";

interface TaskAddModalProps {
  open: boolean;
  activeMeeting?: { id: string; meetingDate?: string | null; title?: string };
  onClose: () => void;
  onTaskAdded: () => void;
}

const statusOptions: TaskStatus[] = [
  "Need Authorization",
  "Incomplete",
  "In Progress",
  "Complete",
  "Request form to follow",
];

const typeOptions: TaskType[] = ["upload", "signature", "external", "authorize", "approve"];

export const TaskAddModal: React.FC<TaskAddModalProps> = ({
  open,
  activeMeeting: activeMeetingProp,
  onClose,
  onTaskAdded,
}) => {
  // Get active meeting from context and tasks hook
  const { currentMeeting } = useMeeting();
  const { createNewTask } = useTasks();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Incomplete" as TaskStatus,
    type: "" as TaskType | "",
    due_date: "",
    assignee: "",
    phase: 1, // Default to phase 1
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: "",
        description: "",
        status: "Incomplete",
        type: "",
        due_date: "",
        assignee: "",
        phase: 1,
      });
      setError(null);
    }
  }, [open]);

  const handleChange =
    (field: keyof typeof formData) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | { target: { value: unknown } },
    ) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate a unique task_id
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Don't proceed if no active meeting
      const activeMeeting = activeMeetingProp || currentMeeting;
      if (!activeMeeting) {
        throw new Error("No active meeting selected");
      }

      // Use our hook instead of direct Supabase call
      await createNewTask(activeMeeting.id!, {
        taskId: taskId,
        phaseNumber: formData.phase,
        title: formData.title,
        description: formData.description || null,
        status: formData.status as "COMPLETE" | "INCOMPLETE" | "CANCELLED",
        type: formData.type,
        dueDate: formData.due_date || null,
        owner: formData.assignee ?? "BetaNXT",
      });

      // Update meeting completion after adding new task
      // Optionally trigger any meeting completion recalculation via API in the future

      onTaskAdded();
      onClose();
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      description: "",
      status: "Incomplete",
      type: "",
      due_date: "",
      assignee: "",
      phase: 1,
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          Add New Task
          <IconButton onClick={handleCancel} size="small" sx={{ color: "text.secondary" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Task Title"
            value={formData.title}
            onChange={handleChange("title")}
            margin="normal"
            required
            variant="outlined"
            autoFocus
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={handleChange("description")}
            margin="normal"
            multiline
            rows={3}
            variant="outlined"
          />

          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Phase</InputLabel>
              <Select value={formData.phase} label="Phase" onChange={handleChange("phase")}>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((phaseNumber) => (
                  <MenuItem key={phaseNumber} value={phaseNumber}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: `var(--mui-palette-phase-${phaseNumber - 1}-main)`,
                          flexShrink: 0,
                        }}
                      />
                      Phase {phaseNumber}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={formData.status} label="Status" onChange={handleChange("status")}>
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={formData.type} label="Type" onChange={handleChange("type")}>
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {typeOptions.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={handleChange("due_date")}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Assignee"
              value={formData.assignee}
              onChange={handleChange("assignee")}
              variant="outlined"
              placeholder="Enter assignee name"
            />
          </Box>

          {error && (
            <Typography
              color="error"
              variant="body3"
              sx={{ mt: 2, p: 1, background: "error.light", borderRadius: 1 }}
            >
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCancel} variant="outlined" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !formData.title.trim()}
        >
          {loading ? "Creating..." : "Create Task"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskAddModal;
