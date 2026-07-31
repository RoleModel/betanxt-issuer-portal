"use client";

import type { FileRejection } from "react-dropzone";

import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useCallback, useState } from "react";

import type { Document, Task } from "@/types/api-exports";
import type { TaskLink as BaseTaskLink } from "@/utils/taskLinks";

import BNFileDropzone from "@/components/FileUpload/BNFileDropzone";
import { useDocuments } from "@/hooks/useDocuments";
import { useTasks } from "@/hooks/useTasks";
import { getStoragePublicUrl } from "@/utils/documentUtils";

// Task status type - matches the status options used in the component
type TaskStatus =
  | "Complete"
  | "Shares Balanced"
  | "Mailing Complete"
  | "Ordered"
  | "Authorized"
  | "Approved to Send"
  | "Approved"
  | "Submitted"
  | "Active"
  | "Received"
  | "Reached"
  | "Pending Approval"
  | "Pending"
  | "Delayed"
  | "Awaiting Review"
  | "Pending Client Review"
  | "Making Revisions"
  | "3 of 5 Materials Uploaded"
  | "Shares Imbalanced"
  | "Access Needed"
  | "Needs Authorization"
  | "New"
  | "Mailing"
  | "In Edit Process"
  | "Request form to follow"
  | "In Progress"
  | "Incomplete"
  | "Awaiting Materials"
  | "Awaiting Draft"
  | "Awaiting Form"
  | "Not Uploaded"
  | "Draft"
  | "No"
  | "N/A";

type TaskType = "upload" | "signature" | "external" | "authorize" | "approve";
type LinkAction = "download" | "upload" | "sign" | "authorize" | "external";

// File rejection error type from react-dropzone
interface FileRejectionError {
  code: string;
  message: string;
}

interface TaskLink extends BaseTaskLink {
  id?: string; // Add id field for editing purposes
}

interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  type: TaskType | "";
  phase: number;
  due_date: string;
  assignee: string;
}

interface TaskEditDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly task: Task | null;
  readonly onTaskUpdated: (updatedTask: Task) => void;
  readonly onRefresh?: () => void;
  readonly enableLinkEditing?: boolean;
}

const statusOptions: TaskStatus[] = [
  // Positive/Success statuses (green)
  "Complete",
  "Shares Balanced",
  "Mailing Complete",
  "Ordered",
  "Authorized",
  "Approved to Send",
  "Approved",
  "Submitted",
  "Active",
  "Received",
  "Reached",
  // Warning/Pending statuses (yellow/orange)
  "Pending Approval",
  "Pending",
  "Delayed",
  "Awaiting Review",
  "Pending Client Review",
  "Making Revisions",
  "3 of 5 Materials Uploaded",
  // Error/Action needed statuses (red)
  "Shares Imbalanced",
  "Access Needed",
  "Needs Authorization",
  // Info/In Progress statuses (blue)
  "New",
  "Mailing",
  "In Edit Process",
  "Request form to follow",
  "In Progress",
  // Neutral/Default statuses (grey)
  "Incomplete",
  "Awaiting Materials",
  "Awaiting Draft",
  "Awaiting Form",
  "Not Uploaded",
  "Draft",
  "No",
  "N/A",
];

const typeOptions: TaskType[] = [
  "upload",
  "signature",
  "external",
  "authorize",
  "approve",
];

const actionOptions: LinkAction[] = [
  "download",
  "upload",
  "sign",
  "authorize",
  "external",
];

// Helper function to convert display date to YYYY-MM-DD format
const convertToDbDate = (displayDate: string): string => {
  if (!displayDate) return "";

  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) {
    return displayDate;
  }

  // Convert from "Sep 10" or similar format to YYYY-MM-DD
  try {
    const currentYear = new Date().getFullYear();
    const date = new Date(`${displayDate}, ${currentYear}`);
    if (isNaN(date.getTime())) return "";

    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

// Derive the initial form values directly from the task prop. Called from a
// lazy useState initializer so the values are computed once per mount.
const computeInitialFormData = (task: Task): TaskFormData => ({
  title: task.title ?? "",
  description: task.description ?? "",
  status: (task.status as TaskStatus) || "Incomplete",
  type: (task.type as TaskType) || "",
  phase: task.phaseNumber || 1,
  due_date: convertToDbDate(task.dueDate ?? ""),
  assignee: task.owner ?? "",
});

const computeInitialLinks = (
  task: Task,
  enableLinkEditing: boolean
): TaskLink[] => {
  if (!enableLinkEditing || !task.links) return [];

  // Convert links object to array if needed
  const linksArray = Array.isArray(task.links)
    ? task.links
    : Object.values(task.links);

  if (!Array.isArray(linksArray) || linksArray.length === 0) return [];

  return (linksArray as BaseTaskLink[]).map((link, index) => ({
    id: `link-${index}`, // Generate a stable ID for editing
    label: link.label,
    url: link.url ?? "",
    action: link.action as LinkAction,
  }));
};

const computeInitialDocumentId = (task: Task): string => {
  if ("document" in task) {
    return String(task.document) || "";
  }
  return "";
};

export const TaskEditDialog: React.FC<TaskEditDialogProps> = ({
  open,
  onClose,
  task,
  onTaskUpdated,
  onRefresh,
  enableLinkEditing = false,
}) => {
  if (!task) return null;

  // The form state is initialized from `task` via lazy useState in
  // TaskEditForm. Keying by task.id (and unmounting on close, since
  // keepMounted is false) resets that state when the task changes, so no
  // prop-syncing effects are needed.
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      keepMounted={false}
    >
      <TaskEditForm
        key={task.id}
        task={task}
        onClose={onClose}
        onTaskUpdated={onTaskUpdated}
        onRefresh={onRefresh}
        enableLinkEditing={enableLinkEditing}
      />
    </Dialog>
  );
};

interface TaskEditFormProps {
  readonly task: Task;
  readonly onClose: () => void;
  readonly onTaskUpdated: (updatedTask: Task) => void;
  readonly onRefresh?: () => void;
  readonly enableLinkEditing: boolean;
}

const TaskEditForm: React.FC<TaskEditFormProps> = ({
  task,
  onClose,
  onTaskUpdated,
  onRefresh,
  enableLinkEditing,
}) => {
  // Use our hooks instead of direct Supabase calls
  const { updateTaskById } = useTasks();
  const { createNewDocument } = useDocuments();

  const [formData, setFormData] = useState<TaskFormData>(() =>
    computeInitialFormData(task)
  );
  const [links, setLinks] = useState<TaskLink[]>(() =>
    computeInitialLinks(task, enableLinkEditing)
  );

  // Document management state - using document masters (templates)
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(() =>
    computeInitialDocumentId(task)
  );
  const [uploadingFile, setUploadingFile] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available document masters (templates) - now using API
  const loadAvailableDocuments = useCallback(() => {
    try {
      // TODO: Implement document masters API endpoint
      // For now, just return empty array to avoid Supabase dependency
      setAvailableDocuments([]);
    } catch {
      setError("Failed to load document templates");
    }
  }, []);

  const handleChange =
    (field: keyof TaskFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  // Link management functions
  const handleAddLink = useCallback(() => {
    setLinks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", url: "", action: "external" },
    ]);
  }, []);

  const handleRemoveLink = useCallback((index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleLinkChange = useCallback(
    (index: number, field: keyof TaskLink, value: string) => {
      setLinks((prev) =>
        prev.map((link, i) =>
          i === index ? { ...link, [field]: value } : link
        )
      );
    },
    []
  );

  // Handle file upload with BNFileDropzone
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const file = files[0]; // Only handle one file for signature tasks
      if (!file) return;

      setUploadingFile(true);
      setError(null);

      try {
        // Get meeting ID for document creation
        const meetingId = task.meetingId ?? "extraordinary-2023"; // fallback

        // Create document using our hook instead of direct Supabase
        const documentData = {
          title: file.name.replace(/\.[^/.]+$/, ""),
          description: `Uploaded document for task: ${task.title}`,
          type: "signature",
          file: file.name, // Using filename as file identifier
        };

        const newDocument = await createNewDocument(meetingId, documentData);
        if (!newDocument) {
          throw new Error("Failed to create document");
        }

        // Refresh available documents and select the new one
        loadAvailableDocuments();
        if (newDocument.id) {
          setSelectedDocumentId(newDocument.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload file");
      } finally {
        setUploadingFile(false);
      }
    },
    [task, loadAvailableDocuments, createNewDocument]
  );

  // Handle file upload rejections
  const handleFileRejections = useCallback(
    (fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (
          rejection.errors?.some(
            (e: FileRejectionError) => e.code === "file-too-large"
          )
        ) {
          setError("File is too large. Please upload a file smaller than 5MB.");
        } else if (
          rejection.errors?.some(
            (e: FileRejectionError) => e.code === "file-invalid-type"
          )
        ) {
          setError("Invalid file type. Please upload a PDF file.");
        } else {
          setError("File upload failed. Please try again.");
        }
      }
    },
    []
  );

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare comprehensive task updates
      const taskUpdates: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        type: formData.type || null,
        phaseNumber: formData.phase,
        dueDate: formData.due_date || null,
        assignee: formData.assignee || null,
        document: selectedDocumentId || null,
      };

      // Add links if link editing is enabled
      if (enableLinkEditing) {
        // Filter and process links for saving in a single pass
        const processedLinks = links.reduce<
          {
            label: string;
            url: string | undefined;
            action: string | undefined;
          }[]
        >((acc, link) => {
          if (link.label.trim()) {
            // Only save links with labels
            acc.push({
              label: link.label,
              url: link.url || undefined,
              action: link.action || undefined,
            });
          }
          return acc;
        }, []);
        taskUpdates.links = processedLinks;
      }

      // Update using hook
      if (task.id) {
        await updateTaskById(task.id, taskUpdates);
      }

      // Note: Meeting completion update would be handled automatically by the context

      // Create updated task object for callback
      const finalTask = {
        ...task,
        ...taskUpdates,
        id: task.id,
      };

      onTaskUpdated(finalTask);
      if (onRefresh) onRefresh(); // Refresh the parent component data
      onClose();
    } catch (err) {
      let errorMessage = "Failed to update task";
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof err.message === "string"
      ) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          Edit Task
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Task Title"
            size="small"
            value={formData.title}
            onChange={handleChange("title")}
            margin="normal"
            required
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Description"
            size="small"
            value={formData.description}
            onChange={handleChange("description")}
            margin="normal"
            multiline
            rows={3}
            variant="outlined"
          />

          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              select
              label="Status"
              size="small"
              value={formData.status}
              onChange={handleChange("status")}
              variant="outlined"
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              select
              label="Type"
              size="small"
              value={formData.type}
              onChange={handleChange("type")}
              variant="outlined"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {typeOptions.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              select
              label="Phase"
              size="small"
              value={formData.phase}
              onChange={handleChange("phase")}
              variant="outlined"
              required
            >
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
            </TextField>
          </Box>

          <Box display="flex" gap={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Due Date"
              size="small"
              type="date"
              value={formData.due_date}
              onChange={handleChange("due_date")}
              variant="outlined"
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              fullWidth
              label="Assignee"
              size="small"
              value={formData.assignee}
              onChange={handleChange("assignee")}
              variant="outlined"
            />
          </Box>

          {/* Document Management Section - Only show for signature tasks */}
          {formData.type === "signature" && (
            <DocumentSection
              availableDocuments={availableDocuments}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={setSelectedDocumentId}
              uploadingFile={uploadingFile}
              onFilesSelected={handleFilesSelected}
              onFileRejections={handleFileRejections}
            />
          )}

          {/* Conditional Link Editing Section */}
          {enableLinkEditing ? (
            <LinksSection
              links={links}
              onAddLink={handleAddLink}
              onRemoveLink={handleRemoveLink}
              onLinkChange={handleLinkChange}
            />
          ) : null}

          {error ? (
            <Typography
              color="error"
              variant="body3"
              sx={{ mt: 2, p: 1, background: "error.light", borderRadius: 1 }}
            >
              {error}
            </Typography>
          ) : null}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !formData.title.trim()}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </>
  );
};

interface DocumentSectionProps {
  readonly availableDocuments: Document[];
  readonly selectedDocumentId: string;
  readonly onSelectDocument: (id: string) => void;
  readonly uploadingFile: boolean;
  readonly onFilesSelected: (files: File[]) => void;
  readonly onFileRejections: (fileRejections: FileRejection[]) => void;
}

const DocumentSection: React.FC<DocumentSectionProps> = ({
  availableDocuments,
  selectedDocumentId,
  onSelectDocument,
  uploadingFile,
  onFilesSelected,
  onFileRejections,
}) => {
  const selectedDoc = selectedDocumentId
    ? availableDocuments.find((d) => d.id === selectedDocumentId)
    : undefined;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="h6"
        sx={{ fontSize: "16px", fontWeight: 500, mb: 2 }}
      >
        Document
      </Typography>

      {/* Current Document Selection */}
      <TextField
        fullWidth
        select
        label="Select Document"
        size="small"
        value={selectedDocumentId}
        onChange={(e) => {
          onSelectDocument(e.target.value);
        }}
        variant="outlined"
        sx={{ mb: 2 }}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {availableDocuments.map((doc) => (
          <MenuItem key={doc.id} value={doc.id}>
            <Box>
              <Typography variant="body3">{doc.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {doc.filePath ?? "N/A"} • {doc.type}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </TextField>

      {/* Current Document Info */}
      {selectedDoc ? (
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body3">
              <strong>{selectedDoc.title}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              File: {selectedDoc.filePath ?? "N/A"} • Type: {selectedDoc.type}
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              Storage URL:{" "}
              {selectedDoc.filePath
                ? getStoragePublicUrl(selectedDoc.filePath)
                : "No file path"}
            </Typography>
          </Alert>
        </Box>
      ) : null}

      {/* Upload New Document */}
      <Typography variant="body3" color="text.secondary" sx={{ mb: 1 }}>
        Or upload a new document:
      </Typography>

      <Box sx={{ height: 120 }}>
        <BNFileDropzone
          onFilesSelected={onFilesSelected}
          onFileRejections={onFileRejections}
          maxFiles={1}
          multiple={false}
          acceptedFileTypes={[".pdf"]}
          disabled={uploadingFile}
          linkText={uploadingFile ? "Uploading..." : "Upload PDF"}
        />
      </Box>
    </Box>
  );
};

interface LinksSectionProps {
  readonly links: TaskLink[];
  readonly onAddLink: () => void;
  readonly onRemoveLink: (index: number) => void;
  readonly onLinkChange: (
    index: number,
    field: keyof TaskLink,
    value: string
  ) => void;
}

const LinksSection: React.FC<LinksSectionProps> = ({
  links,
  onAddLink,
  onRemoveLink,
  onLinkChange,
}) => {
  return (
    <Box sx={{ mt: 3 }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 500 }}>
          Links
        </Typography>
        <Button startIcon={<AddIcon />} onClick={onAddLink} variant="text">
          Add Link
        </Button>
      </Box>

      {links.length === 0 ? (
        <Typography variant="body3" color="text.secondary">
          No links added yet
        </Typography>
      ) : (
        <Stack spacing={2}>
          {links.map((link, index) => (
            <Card key={link.id} variant="outlined">
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box display="flex" alignItems="flex-start" gap={1}>
                  <Box flex={1}>
                    <Box display="flex" gap={2} sx={{ mb: 2 }}>
                      <TextField
                        label="Link Label"
                        value={link.label}
                        onChange={(e) => {
                          onLinkChange(index, "label", e.target.value);
                        }}
                        size="small"
                        fullWidth
                        required
                      />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id="action-label">Action</InputLabel>
                        <Select
                          labelId="action-label"
                          size="small"
                          value={link.action ?? ""}
                          label="Action"
                          onChange={(e) => {
                            onLinkChange(index, "action", e.target.value);
                          }}
                        >
                          {actionOptions.map((action) => (
                            <MenuItem key={action} value={action}>
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <TextField
                      label="URL (optional)"
                      value={link.url ?? ""}
                      onChange={(e) => {
                        onLinkChange(index, "url", e.target.value);
                      }}
                      size="small"
                      fullWidth
                      placeholder="https://..."
                    />
                  </Box>
                  <IconButton
                    onClick={() => {
                      onRemoveLink(index);
                    }}
                    size="small"
                    color="error"
                    sx={{ mt: 0.5 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default TaskEditDialog;
