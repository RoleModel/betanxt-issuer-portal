"use client";

import { SmartDisplayOutlined } from "@mui/icons-material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DocumentEditIcon from "@rolemodel/betanxt-design-system/components/icons/brand/DocumentEditIcon";
import dynamic from "next/dynamic";
import React, { Suspense, useEffect, useState } from "react";
import * as XLSX from "xlsx";

import type { components } from "@/domain-models/generated-schema";
import type { ExtendedDocumentStatus } from "@/utils/documentUtils";

import DocumentSiteCard from "@/components/Documents/DocumentSiteCard";
import DocumentsTable from "@/components/Documents/DocumentsTable";
import DSMDocuments from "@/components/Documents/DSMDocuments";
import EmptyState from "@/components/EmptyState";
import SkeletonTable from "@/components/ui/SkeletonTable";
import { useDocuments } from "@/contexts/DocumentContext";
import { useMeeting } from "@/contexts/MeetingContext";
import { useVotingTabulation } from "@/hooks/use-voting-tabulation";
import {
  DOCUMENT_STATUS_VALUES,
  getDocumentStatusLabel,
} from "@/utils/documentUtils";

type Document = Omit<components["schemas"]["Document"], "status"> & {
  status?: ExtendedDocumentStatus;
};

// Dynamic imports for heavy document components to enable route-based code splitting
const ApprovalDrawer = dynamic(
  async () => await import("@/components/Drawers/ApprovalDrawer"),
  {
    ssr: false,
  }
);

const DocumentViewer = dynamic(
  async () => await import("@/components/Documents/DocumentViewer"),
  {
    ssr: false,
  }
);

const FileUploadDialog = dynamic(
  async () => await import("@/components/FileUpload/FileUploadDialog"),
  {
    ssr: false,
  }
);

const VideoPlayerDialog = dynamic(
  async () => await import("@/components/Video/VideoPlayerDialog"),
  {
    ssr: false,
  }
);

interface DocumentsPageProps {
  readonly params: Promise<{
    meetingId: string;
  }>;
}

interface ParsedProposal {
  proposalNumber: number;
  proposalTitle: string;
  proposalType: string;
  proposalSubtype?: string;
  directorName?: string;
  recommendation: string;
}

type ExcelRow = Record<string, string | number | boolean | Date | undefined>;

// Parse Excel/CSV file for agenda proposals
const parseAgendaFile = async (file: File): Promise<ParsedProposal[]> => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          reject(new Error("The file is empty or has no data rows"));
          return;
        }

        // Map the data to our format
        const mappedData = jsonData
          .map((row: ExcelRow) => {
            const proposalNumber = row["Proposal Number"] ?? row.Number ?? "";
            const proposalTitle = row["Proposal Title"] ?? row.Title ?? "";
            const proposalType = row["Proposal Type"] ?? row.Type ?? "";
            const proposalSubtype =
              row["Proposal Subtype"] ?? row.Subtype ?? "";
            const directorName = row["Director Name"] ?? row.Director ?? "";
            const recommendation = row.Recommendation ?? "";

            // Skip rows without required fields
            if (!proposalNumber || !proposalTitle) {
              return null;
            }

            const parsedProposal: ParsedProposal = {
              proposalNumber:
                typeof proposalNumber === "number"
                  ? proposalNumber
                  : parseFloat(proposalNumber as string) || 0,
              proposalTitle: String(proposalTitle),
              proposalType: String(proposalType),
              recommendation: String(recommendation),
            };

            if (proposalSubtype) {
              parsedProposal.proposalSubtype = String(proposalSubtype);
            }

            if (directorName) {
              parsedProposal.directorName = String(directorName);
            }

            return parsedProposal;
          })
          .filter((item): item is ParsedProposal => item !== null);

        if (mappedData.length === 0) {
          reject(new Error("No valid proposal data found in file"));
          return;
        }

        resolve(mappedData);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
};

// Stable no-op subscription for useSyncExternalStore-based client detection.
const emptySubscribe = (): (() => void) => () => {};

interface MainDocumentsCardProps {
  readonly documents: components["schemas"]["Document"][];
  readonly loading: boolean;
  readonly isClientReady: boolean;
  readonly activeMeetingId: string;
  readonly onUpload: () => void;
  readonly onWatchTutorial: () => void;
  readonly onOpenDocument: (doc: Document) => void;
}

// Primary documents card: header, search/filter bar, and paginated table.
const MainDocumentsCard = ({
  documents,
  loading,
  isClientReady,
  activeMeetingId,
  onUpload,
  onWatchTutorial,
  onOpenDocument,
}: MainDocumentsCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Helper to normalize raw status values from API / placeholders.
  const normalizeStatus = React.useCallback(
    (raw: unknown): ExtendedDocumentStatus | "UNKNOWN" => {
      if (!raw || typeof raw !== "string") return "NOT_UPLOADED";
      if ((DOCUMENT_STATUS_VALUES as readonly string[]).includes(raw))
        return raw as ExtendedDocumentStatus;
      if (raw === "NOT_UPLOADED") return "NOT_UPLOADED";
      return "UNKNOWN";
    },
    []
  );

  // Derive unique normalized statuses present in the dataset.
  const availableStatuses = React.useMemo(() => {
    const set = new Set<string>();
    documents.forEach((doc) => {
      set.add(normalizeStatus(doc.status));
    });
    // Ensure NOT_UPLOADED present if there are documents with no status
    if (documents.some((d) => !d.status)) set.add("NOT_UPLOADED");
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [documents, normalizeStatus]);

  // Filter documents based on search and selected (normalized) status
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const normalized = normalizeStatus(doc.status);
    const matchesStatus = statusFilter === "All" || normalized === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0
      ? Math.max(0, (1 + page) * rowsPerPage - filteredDocuments.length)
      : 0;

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Card>
      <CardHeader
        title="Documents"
        action={
          <Button
            variant="contained"
            startIcon={<FileUploadOutlinedIcon />}
            onClick={onUpload}
            onMouseDown={onUpload}
            disabled={!isClientReady || !activeMeetingId}
          >
            Upload
          </Button>
        }
        avatar={
          <IconButton
            onClick={onWatchTutorial}
            aria-label="Watch tutorial"
            sx={{
              "&:hover": {
                backgroundColor: (theme) => theme.vars.palette.action.hover,
              },
            }}
          >
            <SmartDisplayOutlined />
          </IconButton>
        }
      />

      <CardContent sx={{ p: 0 }}>
        {/* Search and Filter Bar */}

        {loading ? (
          <SkeletonTable rows={5} columns={4} />
        ) : filteredDocuments.length === 0 ? (
          <EmptyState
            title="No documents"
            description={
              searchQuery || statusFilter !== "All"
                ? "No documents match your search criteria."
                : "Upload documents to get started."
            }
            minHeight={300}
            icon={<DocumentEditIcon sx={{ fontSize: 40 }} />}
          />
        ) : (
          <>
            <Box sx={{ mb: 2, px: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  placeholder="Search Documents"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  sx={{ minWidth: 250 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={statusFilter}
                    aria-label="Status Filter"
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                    }}
                    displayEmpty
                  >
                    <MenuItem value="All">All</MenuItem>
                    {availableStatuses.map((status) => {
                      const label =
                        status === "UNKNOWN"
                          ? "Unknown"
                          : getDocumentStatusLabel(
                              (status as ExtendedDocumentStatus) ||
                                "NOT_UPLOADED"
                            );
                      return (
                        <MenuItem key={status} value={status}>
                          {label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Stack>
            </Box>
            <DocumentsTable
              documents={filteredDocuments}
              page={page}
              rowsPerPage={rowsPerPage}
              emptyRows={emptyRows}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              onOpenDocument={onOpenDocument}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface DsmSectionProps {
  readonly dsmDocuments: Document[];
  readonly loading: boolean;
  readonly onUpload: () => void;
  readonly onOpenDocument: (doc: Document) => void;
  readonly onOpenUploadFor: (doc: Document) => void;
}

// Digital Shareholder Meeting document list with its own pagination + progress.
const DsmSection = ({
  dsmDocuments,
  loading,
  onUpload,
  onOpenDocument,
  onOpenUploadFor,
}: DsmSectionProps) => {
  const [dsmPage, setDsmPage] = useState(0);
  const [dsmRowsPerPage, setDsmRowsPerPage] = useState(6);

  // Calculate DSM progress
  const dsmProgress = React.useMemo(() => {
    // Count documents that have been uploaded (have filePath)
    const uploadedDsm = dsmDocuments.filter((doc) => doc.filePath).length;
    const totalRequired = 6; // Number of placeholders defined below
    return {
      uploaded: uploadedDsm,
      totalRequired,
      percentage: totalRequired > 0 ? (uploadedDsm / totalRequired) * 100 : 0,
    };
  }, [dsmDocuments]);

  // DSM pagination empty rows
  const dsmEmptyRows =
    dsmPage > 0
      ? Math.max(0, (1 + dsmPage) * dsmRowsPerPage - dsmDocuments.length)
      : 0;

  const handleDsmChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setDsmPage(newPage);
  };

  const handleDsmChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setDsmRowsPerPage(parseInt(event.target.value, 10));
    setDsmPage(0);
  };

  if (loading) {
    return <SkeletonTable rows={5} columns={4} />;
  }

  return (
    <DSMDocuments
      dsmDocuments={dsmDocuments}
      dsmPage={dsmPage}
      dsmRowsPerPage={dsmRowsPerPage}
      dsmEmptyRows={dsmEmptyRows}
      dsmProgress={dsmProgress}
      onUpload={onUpload}
      onPageChange={handleDsmChangePage}
      onRowsPerPageChange={handleDsmChangeRowsPerPage}
      onOpenDocument={onOpenDocument}
      onOpenUploadFor={onOpenUploadFor}
      placeholders={[
        {
          id: "placeholder-static-agenda",
          title: "Agenda",
        },
        {
          id: "placeholder-static-slide",
          title: "Static Slide or Presentation",
        },
        {
          id: "placeholder-documents-display",
          title: "Documents to Display",
        },
        { id: "placeholder-speaker-list", title: "Speaker List" },
        {
          id: "placeholder-guest-registration",
          title: "Guest Link Registration",
        },
        {
          id: "placeholder-rules",
          title: "2025 Virtual Annual Meeting Rules of Conduct",
        },
        {
          id: "placeholder-forward-looking",
          title: "Forward Looking Statements",
        },
      ]}
    />
  );
};

const DocumentsPage = ({ params }: DocumentsPageProps) => {
  const routeParams = React.use(params);
  const routeMeetingId = routeParams.meetingId;
  const { currentMeeting } = useMeeting();
  const activeMeetingId = currentMeeting?.id ?? routeMeetingId;
  const {
    documents: regularDocuments,
    dsmDocuments,
    loading,
    error,
    refreshDocuments,
    uploadDocument,
  } = useDocuments();
  const { uploadProposals } = useVotingTabulation(activeMeetingId);

  // Render-safe client detection avoids a post-paint flash on hydration.
  const isClientReady = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const previousMeetingIdRef = React.useRef<string | null>(null);

  // ApprovalDrawer state
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  // FileUploadDialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDsmDocument, setSelectedDsmDocument] =
    useState<Document | null>(null);
  const uploadSourceRef = React.useRef<"regular" | "dsm">("regular");

  // DocumentViewer state for fullscreen view
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);

  // VideoPlayerDialog state
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  // Fetch documents from API when meeting changes
  useEffect(() => {
    if (activeMeetingId && previousMeetingIdRef.current !== activeMeetingId) {
      previousMeetingIdRef.current = activeMeetingId;
      void refreshDocuments(activeMeetingId);
    }
  }, [activeMeetingId, refreshDocuments]);

  // Refresh documents when page gains focus or becomes visible
  useEffect(() => {
    let isInitialMount = true;

    const handleFocus = () => {
      if (isInitialMount) {
        isInitialMount = false;
        return;
      }
      if (activeMeetingId) {
        void refreshDocuments(activeMeetingId);
      }
    };

    const handleVisibilityChange = () => {
      if (isInitialMount) {
        isInitialMount = false;
        return;
      }
      if (!document.hidden && activeMeetingId) {
        void refreshDocuments(activeMeetingId);
      }
    };

    const handleDocumentsUploaded = (event: Event) => {
      const customEvent = event as CustomEvent<{ meetingId: string }>;
      if (activeMeetingId && customEvent.detail.meetingId === activeMeetingId) {
        void refreshDocuments(activeMeetingId);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("documentsUploaded", handleDocumentsUploaded);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("documentsUploaded", handleDocumentsUploaded);
    };
  }, [activeMeetingId, refreshDocuments]);

  const handleUpload = () => {
    uploadSourceRef.current = "regular";
    setUploadDialogOpen(true);
  };

  const handleDsmUpload = () => {
    uploadSourceRef.current = "dsm";
    setUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setSelectedDsmDocument(null); // Clear selected document when closing
    uploadSourceRef.current = "regular"; // Reset to default
  };

  const handleFilesUpload = async (
    files: File[],
    associations?: Record<string, string>
  ) => {
    if (!activeMeetingId) {
      throw new Error("No current meeting ID");
    }
    // Check if this is an Agenda upload with Excel/CSV file
    const isAgendaUpload = selectedDsmDocument?.title === "Agenda";
    const file = files[0];
    const isExcelOrCsv =
      file &&
      (file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "text/csv" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".csv"));

    if (isAgendaUpload && isExcelOrCsv) {
      // Parse and upload as proposals
      const proposals = await parseAgendaFile(file);
      await uploadProposals(proposals);
      setUploadDialogOpen(false);
      setSelectedDsmDocument(null);
    } else {
      // Determine document type based on upload source
      const documentType =
        uploadSourceRef.current === "dsm" ? "dsm-document" : "general-document";
      // Upload as document
      await uploadDocument(activeMeetingId, files, documentType, associations);
    }
    setUploadDialogOpen(false);
    setSelectedDsmDocument(null);
  };

  const handleDocumentAction = (doc: Document) => {
    // If this is a placeholder DSM document not yet uploaded, route to upload
    if (doc.status === "NOT_UPLOADED") {
      setSelectedDsmDocument(doc);
      setUploadDialogOpen(true);
      return;
    }
    setSelectedDocument(doc);
    setApprovalDrawerOpen(true);
  };

  const handleApprovalDrawerClose = () => {
    setApprovalDrawerOpen(false);
    setSelectedDocument(null);
  };

  const handleOpenFullscreen = () => {
    // Close approval drawer first, then open document viewer
    setApprovalDrawerOpen(false);
    // Use setTimeout to ensure approval drawer closes before document viewer opens
    setTimeout(() => {
      setDocumentViewerOpen(true);
    }, 50);
  };

  const handleDocumentViewerClose = () => {
    setDocumentViewerOpen(false);
  };

  const handleApproveDocument = async () => {
    if (!selectedDocument) return;

    try {
      // TODO: Implement document approval via API
      handleApprovalDrawerClose();
      if (activeMeetingId) {
        await refreshDocuments(activeMeetingId);
      }
    } catch {
      // Handle error
    }
  };

  // Show error state
  if (error) {
    return (
      <Box
        component="main"
        display="flex"
        flexDirection="column"
        gap={3}
        sx={{ p: 3 }}
      >
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Suspense>
        <Container component="main" maxWidth="xl">
          <Box
            component="main"
            display="flex"
            flexDirection="column"
            gap={3}
            sx={{ p: { xs: 1, sm: 3 } }}
          >
            {/* Main Documents Section */}
            <MainDocumentsCard
              documents={regularDocuments}
              loading={loading}
              isClientReady={isClientReady}
              activeMeetingId={activeMeetingId}
              onUpload={handleUpload}
              onWatchTutorial={() => {
                setVideoDialogOpen(true);
              }}
              onOpenDocument={handleDocumentAction}
            />

            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid size={{ xs: 12, md: 8 }}>
                <DsmSection
                  dsmDocuments={dsmDocuments}
                  loading={loading}
                  onUpload={handleDsmUpload}
                  onOpenDocument={handleDocumentAction}
                  onOpenUploadFor={(doc) => {
                    setSelectedDsmDocument(doc);
                    uploadSourceRef.current = "dsm";
                    setUploadDialogOpen(true);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <DocumentSiteCard />
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Suspense>
      {selectedDocument ? (
        <ApprovalDrawer
          open={approvalDrawerOpen}
          onClose={handleApprovalDrawerClose}
          title={selectedDocument.title ?? "Document"}
          fileUrl={selectedDocument.filePath ?? ""}
          documentId={selectedDocument.id}
          onApprove={handleApproveDocument}
          taskStatus={selectedDocument.status}
          onOpenFullscreen={handleOpenFullscreen}
          onAddComment={() => {
            // Comment functionality not implemented yet
          }}
        />
      ) : null}

      {/* FileUploadDialog for uploading documents */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        onUpload={handleFilesUpload}
        meetingId={activeMeetingId}
        documentType="dsm-document"
        preSelectedDocumentId={selectedDsmDocument?.title}
      />

      {/* Hosting site UI moved to DocumentSiteCard */}

      {/* DocumentViewer for fullscreen document view */}
      {selectedDocument ? (
        <DocumentViewer
          open={documentViewerOpen}
          onClose={handleDocumentViewerClose}
          fileUrl={selectedDocument.filePath ?? ""}
          title={selectedDocument.title ?? "Document"}
          documentId={selectedDocument.id}
        />
      ) : null}

      {/* VideoPlayerDialog for tutorial */}
      <VideoPlayerDialog
        open={videoDialogOpen}
        onClose={() => {
          setVideoDialogOpen(false);
        }}
        title="Uploading and Managing Documents"
        description="Learn how to manage and upload documents for your meeting"
        seriesNumber="#3"
      />
    </>
  );
};

export default DocumentsPage;
