"use client";

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  LinearProgress,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import useSWR from "swr";

import type { components } from "@/domain-models/generated-schema";

import FileUploadDialog from "@/components/FileUpload/FileUploadDialog";
import SROnlyTableCaption from "@/components/ui/SROnlyTableCaption";
import { useDocuments } from "@/contexts/DocumentContext";
import buildApiClient from "@/domain-models/apiClient";

const DocumentViewer = lazy(
  async () => await import("@/components/Documents/DocumentViewer")
);

type Document = components["schemas"]["Document"];

interface DSMConfig {
  meetingId: string;
  liveQa: boolean;
  audioOnly: boolean;
  meetingRecording: boolean;
  staticSlideDocId?: string;
  displayDocsDocId?: string;
  isConfirmed: boolean;
}

interface DigitalShareholderMeetingCardProps {
  readonly className?: string;
  readonly meetingId?: string;
}

interface DSMConfigOption {
  label: string;
  docType: string;
  value?: boolean;
  onChange?: (checked: boolean) => void;
  action?: string;
  rightAction?: string;
  onUpload?: () => void;
  onViewLastYear?: () => void | Promise<void>;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

// Returns null on a non-OK response (no config yet); only network failures
// reject, matching the original effect's edit-mode-on-error behavior.
const dsmConfigFetcher = async (url: string): Promise<DSMConfig | null> => {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as DSMConfig;
};

// Extract year from meeting ID to find previous year's meeting
const getPreviousYearMeetingId = (
  currentMeetingId: string | undefined
): string | null => {
  if (!currentMeetingId) return null;

  // Parse meeting ID format: "ticker-meeting-type-year"
  const parts = currentMeetingId.split("-");
  if (parts.length < 3) return null;

  const yearStr = parts[parts.length - 1];
  const year = parseInt(yearStr, 10);

  if (isNaN(year)) return null;

  // Construct previous year meeting ID
  const previousYear = year - 1;
  parts[parts.length - 1] = previousYear.toString();
  return parts.join("-");
};

// Determine whether a document matches a given DSM document type
const matchesDocType = (doc: Document, docType: string): boolean => {
  const docTypeNorm = doc.type?.toLowerCase() || "";
  const titleNorm = doc.title?.toLowerCase() || "";

  if (docType === "Live Written Q&A") {
    return (
      docTypeNorm.includes("q&a") ||
      titleNorm.includes("q&a") ||
      titleNorm.includes("questions")
    );
  } else if (docType === "Audio only") {
    return docTypeNorm.includes("audio") || titleNorm.includes("audio");
  } else if (docType === "Static Slide or Presentation") {
    return (
      docTypeNorm.includes("slide") ||
      docTypeNorm.includes("presentation") ||
      titleNorm.includes("slide") ||
      titleNorm.includes("presentation")
    );
  } else if (docType === "Documents to Display") {
    return doc.displayCategory === "dsm" || docTypeNorm.includes("display");
  } else if (docType === "Meeting Recording") {
    return (
      docTypeNorm.includes("recording") ||
      docTypeNorm.includes("archive") ||
      titleNorm.includes("recording") ||
      titleNorm.includes("archive")
    );
  }
  return false;
};

const DSM_DOC_TYPES = [
  "Live Written Q&A",
  "Audio only",
  "Static Slide or Presentation",
  "Documents to Display",
  "Meeting Recording",
];

// Determine which previous-year documents exist for each DSM document type
const usePreviousYearAvailability = (
  meetingId: string | undefined
): Record<string, boolean> => {
  const [previousYearAvailability, setPreviousYearAvailability] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    let ignore = false;

    const checkPreviousYearDocs = async () => {
      const previousMeetingId = getPreviousYearMeetingId(meetingId);
      if (!previousMeetingId) {
        if (!ignore) setPreviousYearAvailability({});
        return;
      }

      try {
        const apiClient = await buildApiClient();
        const { data } = await apiClient.GET(
          "/meetings/{meetingId}/documents",
          {
            params: { path: { meetingId: previousMeetingId } },
          }
        );

        if (!ignore) {
          if (!data) {
            setPreviousYearAvailability({});
            return;
          }

          const documents = data as Document[];
          const availability: Record<string, boolean> = {};

          DSM_DOC_TYPES.forEach((docType) => {
            availability[docType] = documents.some((doc) =>
              matchesDocType(doc, docType)
            );
          });

          setPreviousYearAvailability(availability);
        }
      } catch (error) {
        console.error("Failed to check previous year documents:", error);
        if (!ignore) setPreviousYearAvailability({});
      }
    };

    void checkPreviousYearDocs();

    return () => {
      ignore = true;
    };
  }, [meetingId]);

  return previousYearAvailability;
};

const DigitalShareholderMeetingCard: React.FC<
  DigitalShareholderMeetingCardProps
> = ({ className, meetingId }) => {
  const [liveQA, setLiveQA] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [meetingRecording, setMeetingRecording] = useState(false);
  const [_isConfirmed, setIsConfirmed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<string>("");
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const previousYearAvailability = usePreviousYearAvailability(meetingId);
  const { uploadDocument } = useDocuments();

  // Fetch existing DSM config via SWR (data layer avoids effect fetch races)
  const {
    data: dsmConfig,
    error: configError,
    isLoading: isConfigLoading,
  } = useSWR<DSMConfig | null>(
    meetingId ? `${API_BASE_URL}/meetings/${meetingId}/dsm-config` : null,
    dsmConfigFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const isLoading = isConfigLoading || isSaving;

  // Sync fetched config into local editable state
  useEffect(() => {
    if (dsmConfig) {
      setLiveQA(dsmConfig.liveQa || false);
      setAudioOnly(dsmConfig.audioOnly || false);
      setMeetingRecording(dsmConfig.meetingRecording || false);
      setIsConfirmed(dsmConfig.isConfirmed || false);
      // If already confirmed, start in view mode; otherwise edit mode
      setIsEditMode(!dsmConfig.isConfirmed);
    } else if (configError) {
      // Start in edit mode if fetch fails
      setIsEditMode(true);
    }
  }, [dsmConfig, configError]);

  // Save DSM config to database
  const saveConfig = async () => {
    if (!meetingId) return;

    try {
      setIsSaving(true);
      const config: DSMConfig = {
        meetingId,
        liveQa: liveQA,
        audioOnly,
        meetingRecording,
        isConfirmed: true,
      };

      const response = await fetch(
        `${API_BASE_URL}/meetings/${meetingId}/dsm-config`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
        }
      );

      if (response.ok) {
        setIsConfirmed(true);
        setIsEditMode(false);
      } else {
        const errorText = await response.text();
        console.error("Failed to save DSM config:", response.status, errorText);
      }
    } catch (error) {
      console.error("Error saving DSM config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle edit button click
  const handleEdit = () => {
    setIsEditMode(true);
  };

  // Handle cancel edit
  const handleCancel = async () => {
    // Reload original values
    if (!meetingId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api"}/meetings/${meetingId}/dsm-config`
      );

      if (response.ok) {
        const data = (await response.json()) as DSMConfig;
        setLiveQA(data.liveQa || false);
        setAudioOnly(data.audioOnly || false);
        setMeetingRecording(data.meetingRecording || false);
        setIsConfirmed(data.isConfirmed || false);
      }
    } catch (error) {
      console.error("Failed to reload DSM config:", error);
    }

    setIsEditMode(false);
  };

  const handleViewLastYear = useCallback(
    async (docType: string) => {
      const previousMeetingId = getPreviousYearMeetingId(meetingId);
      if (!previousMeetingId) {
        console.warn("No previous year meeting found");
        return;
      }

      try {
        const apiClient = await buildApiClient();
        const { data } = await apiClient.GET(
          "/meetings/{meetingId}/documents",
          {
            params: { path: { meetingId: previousMeetingId } },
          }
        );

        if (!data) {
          console.warn("No documents found for previous year");
          return;
        }

        const documents = data as Document[];
        if (Array.isArray(documents)) {
          // Filter for DSM documents based on type
          const dsmDocs = documents.filter((doc) =>
            matchesDocType(doc, docType)
          );

          if (dsmDocs.length > 0 && dsmDocs[0]?.filePath) {
            // Open the document in DocumentViewer
            setSelectedDocument(dsmDocs[0]);
            setDocumentViewerOpen(true);
          } else {
            console.warn(`No ${docType} documents found for previous year`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch previous year documents:", error);
      }
    },
    [meetingId]
  );

  const handleUpload = (type: string) => {
    setUploadType(type);
    setUploadDialogOpen(true);
  };

  const handleUploadComplete = async (
    files: File[],
    associations?: Record<string, string>
  ) => {
    if (!meetingId) return;
    try {
      // Create associations based on upload type to link to DSM placeholders
      // Use the actual placeholder title (not ID) so documents match for replacement
      const typeAssociations: Record<string, string> = {};

      files.forEach((file, index) => {
        const fileId = `file_${index}`;
        if (uploadType === "Static Slide or Presentation") {
          typeAssociations[fileId] = "Static Slide or Presentation";
        } else if (uploadType === "Documents to Display") {
          typeAssociations[fileId] = "Documents to Display";
        }
      });

      // Merge with any existing associations
      const finalAssociations = { ...associations, ...typeAssociations };

      await uploadDocument(meetingId, files, "dsm-document", finalAssociations);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const configOptions: DSMConfigOption[] = [
    {
      label: "Live Written Q&A during the Meeting?",
      docType: "Live Written Q&A",
      value: liveQA,
      onChange: setLiveQA,
      action: "View Last Year",
      onViewLastYear: async () => {
        await handleViewLastYear("Live Written Q&A");
      },
    },
    {
      label: "Audio only (no video)?",
      docType: "Audio only",
      value: audioOnly,
      onChange: setAudioOnly,
      action: "View Last Year",
      onViewLastYear: async () => {
        await handleViewLastYear("Audio only");
      },
    },
    {
      label: "Static Slide or Presentation?",
      docType: "Static Slide or Presentation",
      action: "View Last Year",
      rightAction: "Upload",
      onUpload: () => {
        handleUpload("Static Slide or Presentation");
      },
      onViewLastYear: async () => {
        await handleViewLastYear("Static Slide or Presentation");
      },
    },
    {
      label: "Documents to Display?",
      docType: "Documents to Display",
      action: "View Last Year",
      rightAction: "Upload",
      onUpload: () => {
        handleUpload("Documents to Display");
      },
      onViewLastYear: async () => {
        await handleViewLastYear("Documents to Display");
      },
    },
    {
      label: "Meeting Recording?",
      docType: "Meeting Recording",
      value: meetingRecording,
      onChange: setMeetingRecording,
      action: "View Last Year",
      onViewLastYear: async () => {
        await handleViewLastYear("Meeting Recording");
      },
    },
  ];

  return (
    <Card className={className}>
      <CardHeader title="Digital Shareholder Meeting Information" />
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <DSMConfigTable
          options={configOptions}
          previousYearAvailability={previousYearAvailability}
          isEditMode={isEditMode}
        />
      </CardContent>
      <DSMCardActions
        isEditMode={isEditMode}
        isConfirmed={_isConfirmed}
        isLoading={isLoading}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onConfirm={saveConfig}
      />

      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
        }}
        onUpload={handleUploadComplete}
        meetingId={meetingId}
        documentType={uploadType}
      />

      <DSMPreviousYearViewer
        document={selectedDocument}
        open={documentViewerOpen}
        onClose={() => {
          setDocumentViewerOpen(false);
          setSelectedDocument(null);
        }}
      />
    </Card>
  );
};

interface DSMConfigTableProps {
  readonly options: DSMConfigOption[];
  readonly previousYearAvailability: Record<string, boolean>;
  readonly isEditMode: boolean;
}

const DSMConfigTable: React.FC<DSMConfigTableProps> = ({
  options,
  previousYearAvailability,
  isEditMode,
}) => (
  <Table>
    <SROnlyTableCaption>
      Digital meeting configuration options and settings.
    </SROnlyTableCaption>
    <TableHead
      aria-hidden="false"
      sx={{ visibility: "hidden", display: "none" }}
    >
      <TableRow>
        <TableCell>Option</TableCell>
        <TableCell align="right">Action</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {options.map((option) => (
        <TableRow
          key={option.docType}
          sx={{
            "&:not(:last-child)": {
              borderBottom: "1px solid rgba(31,30,28,0.12)",
            },
          }}
        >
          <TableCell>{option.label}</TableCell>
          <TableCell align="right">
            {option.action ? (
              <Tooltip
                title={
                  !previousYearAvailability[option.docType]
                    ? "No previous year document available"
                    : ""
                }
                arrow
              >
                <span>
                  <Button
                    variant="text"
                    sx={{ textTransform: "none" }}
                    onClick={option.onViewLastYear}
                    disabled={!previousYearAvailability[option.docType]}
                  >
                    {option.action}
                  </Button>
                </span>
              </Tooltip>
            ) : null}
          </TableCell>
          <TableCell align="right">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              {option.rightAction ? (
                <Button
                  variant="text"
                  sx={{ textTransform: "none" }}
                  onClick={option.onUpload}
                  disabled={!isEditMode}
                >
                  {option.rightAction}
                </Button>
              ) : null}
              {option.value !== undefined && option.onChange ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {isEditMode ? (
                    <>
                      <Switch
                        size="small"
                        checked={option.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          option.onChange?.(e.target.checked);
                        }}
                        slotProps={{
                          input: { "aria-label": "Yes or No" },
                        }}
                      />
                      <Typography variant="body3">No</Typography>
                    </>
                  ) : (
                    <Typography variant="body3">
                      {option.value ? "Yes" : "No"}
                    </Typography>
                  )}
                </Box>
              ) : null}
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

interface DSMCardActionsProps {
  readonly isEditMode: boolean;
  readonly isConfirmed: boolean;
  readonly isLoading: boolean;
  readonly onEdit: () => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

const DSMCardActions: React.FC<DSMCardActionsProps> = ({
  isEditMode,
  isConfirmed,
  isLoading,
  onEdit,
  onCancel,
  onConfirm,
}) => (
  <CardActions sx={{ justifyContent: "flex-end", gap: 1 }}>
    {isEditMode ? (
      <>
        {isConfirmed ? (
          <Button
            variant="text"
            sx={{ textTransform: "none" }}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          variant="outlined"
          sx={{ textTransform: "none" }}
          onClick={onConfirm}
          disabled={isLoading}
        >
          Confirm
        </Button>
      </>
    ) : (
      <Button
        variant="outlined"
        sx={{ textTransform: "none" }}
        onClick={onEdit}
      >
        Edit
      </Button>
    )}
  </CardActions>
);

interface DSMPreviousYearViewerProps {
  readonly document: Document | null;
  readonly open: boolean;
  readonly onClose: () => void;
}

const DSMPreviousYearViewer: React.FC<DSMPreviousYearViewerProps> = ({
  document,
  open,
  onClose,
}) => {
  if (!document?.filePath) return null;
  return (
    <Suspense fallback={<LinearProgress />}>
      <DocumentViewer
        open={open}
        onClose={onClose}
        fileUrl={document.filePath}
        documentId={document.id}
        title={document.title ?? "Previous Year Document"}
        hideActivityButtons={true}
      />
    </Suspense>
  );
};

export default DigitalShareholderMeetingCard;
