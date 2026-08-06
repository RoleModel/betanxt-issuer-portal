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
import React, { useCallback, useEffect, useState } from "react";

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
        doc.title?.toLowerCase().includes("draft proxy statement")
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
        doc.title?.toLowerCase().includes("proxy card")
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
        doc.title?.toLowerCase().includes("Notice")
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

const onAddComment = (_comment: string) => {
  // TODO: Implement comment persistence (e.g., POST to /api/documents/:id/comments)
  // Mark parameter as intentionally unused until implementation
  void _comment;
};

const getStatusChip = (status: Document["status"]) => {
  const statusConfig = {
    AWAITING_DRAFT: { color: "default" as const, label: "Awaiting Draft" },
    AWAITING_REVIEW: { color: "warning" as const, label: "Awaiting Review" },
    APPROVED: { color: "success" as const, label: "Approved" },
    DRAFT: { color: "info" as const, label: "Draft" },
    UPLOADED: { color: "success" as const, label: "Uploaded" },
    IN_PROGRESS: { color: "info" as const, label: "In Progress" },
    SIGNED: { color: "success" as const, label: "Signed" },
    PENDING_AUTHORIZATION: {
      color: "warning" as const,
      label: "Pending Authorization",
    },
    AUTHORIZED: { color: "success" as const, label: "Authorized" },
    COMPLETED: { color: "success" as const, label: "Completed" },
    SUBMITTED_AWAITING_RECORD_DATE: {
      color: "info" as const,
      label: "Submitted Awaiting Record Date",
    },
    NOT_UPLOADED: { color: "default" as const, label: "Not Uploaded" },
  };

  // Status config not currently used, but kept for future enhancement
  const _config =
    statusConfig[status ?? "AWAITING_DRAFT"] || statusConfig.AWAITING_DRAFT;
  return <StatusChip status={status || null} />;
};

const MeetingDocuments = ({
  documents: propDocuments,
  meetingId,
  meeting,
}: MeetingDocumentsProps) => {
  const router = useRouter();
  const { clientTicker } = useParams<{ clientTicker: string }>();
  const { getDocumentsByMeeting, uploadDocument } = useDocuments();
  const [documents, setDocuments] = useState<Document[]>(propDocuments || []);
  const [open, setOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileUrl, setfileUrl] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [selectedDocumentStatus, setSelectedDocumentStatus] = useState<
    Document["status"] | undefined
  >(undefined);
  const [selectedPlaceholderId, setSelectedPlaceholderId] = useState<
    string | undefined
  >(undefined);
  const [loading, setLoading] = useState(!!meetingId);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [documentViewerUrl, setDocumentViewerUrl] = useState("");

  // Stable real-time sync callbacks (avoid rebuilding them every render)
  const handleDocumentAdded = useCallback((document: SyncedDocument) => {
    console.log("Document added via real-time sync:", document.title);
  }, []);
  const handleDocumentUpdated = useCallback((document: SyncedDocument) => {
    console.log("Document updated via real-time sync:", document.title);
  }, []);
  const handleDocumentDeleted = useCallback((documentId: string) => {
    console.log("Document deleted via real-time sync:", documentId);
  }, []);

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
    if (!syncedDocuments) return;

    const filteredDocuments = filterMeetingDocuments(syncedDocuments);
    setDocuments(
      buildDocumentsWithPlaceholders(filteredDocuments, meeting?.meetingDate)
    );
    setLoading(syncLoading);
  }, [syncedDocuments, syncLoading, meeting?.meetingDate]);

  // Track selectedDocumentId changes
  useEffect(() => {
    // Placeholder for future side effects
  }, [selectedDocumentId]);

  const fetchDocuments = useCallback(async () => {
    if (!meetingId) return;
    setLoading(true);
    try {
      const fetchedDocuments = await getDocumentsByMeeting(meetingId);
      const filteredDocuments = filterMeetingDocuments(fetchedDocuments);
      setDocuments(
        buildDocumentsWithPlaceholders(filteredDocuments, meeting?.meetingDate)
      );
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, [meetingId, getDocumentsByMeeting, meeting?.meetingDate]);

  // Fetch actual uploaded documents when meetingId changes
  useEffect(() => {
    if (meetingId) {
      void fetchDocuments();
    }
  }, [meetingId, fetchDocuments]);

  // Listen for document uploads from other components (like TaskDrawer)
  useEffect(() => {
    const handleDocumentsUploaded = (
      event: CustomEvent<{ meetingId: string }>
    ) => {
      if (event.detail.meetingId === meetingId) {
        void fetchDocuments();
      }
    };

    window.addEventListener(
      "documentsUploaded" as keyof WindowEventMap,
      handleDocumentsUploaded as EventListener
    );

    return () => {
      window.removeEventListener(
        "documentsUploaded" as keyof WindowEventMap,
        handleDocumentsUploaded as EventListener
      );
    };
  }, [meetingId, fetchDocuments]);

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
          fileType: file.type ?? "application/octet-stream",
          fileSize: file.size,
          status: "DRAFT" as const,
        };

        const tempId = addOptimisticDocument(optimisticDoc);
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
          if (
            placeholderId &&
            typeof placeholderId === "string" &&
            placeholderId.startsWith("placeholder-")
          ) {
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
    if (!document) {
      return;
    }

    const storagePath = document.filePath ?? "";

    if (!storagePath) {
      return;
    }

    // Convert storage path to public URL
    const docUrl = getStoragePublicUrl(storagePath);

    setSelectedDocumentId(documentId);
    setSelectedDocumentStatus(document.status);
    setOpen(true);
    setfileUrl(docUrl);
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
  const effectiveStatus = document.status as
    | "AWAITING_DRAFT"
    | "DRAFT"
    | "AWAITING_REVIEW"
    | "UPLOADED"
    | "IN_PROGRESS"
    | "SIGNED"
    | "PENDING_AUTHORIZATION"
    | "AUTHORIZED"
    | "COMPLETED"
    | "APPROVED"
    | "SUBMITTED_AWAITING_RECORD_DATE"
    | "NOT_UPLOADED";

  // Check if this is a placeholder document
  const isPlaceholder = document.id?.startsWith("placeholder-");

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

  switch (effectiveStatus) {
    case "AWAITING_REVIEW":
    case "UPLOADED":
    case "IN_PROGRESS":
    case "SIGNED":
    case "PENDING_AUTHORIZATION":
    case "SUBMITTED_AWAITING_RECORD_DATE":
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

export default MeetingDocuments;
