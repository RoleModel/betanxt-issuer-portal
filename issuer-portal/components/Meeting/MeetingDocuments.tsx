import { InsertDriveFileOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import type { components as GeneratedComponents } from "@/domain-models/generated-schema";
import type { Document, Meeting } from "@/types/api-exports";

import DocumentViewer from "@/components/Documents/DocumentViewer";
import ApprovalDrawer from "@/components/Drawers/ApprovalDrawer";
import { EmptyState } from "@/components/EmptyState";
import FileUploadDialog from "@/components/FileUpload/FileUploadDialog";
import SROnlyTableCaption from "@/components/ui/SROnlyTableCaption";
import StatusChip from "@/components/ui/StatusChip";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentSync } from "@/hooks/useDocumentSync";
import { formatDateForDisplay } from "@/utils/dateUtils";
import { getStoragePublicUrl } from "@/utils/documentUtils";
import { asParamString } from "@/utils/typeUtils";

interface MeetingDocumentsProps {
  readonly documents?: Document[];
  readonly meetingId?: string;
  readonly meeting?: Meeting;
}

type SyncedDocument = GeneratedComponents["schemas"]["Document"];

// Exclude documents that are managed by other components
const filterMeetingDocuments = (docs: Document[]): Document[] =>
  docs.filter((doc) => {
    // Exclude DSM documents (they belong in the DSMDocuments component)
    if (doc.type === "digital-shareholder-meeting") {
      return false;
    }

    // Exclude hosting site documents
    if (doc.type === "HOSTING_SITE") {
      return false;
    }

    // Include all other documents
    return true;
  });

// Compute placeholder deadlines relative to the meeting date
const computePlaceholderDeadline = (
  docType: string,
  meetingDate?: string | null
): string | null => {
  if (!meetingDate) return null;
  const deadline = new Date(meetingDate);
  switch (docType) {
    case "draft-proxy-statement":
      deadline.setDate(deadline.getDate() - 60);
      break;
    case "proxy-card":
      deadline.setDate(deadline.getDate() - 30);
      break;
    case "notice-access-form":
      deadline.setDate(deadline.getDate() - 40);
      break;
    default:
      return null;
  }
  return deadline.toISOString();
};

// `types/api.ts` (the generated OpenAPI schema `Document` derives from) is
// excluded from ESLint's typed-linting program, so the linter's own type
// resolution for `Document["type"]`/`["title"]` here falls back to an error
// type that reads as `any` — `tsc --noEmit` has no issue with any of this.
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

// Combine real documents with Phase 2 placeholders (placeholders first)
const buildDocumentsWithPlaceholders = (
  filteredDocuments: Document[],
  meetingDate?: string | null
): Document[] => {
  const placeholderDocs: Document[] = [];

  // Check if Draft Proxy Statement exists
  if (
    !filteredDocuments.find(
      (doc) =>
        doc.type === "draft-proxy-statement" ||
        (doc.title?.toLowerCase().includes("draft proxy statement") ?? false)
    )
  ) {
    placeholderDocs.push({
      id: "placeholder-draft-proxy-statement",
      title: "Draft Proxy Statement",
      type: "draft-proxy-statement",
      status: "AWAITING_DRAFT",
      deadline: computePlaceholderDeadline(
        "draft-proxy-statement",
        meetingDate
      ),
      uploadedDate: null,
    });
  }

  // Check if Proxy Card exists
  if (
    !filteredDocuments.find(
      (doc) =>
        doc.type === "proxy-card" ||
        (doc.title?.toLowerCase().includes("proxy card") ?? false)
    )
  ) {
    placeholderDocs.push({
      id: "placeholder-proxy-card",
      title: "Proxy Card",
      type: "proxy-card",
      status: "AWAITING_DRAFT",
      deadline: computePlaceholderDeadline("proxy-card", meetingDate),
      uploadedDate: null,
    });
  }

  // Check if Notice exists
  if (
    !filteredDocuments.find(
      (doc) =>
        doc.type === "notice-access-form" ||
        (doc.title?.toLowerCase().includes("Notice") ?? false)
    )
  ) {
    placeholderDocs.push({
      id: "placeholder-notice-access-form",
      title: "Notice",
      type: "notice-access-form",
      status: "AWAITING_DRAFT",
      deadline: computePlaceholderDeadline("notice-access-form", meetingDate),
      uploadedDate: null,
    });
  }

  return [...placeholderDocs, ...filteredDocuments] as Document[];
};
/* eslint-enable @typescript-eslint/strict-boolean-expressions */

// Map MIME types to friendly display names
const getFriendlyFileType = (fileType?: string): string => {
  const docType = fileType ?? "PDF";
  if (docType === "application/pdf") return "PDF";
  if (
    docType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "DOCX";
  if (
    docType ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return "XLSX";
  if (docType === "application/msword") return "DOC";
  if (docType === "application/vnd.ms-excel") return "XLS";
  // Return as-is if already friendly or unknown
  return docType;
};

// TODO: Implement comment persistence (e.g., POST to /api/documents/:id/comments)
const onAddComment = (comment: string) => {
  void comment;
};

const getStatusChip = (status: Document["status"]) => (
  <StatusChip status={status ?? null} />
);

// Pure logging callbacks: no local state, so these live at module scope
// instead of being rebuilt (and re-triggering useDocumentSync's effect)
// every render.
const handleDocumentAdded = (document: SyncedDocument) => {
  console.log("Document added via real-time sync:", document.title);
};
const handleDocumentUpdated = (document: SyncedDocument) => {
  console.log("Document updated via real-time sync:", document.title);
};
const handleDocumentDeleted = (documentId: string) => {
  console.log("Document deleted via real-time sync:", documentId);
};

interface MeetingDocumentsFooterProps {
  readonly hasDocuments: boolean;
  readonly meetingId?: string;
  readonly onUpload: (placeholderId?: string) => void;
  readonly onViewAll: () => void;
}

const MeetingDocumentsFooter = ({
  hasDocuments,
  meetingId,
  onUpload,
  onViewAll,
}: MeetingDocumentsFooterProps) => (
  <CardActions sx={{ justifyContent: "flex-end" }}>
    <Button
      variant="outlined"
      onClick={() => {
        onUpload();
      }}
      disabled={!meetingId}
    >
      Upload
    </Button>
    {hasDocuments ? (
      <Button variant="outlined" onClick={onViewAll} disabled={!meetingId}>
        View All
      </Button>
    ) : null}
  </CardActions>
);

interface DocumentActionButtonProps {
  readonly document: Document;
  readonly onUpload: (placeholderId?: string) => void;
  readonly onApprove: (documentId: string) => void;
}

const DocumentActionButton = ({
  document,
  onUpload,
  onApprove,
}: DocumentActionButtonProps) => {
  // Check if this is a placeholder document
  const isPlaceholder = document.id?.startsWith("placeholder-");

  // See the note near buildDocumentsWithPlaceholders about the
  // ignored-schema type-resolution gap affecting `Document` fields.
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (isPlaceholder) {
    return (
      <Button
        variant="text"
        onClick={() => {
          onUpload(document.id);
        }}
      >
        Upload
      </Button>
    );
  }

  switch (document.status) {
    case "AWAITING_REVIEW":
    case "UPLOADED":
    case "IN_PROGRESS":
    case "SIGNED":
      return (
        <Button
          variant="text"
          onClick={() => {
            onApprove(document.id ?? "");
          }}
        >
          View
        </Button>
      );
    case "AUTHORIZED":
    case "COMPLETED":
    case "APPROVED":
      return null;
    case "AWAITING_DRAFT":
    case "DRAFT":
      return (
        <Button
          variant="outlined"
          onClick={() => {
            onUpload();
          }}
        >
          Upload
        </Button>
      );
    default:
      return null;
  }
};

interface MeetingDocumentsTableProps {
  readonly documents: Document[];
  readonly onUpload: (placeholderId?: string) => void;
  readonly onApprove: (documentId: string) => void;
}

const MeetingDocumentsTable = ({
  documents,
  onUpload,
  onApprove,
}: MeetingDocumentsTableProps) => (
  <TableContainer>
    <Table sx={{ width: "100%", tableLayout: "fixed" }}>
      <SROnlyTableCaption>Meeting Documents</SROnlyTableCaption>
      <TableHead sx={{ visibility: "hidden", display: "none" }}>
        <TableRow>
          <TableCell>Document</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {documents.map((document) => (
          <TableRow key={document.id}>
            <TableCell>
              <Box>
                <Typography noWrap fontWeight={500}>
                  {document.title ?? "Untitled"}
                </Typography>
                {/* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- see the note near buildDocumentsWithPlaceholders */}
                {document.uploadedDate ? (
                  <Typography color="text.secondary">
                    Uploaded:{" "}
                    {new Date(document.uploadedDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      }
                    )}
                  </Typography>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- see the note near buildDocumentsWithPlaceholders about the ignored-schema type-resolution gap
                  document.id?.startsWith("placeholder-") &&
                  typeof document.deadline === "string" && (
                    <Typography
                      noWrap
                      color="text.secondary"
                      sx={{ fontStyle: "italic" }}
                    >
                      Deadline: {formatDateForDisplay(document.deadline)}
                    </Typography>
                  )
                )}
              </Box>
            </TableCell>
            <TableCell>
              <Typography color="text.secondary">
                {getFriendlyFileType(document.fileType)}
              </Typography>
            </TableCell>
            <TableCell>{getStatusChip(document.status)}</TableCell>
            <TableCell align="right">
              <DocumentActionButton
                document={document}
                onUpload={onUpload}
                onApprove={onApprove}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const MeetingDocuments = ({
  documents: propDocuments,
  meetingId,
  meeting,
}: MeetingDocumentsProps) => {
  const router = useRouter();
  const params = useParams();
  const clientTicker = asParamString(params.clientTicker);
  const { getDocumentsByMeeting, uploadDocument } = useDocuments();
  const [documents, setDocuments] = useState<Document[]>(propDocuments || []);
  const [open, setOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [selectedDocumentStatus, setSelectedDocumentStatus] =
    useState<Document["status"]>(undefined);
  const [selectedPlaceholderId, setSelectedPlaceholderId] = useState<
    string | undefined
  >(undefined);
  const [loading, setLoading] = useState(!!meetingId);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [documentViewerUrl, setDocumentViewerUrl] = useState("");

  // Real-time document synchronization
  const {
    documents: syncedDocuments,
    isLoading: syncLoading,
    addOptimisticDocument,
    removeOptimisticDocument,
  } = useDocumentSync({
    meetingId: meetingId ?? "",
    onDocumentAdded: handleDocumentAdded,
    onDocumentUpdated: handleDocumentUpdated,
    onDocumentDeleted: handleDocumentDeleted,
  });

  // Use synced documents and apply filtering
  useEffect(() => {
    const filteredDocuments = filterMeetingDocuments(syncedDocuments);
    // The recommended fix is switching this to SWR (the project's established
    // data-fetching pattern elsewhere), not suppressing this warning — but
    // that's a data-layer rewrite, not a lint fix.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDocuments(
      buildDocumentsWithPlaceholders(filteredDocuments, meeting?.meetingDate)
    );
    setLoading(syncLoading);
  }, [syncedDocuments, syncLoading, meeting?.meetingDate]);

  // No useCallback: the React Compiler already caches this.
  const fetchDocuments = async () => {
    if (!meetingId) return;
    setLoading(true);
    try {
      const fetchedDocuments = await getDocumentsByMeeting(meetingId);
      const filteredDocuments = filterMeetingDocuments(fetchedDocuments);
      setDocuments(
        buildDocumentsWithPlaceholders(filteredDocuments, meeting?.meetingDate)
      );
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setLoading(false);
    }
  };

  // Fetch actual uploaded documents when meetingId changes
  useEffect(() => {
    if (meetingId) {
      // See the note on the same warning above.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  // Listen for document uploads from other components (like TaskDrawer)
  useEffect(() => {
    const handleDocumentsUploaded = (event: Event) => {
      // CustomEvent<T> defaults its `detail` type param to `any`, so
      // narrowing with `instanceof` here avoids an unsafe cast entirely.
      if (!(event instanceof CustomEvent)) return;

      const uploadedMeetingId: unknown = event.detail?.meetingId;
      if (uploadedMeetingId === meetingId) {
        void fetchDocuments();
      }
    };

    window.addEventListener("documentsUploaded", handleDocumentsUploaded);

    return () => {
      window.removeEventListener("documentsUploaded", handleDocumentsUploaded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  const handleViewAllDocuments = () => {
    router.push(`/${clientTicker}/meeting/${meetingId}/documents`);
  };

  const handleUpload = (placeholderId?: string) => {
    setSelectedPlaceholderId(placeholderId);
    setUploadDialogOpen(true);
  };

  const handleFileUpload = async (
    files: File[],
    associations?: Record<string, string>
  ) => {
    if (files.length === 0) return;

    const optimisticIds: string[] = [];

    try {
      // Add optimistic documents for immediate UI feedback
      for (const file of files) {
        const fileId = `${file.name}-${file.size}`;
        const placeholderId = associations?.[fileId];

        const optimisticDoc = {
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          type: placeholderId?.startsWith("placeholder-")
            ? placeholderId.replace("placeholder-", "")
            : "document",
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
          status: "DRAFT" as const,
        };

        const tempId = addOptimisticDocument(optimisticDoc);
        // See the note near buildDocumentsWithPlaceholders about the
        // ignored-schema type-resolution gap affecting `Document` fields.
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (tempId) {
          optimisticIds.push(tempId);
        }
      }

      // Perform actual uploads concurrently (each file is independent)
      await Promise.all(
        files.map(async (file) => {
          const fileId = `${file.name}-${file.size}`;
          const placeholderId = associations?.[fileId];

          let result: string | null = null;
          if (placeholderId?.startsWith("placeholder-") === true) {
            const documentType = placeholderId.replace("placeholder-", "");
            result = await uploadDocument(
              file,
              documentType,
              meetingId ?? "",
              file.name
            );
          } else {
            result = await uploadDocument(file, file.name, meetingId ?? "");
          }

          if (!result) {
            throw new Error(`Failed to upload ${file.name}`);
          }
        })
      );

      // Remove optimistic documents - real ones will come via sync
      optimisticIds.forEach(removeOptimisticDocument);

      // Note: No need to call fetchDocuments() - real-time sync will handle updates
    } catch (error) {
      // Remove optimistic documents on error
      optimisticIds.forEach(removeOptimisticDocument);
      console.error("Failed to upload document:", error);
      throw error;
    }
  };

  const handleApprove = (documentId: string) => {
    if (documentId.startsWith("placeholder-")) {
      console.warn("Cannot approve placeholder document");
      return;
    }

    const document = documents.find((d) => d.id === documentId);
    // See the note near buildDocumentsWithPlaceholders about the
    // ignored-schema type-resolution gap affecting `Document` fields.
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!document) {
      return;
    }

    const storagePath = document.filePath ?? "";

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!storagePath) {
      return;
    }

    // Convert storage path to public URL
    const docUrl = getStoragePublicUrl(storagePath);

    setSelectedDocumentId(documentId);
    setSelectedDocumentStatus(document.status);
    setOpen(true);
    setFileUrl(docUrl);
  };

  const handleOpenFullscreen = () => {
    // Set the document URL from the approval drawer
    if (fileUrl) {
      setDocumentViewerUrl(fileUrl);
      setDocumentViewerOpen(true);
    }
    // Close the approval drawer
    setOpen(false);
  };

  const onApprove = () => {
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader title="Documents" />
      <CardContent sx={{ p: 0 }}>
        {documents.length === 0 && !loading ? (
          <EmptyState
            title="No documents uploaded yet"
            description="Documents will appear here once they are uploaded for this meeting."
            minHeight="unset"
            icon={<InsertDriveFileOutlined fontSize="large" color="disabled" />}
          />
        ) : (
          <MeetingDocumentsTable
            documents={documents}
            onUpload={handleUpload}
            onApprove={handleApprove}
          />
        )}
      </CardContent>
      <MeetingDocumentsFooter
        hasDocuments={documents.length > 0}
        meetingId={meetingId}
        onUpload={handleUpload}
        onViewAll={handleViewAllDocuments}
      />
      <ApprovalDrawer
        title="Approve Document"
        fileUrl={fileUrl}
        documentId={selectedDocumentId}
        taskStatus={selectedDocumentStatus}
        onApprove={onApprove}
        onOpenFullscreen={handleOpenFullscreen}
        onAddComment={onAddComment}
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
      <DocumentViewer
        open={documentViewerOpen}
        onClose={() => {
          setDocumentViewerOpen(false);
        }}
        fileUrl={documentViewerUrl}
        title="Document Viewer"
        documentId={selectedDocumentId}
      />
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
          setSelectedPlaceholderId(undefined);
        }}
        onUpload={handleFileUpload}
        onUploadSuccess={() => {
          setUploadDialogOpen(false);
          setSelectedPlaceholderId(undefined);
        }}
        meetingId={meetingId}
        preSelectedDocumentId={selectedPlaceholderId}
      />
    </Card>
  );
};

export default MeetingDocuments;
