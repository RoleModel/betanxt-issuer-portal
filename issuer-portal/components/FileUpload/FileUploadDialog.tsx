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
import React, { useState } from "react";

import type { DSMDocumentOption, UploadFile } from "./types";

import BNFileUpload from "./BNFileUpload";

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[], associations?: Record<string, string>) => void;
  onUploadSuccess?: () => void;
  onUploadWithNotes?: (
    files: File[],
    associations?: Record<string, string>,
    description?: string
  ) => void;
  meetingId?: string;
  documentType?: string;
  isDragging?: boolean;
  dsmDocumentOptions?: DSMDocumentOption[];
  preSelectedDocumentId?: string;
}

const FileUploadDialog = ({
  open,
  onClose,
  onUpload,
  onUploadSuccess,
  onUploadWithNotes,
  // meetingId,
  documentType = "dsm-document",
  // isDragging,
  dsmDocumentOptions = [],
  preSelectedDocumentId,
}: FileUploadDialogProps) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileAssociations, setFileAssociations] = useState<
    Record<string, string>
  >({});
  const [description, setDescription] = useState("");

  const handleClose = () => {
    setUploadFiles([]);
    setUploadError(null);
    setIsUploading(false);
    setFileAssociations({});
    onClose();
  };

  const handleFilesSelected = (_files: File[]) => {
    // Files are automatically added to the upload component's state
  };

  const handleFileRemove = (fileId: string) => {
    // Remove association when file is removed
    setFileAssociations((prev) => {
      const newAssociations = { ...prev };
      delete newAssociations[fileId];
      return newAssociations;
    });
  };

  const handleFileAssociationChange = (fileId: string, documentId: string) => {
    setFileAssociations((prev) => ({
      ...prev,
      [fileId]: documentId,
    }));
  };

  const handleUpload = async (_files: File[]) => {
    // This is called by BNFileUpload component to handle the actual upload
    // The parent component should handle the real upload logic
    return Promise.resolve();
  };

  const handleSubmit = () => {
    const completedFiles = uploadFiles.filter((f) => f.status === "complete");
    const filesToUpload = completedFiles.map((f) => f.file);

    // Build associations map using file identifiers (name-size)
    const associations: Record<string, string> = {};
    completedFiles.forEach((uploadFile) => {
      const fileKey = `${uploadFile.file.name}-${uploadFile.file.size}`;
      // If there's a preSelectedDocumentId, use it for all files
      if (preSelectedDocumentId) {
        associations[fileKey] = preSelectedDocumentId;
      } else if (fileAssociations[uploadFile.id]) {
        associations[fileKey] = fileAssociations[uploadFile.id];
      }
    });

    if (filesToUpload.length > 0) {
      setIsUploading(true);
      try {
        if (onUploadWithNotes) {
          onUploadWithNotes(filesToUpload, associations, description);
        } else {
          onUpload(filesToUpload, associations);
        }

        // Call success callback if provided
        onUploadSuccess?.();

        setDescription("");
        handleClose();
      } catch (error) {
        console.error("Submit error:", error);
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
          Upload Document
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
        {uploadError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setUploadError(null)}
          >
            {uploadError}
          </Alert>
        )}
        <Stack spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Description"
            placeholder="Add a description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
          />
        </Stack>
        <BNFileUpload
          maxFiles={5}
          acceptedFileTypes={
            documentType === "digital-shareholder-meeting"
              ? [".csv", ".xlsx", ".xls"]
              : [".doc", ".docx", ".pdf", ".ppt", ".pptx", ".csv"]
          }
          onFilesSelected={handleFilesSelected}
          onFileRemove={handleFileRemove}
          onUpload={handleUpload}
          onFileStateChange={handleFileStateChange}
          multiple={true}
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
