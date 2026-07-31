"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import FileSearchIcon from "@rolemodel/betanxt-design-system/components/icons/brand/FileSearchIcon";
import React from "react";

import type { components } from "@/domain-models/generated-schema";

import EmptyState from "@/components/EmptyState";
import FileUploadDialog from "@/components/FileUpload/FileUploadDialog";
import SkeletonTable from "@/components/ui/SkeletonTable";
import SROnlyTableCaption from "@/components/ui/SROnlyTableCaption";
import buildApiClient from "@/domain-models/apiClient";
import { documentRepository } from "@/domain-models/documentRepository";
import { getBrowserSupabase } from "@/lib/browserSupabase";
import { getStoragePublicUrl } from "@/utils/documentUtils";
import { bytesToSize } from "@/utils/number-utilities";

type Meeting = components["schemas"]["Meeting"];
type Document = components["schemas"]["Document"];

interface SecureFileTransferTableProps {
  readonly clientTicker: string;
  readonly showHeader?: boolean;
  readonly maxHeight?: number | string;
}

const formatModified = (doc: Document): string => {
  const raw = doc.updatedAt || doc.uploadedDate || doc.createdAt;
  if (!raw) return "";
  const d = new Date(raw);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const SecureFileTransferTable = ({
  clientTicker,
  showHeader = true,
  maxHeight,
}: SecureFileTransferTableProps) => {
  const [meetingId, setMeetingId] = React.useState<string | null>(null);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [measuredSizes, setMeasuredSizes] = React.useState<
    Record<string, number>
  >({});
  const [deleteDoc, setDeleteDoc] = React.useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const fetchMeetingAndDocuments = React.useCallback(async () => {
    try {
      setLoading(true);
      const api = await buildApiClient();
      const { data } = await api.GET("/meetings", {
        params: { query: { ticker: clientTicker.toUpperCase() } },
      });
      const meetings = Array.isArray(data)
        ? (data as Meeting[])
        : (data && (data as { meetings?: Meeting[] }).meetings) || [];
      const active = meetings.find((m) => m.status === "ACTIVE") || meetings[0];
      const uploadTargetId = active?.id ?? null;
      setMeetingId(uploadTargetId);

      const meetingIds = meetings.flatMap((m) => (m.id ? [m.id] : []));
      if (meetingIds.length > 0) {
        const allDocsArrays = await Promise.all(
          meetingIds.map(
            async (id) => await documentRepository.listByMeeting(id)
          )
        );
        const combined = allDocsArrays.flat().filter((d) => {
          const title = (d.title ?? "").trim().toLowerCase();
          const isHostingTitle = title === "document hosting site";
          const isHostingType = (d.type ?? "") === "HOSTING_SITE";
          return !isHostingTitle && !isHostingType;
        });
        combined.sort((a, b) => {
          const ad = new Date(
            a.updatedAt || a.uploadedDate || a.createdAt || ""
          ).getTime();
          const bd = new Date(
            b.updatedAt || b.uploadedDate || b.createdAt || ""
          ).getTime();
          return bd - ad;
        });
        setDocuments(combined);
      } else {
        setDocuments([]);
      }
    } finally {
      setLoading(false);
    }
  }, [clientTicker]);

  React.useEffect(() => {
    void fetchMeetingAndDocuments();
  }, [fetchMeetingAndDocuments]);

  React.useEffect(() => {
    const controller = new AbortController();
    const measure = async () => {
      const targets = documents.filter(
        (d) => (!d.fileSize || d.fileSize === 0) && !!d.filePath
      );
      if (targets.length === 0) return;
      const results = await Promise.all(
        targets.map(async (d) => {
          const url = getStoragePublicUrl(d.filePath ?? "");
          const key = d.id && d.id.length > 0 ? d.id : d.filePath || "";
          if (!key) return { key: "", size: 0 };
          try {
            const resp = await fetch(url, {
              method: "HEAD",
              signal: controller.signal,
            });
            const len = Number(resp.headers.get("content-length") || "0");
            return { key, size: Number.isFinite(len) ? len : 0 };
          } catch {
            return { key, size: 0 };
          }
        })
      );
      if (controller.signal.aborted) return;
      setMeasuredSizes((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          if (r.key && r.size > 0) next[r.key] = r.size;
        });
        return next;
      });
    };
    void measure();
    return () => {
      controller.abort();
    };
  }, [documents]);

  const handleDelete = async (docId: string) => {
    const supabase = getBrowserSupabase();
    await supabase.from("document").delete().eq("id", docId);
    void fetchMeetingAndDocuments();
  };

  const handleUpload = async (
    files: File[],
    _associations?: Record<string, string>,
    description?: string
  ) => {
    if (!meetingId) return;
    await Promise.all(
      files.map(
        async (file) =>
          await documentRepository.uploadVersion({
            meetingId,
            documentType: "general-document",
            file,
            versionNotes: description,
          })
      )
    );
    setUploadOpen(false);
    void fetchMeetingAndDocuments();
  };

  // Filter documents based on search query
  const filteredDocuments = React.useMemo(() => {
    if (!searchQuery.trim()) return documents;

    const query = searchQuery.toLowerCase().trim();
    return documents.filter((doc) => {
      const title = (doc.title || "").toLowerCase();
      const type = (doc.type || "").toLowerCase();
      const fileName = doc.filePath
        ? (doc.filePath.split("/").pop() || "").toLowerCase()
        : "";

      return (
        title.includes(query) ||
        type.includes(query) ||
        fileName.includes(query)
      );
    });
  }, [documents, searchQuery]);

  if (loading) {
    return (
      <Card>
        {showHeader ? <CardHeader title="Secure File Transfer" /> : null}
        <CardContent sx={{ p: 0 }}>
          <SkeletonTable columns={4} rows={6} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader ? <CardHeader title="Secure File Transfer" /> : null}
      <SecureFileTransferToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={() => {
          setUploadOpen(true);
        }}
        showHeader={showHeader}
      />
      <CardContent sx={{ p: 0 }}>
        {filteredDocuments.length === 0 ? (
          <EmptyState
            title="No files have been uploaded."
            icon={<FileSearchIcon />}
          />
        ) : (
          <SecureFileTransferList
            documents={filteredDocuments}
            measuredSizes={measuredSizes}
            maxHeight={maxHeight}
            onRequestDelete={setDeleteDoc}
          />
        )}
      </CardContent>

      <FileUploadDialog
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
        }}
        onUpload={async (files, associations) => {
          await handleUpload(files, associations);
        }}
        onUploadWithNotes={handleUpload}
        meetingId={meetingId ?? undefined}
        documentType="general-document"
      />

      <DeleteDocumentDialog
        doc={deleteDoc}
        onClose={() => {
          setDeleteDoc(null);
        }}
        onConfirm={handleDelete}
      />
    </Card>
  );
};

interface SecureFileTransferToolbarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly onUploadClick: () => void;
  readonly showHeader: boolean;
}

const SecureFileTransferToolbar = ({
  searchQuery,
  onSearchChange,
  onUploadClick,
  showHeader,
}: SecureFileTransferToolbarProps) => {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: 2, pt: showHeader ? 0 : 3, pb: 2 }}
    >
      <TextField
        size="small"
        placeholder="Search files..."
        value={searchQuery}
        onChange={(e) => {
          onSearchChange(e.target.value);
        }}
        slotProps={{
          input: {
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
            ),
          },
        }}
      />
      <Button variant="contained" onClick={onUploadClick}>
        Upload
      </Button>
    </Stack>
  );
};

interface SecureFileTransferListProps {
  readonly documents: readonly Document[];
  readonly measuredSizes: Record<string, number>;
  readonly maxHeight?: number | string;
  readonly onRequestDelete: (doc: Document) => void;
}

const SecureFileTransferList = ({
  documents,
  measuredSizes,
  maxHeight,
  onRequestDelete,
}: SecureFileTransferListProps) => {
  return (
    <TableContainer sx={{ maxHeight }}>
      <Table stickyHeader>
        <SROnlyTableCaption>Secure file transfer</SROnlyTableCaption>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, py: 2 }}>
              File Downloads
            </TableCell>
            <TableCell sx={{ fontWeight: 600, py: 2 }}>File Size</TableCell>
            <TableCell sx={{ fontWeight: 600, py: 2 }}>Modified Date</TableCell>
            <TableCell sx={{ fontWeight: 600, py: 2 }}>Delete</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.map((doc) => {
            const href = doc.filePath ? getStoragePublicUrl(doc.filePath) : "";
            const name =
              doc.title ||
              (doc.filePath ? (doc.filePath.split("/").pop() ?? "") : "");
            return (
              <TableRow key={doc.id} hover>
                <TableCell size="small">
                  <Button
                    variant="text"
                    color="info"
                    component="a"
                    href={href}
                    target="_blank"
                    disabled={!href}
                  >
                    {name || "Download"}
                  </Button>
                </TableCell>
                <TableCell size="small">
                  <Typography variant="body3" color="text.secondary">
                    {bytesToSize(
                      doc.fileSize ??
                        measuredSizes[doc.id || doc.filePath || ""] ??
                        0
                    )}
                  </Typography>
                </TableCell>
                <TableCell size="small">
                  <Typography variant="body3">{formatModified(doc)}</Typography>
                </TableCell>
                <TableCell size="small">
                  <IconButton
                    aria-label="Delete file"
                    color="error"
                    onClick={() => {
                      onRequestDelete(doc);
                    }}
                  >
                    <DeleteOutlined />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface DeleteDocumentDialogProps {
  readonly doc: Document | null;
  readonly onClose: () => void;
  readonly onConfirm: (docId: string) => Promise<void>;
}

const DeleteDocumentDialog = ({
  doc,
  onClose,
  onConfirm,
}: DeleteDocumentDialogProps) => {
  return (
    <Dialog open={Boolean(doc)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {`Delete ${doc?.title || (doc?.filePath ? (doc?.filePath.split("/").pop() ?? "") : "") || ""}?`}
      </DialogTitle>
      <DialogContent>
        <Typography>You will not be able to undo this action</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="primary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            if (doc?.id) {
              await onConfirm(doc.id);
            }
            onClose();
          }}
        >
          Yes, delete it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SecureFileTransferTable;
