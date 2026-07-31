import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import React, { useRef, useState } from "react";

import type { DSMDocumentOption, UploadFile } from "./types";

import BNFileUpload from "./BNFileUpload";

const EMPTY_DSM_DOCUMENT_OPTIONS: DSMDocumentOption[] = [];

export interface FileUploadDialogField {
  readonly id: string;
  readonly label: string;
  readonly required?: boolean;
  readonly type?: "number" | "text";
}

interface FileUploadDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onUpload: (
    files: File[],
    associations?: Record<string, string>
  ) => Promise<unknown>;
  readonly onUploadSuccess?: () => void;
  readonly onUploadWithNotes?: (
    files: File[],
    associations?: Record<string, string>,
    description?: string
  ) => Promise<unknown>;
  readonly acceptedFileTypes?: string[];
  readonly dialogTitle?: string;
  readonly fields?: readonly FileUploadDialogField[];
  readonly fieldValues?: Readonly<Record<string, string>>;
  readonly maxFiles?: number;
  readonly meetingId?: string;
  readonly documentType?: string;
  readonly isDragging?: boolean;
  readonly dsmDocumentOptions?: DSMDocumentOption[];
  readonly multiple?: boolean;
  readonly onFieldChange?: (fieldId: string, value: string) => void;
  readonly preSelectedDocumentId?: string;
  readonly showDescription?: boolean;
}

const handleFilesSelected = (_files: File[]): void => {
  // Files are automatically added to the upload component's state
};

const handleUpload = async (_files: File[]): Promise<void> => {
  // This is called by BNFileUpload component to handle the actual upload
  // The parent component should handle the real upload logic
  await Promise.resolve();
};

const FileUploadDialog = ({
  open,
  onClose,
  onUpload,
  onUploadSuccess,
  onUploadWithNotes,
  acceptedFileTypes,
  dialogTitle = "Upload Document",
  fields = [],
  fieldValues = {},
  maxFiles = 5,
  // meetingId,
  documentType = "dsm-document",
  // isDragging,
  dsmDocumentOptions = EMPTY_DSM_DOCUMENT_OPTIONS,
  multiple = true,
  onFieldChange,
  preSelectedDocumentId,
  showDescription = true,
}: FileUploadDialogProps) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Associations are only read inside submit handlers and never rendered, so a
  // ref avoids re-rendering the dialog on every association change.
  const fileAssociationsRef = useRef<Record<string, string>>({});
  const [description, setDescription] = useState("");

  const handleClose = () => {
    setUploadFiles([]);
    setUploadError(null);
    setIsUploading(false);
    fileAssociationsRef.current = {};
    onClose();
  };

  const handleFileRemove = (fileId: string) => {
    // Remove association when file is removed
    delete fileAssociationsRef.current[fileId];
  };

  const handleFileAssociationChange = (fileId: string, documentId: string) => {
    fileAssociationsRef.current[fileId] = documentId;
  };

  const handleSubmit = async () => {
    const completedFiles = uploadFiles.filter((f) => f.status === "complete");
    const filesToUpload = completedFiles.map((f) => f.file);

    // Build associations map using file identifiers (name-size)
    const associations: Record<string, string> = {};
    completedFiles.forEach((uploadFile) => {
      const fileKey = `${uploadFile.file.name}-${uploadFile.file.size}`;
      // If there's a preSelectedDocumentId, use it for all files
      if (preSelectedDocumentId) {
        associations[fileKey] = preSelectedDocumentId;
      } else if (fileAssociationsRef.current[uploadFile.id]) {
        associations[fileKey] = fileAssociationsRef.current[uploadFile.id];
      }
    });

    if (filesToUpload.length > 0) {
      setIsUploading(true);
      try {
        if (onUploadWithNotes) {
          await onUploadWithNotes(filesToUpload, associations, description);
        } else {
          await onUpload(filesToUpload, associations);
        }

        // Call success callback if provided
        onUploadSuccess?.();

        setDescription("");
        handleClose();
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Unable to upload document"
        );
        setIsUploading(false);
        // Keep dialog open on error so user can see the error message
      }
    }
  };

  // We'll track the file state changes from the upload component
  const handleFileStateChange = (files: UploadFile[]) => {
    setUploadFiles(files);
  };

  const hasCompletedFiles = uploadFiles.some((f) => f.status === "complete");

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          {dialogTitle}
          <IconButton
            aria-label="Close dialog"
            onClick={handleClose}
            size="medium"
            sx={{ p: 1 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {uploadError ? (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => {
              setUploadError(null);
            }}
          >
            {uploadError}
          </Alert>
        ) : null}
        <Stack spacing={2} sx={{ mb: 2 }}>
          {fields.map((field) => (
            <TextField
              key={field.id}
              fullWidth
              label={field.label}
              required={field.required}
              type={field.type ?? "text"}
              value={fieldValues[field.id] ?? ""}
              onChange={(event) =>
                onFieldChange?.(field.id, event.target.value)
              }
              slotProps={
                field.type === "number"
                  ? { htmlInput: { min: 0, step: 1 } }
                  : undefined
              }
            />
          ))}
          {showDescription ? (
            <TextField
              label="Description"
              placeholder="Add a description (optional)"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              multiline
              minRows={2}
            />
          ) : null}
        </Stack>
        <BNFileUpload
          maxFiles={maxFiles}
          acceptedFileTypes={
            acceptedFileTypes ??
            (documentType === "digital-shareholder-meeting"
              ? [".csv", ".xlsx", ".xls"]
              : [".doc", ".docx", ".pdf", ".ppt", ".pptx", ".csv"])
          }
          onFilesSelected={handleFilesSelected}
          onFileRemove={handleFileRemove}
          onUpload={handleUpload}
          onFileStateChange={handleFileStateChange}
          multiple={multiple}
          uploadedFiles={uploadFiles}
          dsmDocumentOptions={dsmDocumentOptions}
          onFileAssociationChange={handleFileAssociationChange}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!hasCompletedFiles || isUploading}
          onClick={handleSubmit}
        >
          {isUploading ? "Uploading..." : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadDialog;
