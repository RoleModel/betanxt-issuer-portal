"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import Fade from "@mui/material/Fade";
import { useState } from "react";
import useSWR, { mutate } from "swr";

import type { UploadFile } from "@/components/FileUpload/types";
import type { components } from "@/domain-models/generated-schema";

import FeatureTile from "@/components/FeatureTile";
import BNFileUpload from "@/components/FileUpload/BNFileUpload";
import { hasNonEmptyString } from "@/components/Meeting/mailingTimeline";
import buildApiClient from "@/domain-models/apiClient";

type Document = components["schemas"]["Document"];

interface MailingAffidavitSectionProps {
  readonly isCSM: boolean;
  readonly meetingId?: string;
}

const formatDateTime = (dateString: string | undefined): string | null => {
  if (dateString === undefined || dateString.length === 0) return null;

  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const MailingAffidavitSection = ({ isCSM, meetingId }: MailingAffidavitSectionProps) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localAffidavitDoc, setLocalAffidavitDoc] = useState<Document | null | undefined>(
    undefined,
  );

  const { data: affidavitDoc, isLoading: affidavitLoading } = useSWR<Document | null>(
    hasNonEmptyString(meetingId) ? `/meetings/${meetingId}/affidavit-of-mailing` : null,
    async () => {
      if (!hasNonEmptyString(meetingId)) return null;

      const apiClient = await buildApiClient();
      const { data } = await apiClient.GET("/meetings/{meetingId}/documents", {
        params: {
          path: { meetingId },
          query: { type: "affidavit-of-mailing" },
        },
      });
      const documents = (data as unknown as Document[]) ?? [];

      return documents.at(0) ?? null;
    },
    { revalidateOnFocus: false },
  );

  const displayDoc = localAffidavitDoc === undefined ? affidavitDoc : localAffidavitDoc;
  const hasAffidavit = Boolean(displayDoc);
  const isAffidavitLoading = localAffidavitDoc === undefined && affidavitLoading;
  const hasCompletedFiles = uploadFiles.some((file) => file.status === "complete");

  const handleFileStateChange = (files: UploadFile[]) => {
    setUploadFiles(files);
  };

  const handleUploadSubmit = async () => {
    const completedFiles = uploadFiles.filter((file) => file.status === "complete");
    if (completedFiles.length === 0 || !hasNonEmptyString(meetingId)) return;

    setIsUploading(true);
    try {
      const apiClient = await buildApiClient();

      if (displayDoc?.id) {
        await apiClient.DELETE("/documents/{id}", {
          params: { path: { id: displayDoc.id } },
        });
      }

      const { file } = completedFiles[0];
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve) => {
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });

      const { data: createdDoc, error: createError } = await apiClient.POST(
        "/meetings/{meetingId}/documents",
        {
          params: { path: { meetingId } },
          body: {
            title: "<GlossaryText>Affidavit of Mailing</GlossaryText>",
            type: "affidavit-of-mailing",
            file: base64Data,
          },
        },
      );

      if (createError) {
        setIsUploading(false);
        return;
      }

      if (createdDoc) {
        setLocalAffidavitDoc(createdDoc);
      }
      setUploadDialogOpen(false);
      setUploadFiles([]);
      setIsUploading(false);
    } catch {
      // Upload failed; dialog stays open for retry.
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    const documentId = displayDoc?.id;
    if (!hasNonEmptyString(documentId) || !hasNonEmptyString(meetingId)) return;

    setIsDeleting(true);
    try {
      const apiClient = await buildApiClient();
      await apiClient.DELETE("/documents/{id}", {
        params: { path: { id: documentId } },
      });

      await mutate(`/meetings/${meetingId}/affidavit-of-mailing`, null, {
        revalidate: false,
      });
      setLocalAffidavitDoc(null);
      setDeleteDialogOpen(false);
      setIsDeleting(false);
    } catch {
      // Delete failed; user can retry from the dialog.
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    const documentId = displayDoc?.id;
    if (!hasNonEmptyString(documentId) || !hasNonEmptyString(meetingId)) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
    const downloadUrl = `${baseUrl}/documents/${documentId}/download`;
    const documentTitle = displayDoc?.title;
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = hasNonEmptyString(documentTitle) ? documentTitle : "affidavit-of-mailing.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {hasAffidavit && displayDoc ? (
        <Fade in={hasAffidavit}>
          <Stack spacing={1}>
            <FeatureTile
              variant="primary"
              title="Mailing Affidavit"
              titleVariant="h3"
              description={`Uploaded: ${formatDateTime(displayDoc.updatedAt) ?? formatDateTime(displayDoc.createdAt)}`}
              actionText="Download"
              onClick={handleDownload}
            />
          </Stack>
        </Fade>
      ) : null}

      {isCSM && !hasAffidavit && !isAffidavitLoading ? (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardActionArea
            onClick={() => {
              setUploadDialogOpen(true);
            }}
          >
            <CardHeader
              avatar={<UploadFileIcon color="action" />}
              title="Upload Mailing Affidavit"
            />
            <CardContent sx={{ pt: 0 }}>
              <Typography variant="body3" color="text.secondary">
                Click to upload the Mailing Affidavit.
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ) : null}

      {hasAffidavit && displayDoc ? (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardActions>
            <CheckCircleIcon color="success" />
            <Typography variant="body3" color="text.secondary" sx={{ flexGrow: 1 }}>
              Mailing Affidavit Uploaded
            </Typography>
            <IconButton
              color="error"
              onClick={() => {
                setDeleteDialogOpen(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </CardActions>
        </Card>
      ) : null}

      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Mailing Affidavit</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Upload the Mailing Affidavit PDF document.
          </DialogContentText>
          <BNFileUpload
            maxFiles={1}
            acceptedFileTypes={[".pdf"]}
            onFilesSelected={() => undefined}
            onFileRemove={() => undefined}
            onUpload={async () => {
              await Promise.resolve();
            }}
            onFileStateChange={handleFileStateChange}
            multiple={false}
            uploadedFiles={uploadFiles}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!hasCompletedFiles || isUploading}
            onClick={handleUploadSubmit}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the Mailing Affidavit? You can upload a new version
            after deletion.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button variant="contained" color="error" disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MailingAffidavitSection;
