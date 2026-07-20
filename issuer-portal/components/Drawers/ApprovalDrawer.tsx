"use client";

import {
  ChevronLeftOutlined as ChevronLeftIcon,
  ChevronRightOutlined as ChevronRightIcon,
  Close as CloseIcon,
  CommentOutlined as CommentIcon,
  DownloadOutlined as DownloadIcon,
  HistoryOutlined as HistoryOulinedIcon,
  OpenInFullOutlined as OpenInFullOutlinedIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import ReactAudioPlayer from "react-audio-player";

import OfficeDocumentViewer from "@/components/Documents/OfficeDocumentViewer";
import PDFViewer from "@/components/Documents/PDFViewer";
import StatusChip from "@/components/ui/StatusChip";
import {
  type DocumentComment,
  type DocumentHistoryEvent,
  useDocuments,
} from "@/hooks/useDocuments";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

interface DocumentHistoryEntryUI {
  action: string;
  userName: string;
  timestamp: string;
}

interface ApprovalDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
  onApprove: () => void;
  taskStatus?: string | null;
  onOpenFullscreen?: () => void;
  reviewCount?: number;
  totalReviews?: number;
  onAddComment: (comment: string) => void;
  documentId?: string;
}

interface CommentWithUser {
  id: string;
  comment: string;
  user: string;
  first_name: string;
  last_name: string;
  created_at: string;
  users: {
    avatar: string | null;
  } | null;
}

const ApprovalDrawer: React.FC<ApprovalDrawerProps> = ({
  open,
  onClose,
  title,
  fileUrl,
  onApprove,
  taskStatus = "Pending Approval",
  onOpenFullscreen,
  reviewCount,
  totalReviews,
  onAddComment,
  documentId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [documentHistory, setDocumentHistory] = useState<
    DocumentHistoryEntryUI[]
  >([]);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    null
  );
  const [comment, setComment] = useState("");
  const [showCommentField, setShowCommentField] = useState(false);

  // Get current user from NextAuth
  const { data: session } = useSession();
  const { getCommentsForDocument, addCommentToDocument, getDocumentHistory } =
    useDocuments();

  // Reset state when drawer opens/closes
  React.useEffect(() => {
    if (open) {
      setCurrentPage(1);
      setShowHistory(false);
      setShowComments(false);
      setShowCommentField(false);
      setComment("");
      // Don't clear comments here - they will be loaded in the next useEffect
      // Use passed documentId or generate one for the session
      const docId = documentId ?? `temp-doc-${Date.now()}`;
      setCurrentDocumentId(docId);
    }
  }, [open, documentId]);

  // Fetch document history and comments when drawer opens
  React.useEffect(() => {
    const loadDocumentData = async () => {
      if (open && currentDocumentId) {
        try {
          // Load comments for the document
          const fetchedComments =
            await getCommentsForDocument(currentDocumentId);
          // Map comments with safe fallbacks but preserve typing
          const transformedComments: CommentWithUser[] = fetchedComments.map(
            (c: DocumentComment) => ({
              id: c.id,
              comment: c.comment,
              user: c.user,
              first_name: c.first_name,
              last_name: c.last_name,
              created_at: c.created_at,
              users: c.users ?? { avatar: null },
            })
          );
          setComments(transformedComments);

          const history = await getDocumentHistory(currentDocumentId);
          const transformedHistory: DocumentHistoryEntryUI[] = history.map(
            (h: DocumentHistoryEvent) => ({
              action: h.event_type,
              userName: h.user,
              timestamp: h.timestamp,
            })
          );
          setDocumentHistory(transformedHistory);
        } catch (err) {
          console.error("Error loading document data:", err);
          // Don't clear existing comments or history on error
        }
      }
    };

    void loadDocumentData();
  }, [open, currentDocumentId, getCommentsForDocument, getDocumentHistory]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.min(Math.max(1, newPage), numPages));
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    const fileExtension = fileUrl?.split(".").pop()?.toLowerCase() || "pdf";
    link.download = `${title}.${fileExtension}`;
    link.click();
  };

  const handleHistory = () => {
    setShowHistory(!showHistory);
    setShowComments(false);
  };

  const handleComments = () => {
    setShowComments(!showComments);
    setShowHistory(false);
  };

  const handleFullscreen = () => {
    if (onOpenFullscreen) {
      onOpenFullscreen();
    } else {
      console.warn("ApprovalDrawer: onOpenFullscreen prop is not provided");
      // Fallback: close the drawer if no onOpenFullscreen handler
      onClose();
    }

    // Let the parent component handle closing this drawer
  };

  const handleAddComment = () => {
    setShowCommentField(true);
    // Smooth scroll to bottom when comment field appears
    setTimeout(() => {
      const commentsContainer = document.querySelector(
        "[data-comments-container]"
      );
      if (commentsContainer) {
        commentsContainer.scrollTo({
          top: commentsContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const handleSubmitComment = async () => {
    if (!comment.trim()) {
      console.error("ApprovalDrawer: Comment is empty");
      return;
    }

    if (!currentDocumentId) {
      console.error("ApprovalDrawer: No document ID available");
      return;
    }

    // Remove the username check for now since NextAuth might not have username
    // if (!session?.user?.username) {
    //   console.error('No current user available')
    //   return
    // }

    try {
      // Extract user info from session
      const firstName = (session?.user?.name ?? "").split(" ")[0] || "User";
      const lastName =
        (session?.user?.name ?? "").split(" ").slice(1).join(" ") || "";
      const userId = session?.user?.email ?? session?.user?.id ?? "unknown";

      // Use hook to add comment
      await addCommentToDocument(currentDocumentId, comment.trim(), {
        firstName,
        lastName,
        userId,
      });

      // Create optimistic comment for immediate UI update
      const optimisticComment: CommentWithUser = {
        id: `temp-${Date.now()}`,
        comment: comment.trim(),
        user: session?.user?.email ?? session?.user?.name ?? "Current User",
        first_name: (session?.user?.name ?? "").split(" ")[0] || "User",
        last_name:
          (session?.user?.name ?? "").split(" ").slice(1).join(" ") || "",
        created_at: new Date().toISOString(),
        users: null,
      };

      // Add new comment to the top of the list
      setComments((prev) => [optimisticComment, ...prev]);

      // Call parent's onAddComment for any additional handling
      onAddComment(comment.trim());

      setComment("");
      setShowCommentField(false);
    } catch (err) {
      console.error("Error submitting comment:", err);
    }
  };

  // Helper function to format timestamps
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours =
      Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return (
        date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }) + ", Today"
      );
    } else {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  return (
    <Drawer
      anchor="left"
      variant="temporary"
      open={open}
      onClose={onClose}
      elevation={8}
      sx={{
        zIndex: 1400, // Higher than other drawers
      }}
      ModalProps={{
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
      }}
      slotProps={{
        paper: {
          sx: {
            width: "100%",
            maxWidth: 550,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          pl: 3,
          background: theme.vars.palette.primary.main,
          color: theme.vars.palette.primary.contrastText,
          borderBottom: `1px solid`,
          borderColor: theme.vars.palette.divider,
        })}
      >
        <Typography variant="h3">{title}</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "inherit" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Icon Toolbar */}
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "end",
          gap: 2,
          p: 1,
          borderBottom: `1px solid`,
          borderColor: theme.vars.palette.divider,
          background: theme.vars.palette.appBar.background,
        })}
      >
        {/* Page Navigation */}
        <Box
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            gap: 0,
            color: theme.vars.palette.appBar.defaultContrast,
            flexGrow: "1",
          })}
        >
          <IconButton
            size="small"
            color="inherit"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            sx={{
              "&.Mui-disabled": {
                color: (theme) => theme.vars.palette.appBar.defaultContrast,
                opacity: 0.5,
              },
            }}
          >
            <ChevronLeftIcon fontSize="medium" />
          </IconButton>
          <Typography variant="caption">
            Page {currentPage} of {numPages}
          </Typography>
          <IconButton
            size="small"
            color="inherit"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= numPages}
            sx={{
              "&.Mui-disabled": {
                color: (theme) => theme.vars.palette.common.white,
                opacity: 0.4,
              },
            }}
          >
            <ChevronRightIcon fontSize="medium" />
          </IconButton>
        </Box>
        <Tooltip title="View in Fullscreen">
          <IconButton
            size="small"
            onClick={handleFullscreen}
            sx={{ color: "white" }}
          >
            <OpenInFullOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Comments">
          <IconButton
            size="small"
            onClick={handleComments}
            sx={{ color: "white" }}
          >
            <CommentIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="History">
          <IconButton
            size="small"
            onClick={handleHistory}
            sx={{ color: "white" }}
          >
            <HistoryOulinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download">
          <IconButton
            size="small"
            onClick={handleDownload}
            sx={{ color: "white" }}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Status Chip and Page Navigation */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          pb: 1,
        }}
      >
        <StatusChip
          status={taskStatus}
          size="small"
          reviewCount={reviewCount}
          totalReviews={totalReviews}
          sx={{
            fontSize: "12px",
            height: 20,
            fontWeight: 500,
          }}
        />
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          display: "flex",
          overflow: "hidden",
          height: "100%",
          flexDirection: "column",
          flexShrink: 1,
          position: "relative",
        }}
      >
        {/* PDF Viewer */}
        <Box
          sx={{
            p: 2,
            pt: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "start",
            alignItems: "center",
            overflow: "auto",
          }}
        >
          <Box
            sx={{
              p: 2,
              width: "100%",
              "& .react-pdf__Document": {
                padding: 1,
              },
              "& .react-pdf__Page": {
                maxHeight: 100,
              },
            }}
          >
            {(() => {
              // Extract file extension, handling URLs with query parameters and data URLs
              let fileExtension: string | undefined;
              let isPdf = false;

              // Check if it's a data URL (base64 encoded)
              if (fileUrl?.startsWith("data:")) {
                const mimeType = fileUrl.split(";")[0].split(":")[1];
                isPdf = mimeType === "application/pdf";
                fileExtension = mimeType?.split("/")[1]; // e.g., 'pdf' from 'application/pdf'
              } else {
                // Regular URL - extract extension from filename
                const urlWithoutQuery = fileUrl?.split("?")[0] ?? "";
                fileExtension = urlWithoutQuery.split(".").pop()?.toLowerCase();
                isPdf =
                  fileExtension === "pdf" || fileUrl?.includes("/test-pdf");
              }
              const isOfficeDoc = [
                "doc",
                "docx",
                "xls",
                "xlsx",
                "ppt",
                "pptx",
              ].includes(fileExtension ?? "");
              const isAudio = ["m4a", "mp3", "wav", "aac"].includes(
                fileExtension ?? ""
              );
              const isVideo = ["mp4", "webm", "ogg"].includes(
                fileExtension ?? ""
              );

              if (isPdf) {
                // Convert relative storage paths to full Supabase URLs
                let pdfUrl = fileUrl;
                if (fileUrl?.startsWith("/storage/v1/object/public/")) {
                  const supabaseUrl =
                    process.env.NEXT_PUBLIC_SUPABASE_URL ||
                    "http://127.0.0.1:54321";
                  pdfUrl = `${supabaseUrl}${fileUrl}`;
                }

                return (
                  <PDFViewer
                    file={pdfUrl}
                    pageNumber={currentPage}
                    onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
                  />
                );
              } else if (isOfficeDoc) {
                // For Excel files, provide download option since preview is often problematic
                if (fileExtension === "xls" || fileExtension === "xlsx") {
                  return (
                    <Box sx={{ p: 4, textAlign: "center", width: "100%" }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          mx: "auto",
                          mb: 3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "success.main",
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="h4" color="success.contrastText">
                          {fileExtension === "xlsx" ? "XLSX" : "XLS"}
                        </Typography>
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {title ?? "Excel Spreadsheet"}
                      </Typography>
                      <Typography
                        variant="body3"
                        color="text.secondary"
                        paragraph
                      >
                        Download to view this Excel file.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleDownload}
                        startIcon={<DownloadIcon />}
                        size="large"
                        sx={{ mt: 2 }}
                      >
                        Download Excel File
                      </Button>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 2, display: "block" }}
                      >
                        File type: {fileExtension?.toUpperCase()}
                      </Typography>
                    </Box>
                  );
                } else {
                  // Use react-doc-viewer for Word and PowerPoint docs
                  return (
                    <OfficeDocumentViewer
                      url={fileUrl}
                      title={title}
                      fileType={fileExtension}
                    />
                  );
                }
              } else if (isAudio) {
                return (
                  <Box sx={{ p: 2, width: "100%" }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, textAlign: "center" }}
                    >
                      {title}
                    </Typography>
                    <ReactAudioPlayer
                      src={fileUrl}
                      controls
                      style={{ width: "100%" }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 2, display: "block", textAlign: "center" }}
                    >
                      Audio file: {fileExtension?.toUpperCase()}
                    </Typography>
                  </Box>
                );
              } else if (isVideo) {
                return (
                  <Box sx={{ p: 2, width: "100%" }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, textAlign: "center" }}
                    >
                      {title}
                    </Typography>
                    <Box
                      sx={{
                        position: "relative",
                        paddingTop: "56.25%" /* 16:9 aspect ratio */,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        <ReactPlayer
                          src={fileUrl}
                          controls
                          width="100%"
                          height="100%"
                          playing={false}
                        />
                      </div>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 2, display: "block", textAlign: "center" }}
                    >
                      Video file: {fileExtension?.toUpperCase()}
                    </Typography>
                  </Box>
                );
              } else {
                return (
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body3" color="text.secondary">
                      This file type cannot be previewed
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = fileUrl;
                        link.download = title ?? "document";
                        link.click();
                      }}
                      sx={{ mt: 2 }}
                    >
                      Download File
                    </Button>
                  </Box>
                );
              }
            })()}
          </Box>
        </Box>
        {/* Approve Button - only show for documents that need approval */}
        {!showComments &&
          !showHistory &&
          taskStatus !== "Complete" &&
          taskStatus !== "COMPLETE" &&
          taskStatus !== "Approved" &&
          taskStatus !== "APPROVED" &&
          taskStatus !== "Awaiting Review" &&
          taskStatus !== "AWAITING_REVIEW" &&
          taskStatus !== "Signed" &&
          taskStatus !== "SIGNED" &&
          taskStatus !== "Uploaded" &&
          taskStatus !== "UPLOADED" && (
            <Box
              sx={(theme) => ({
                p: 1,
                zIndex: 10,
                display: "flex",
                justifyContent: "end",
                borderTop: `1px solid ${theme.vars.palette.divider}`,
              })}
            >
              <Button
                variant="contained"
                size="large"
                color="success"
                onClick={onApprove}
              >
                Approve Document
              </Button>
            </Box>
          )}
      </Box>
      {/* History Side Panel */}
      <Box
        sx={(theme) => ({
          width: "100%",
          background: (theme) => theme.vars.palette.background.paper,
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          bottom: 0,
          height: "50%",
          maxHeight: showHistory ? "60%" : "0%",
          overflowY: "auto",
          left: 0,
          zIndex: 1200,
          transition: theme.transitions.create(["max-height"]),
        })}
      >
        <Box
          sx={{
            px: 2,
            py: 0.5,
            background: (theme) => theme.vars.palette.appBar.background,
            color: (theme) => theme.vars.palette.appBar.defaultContrast,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body3">Document History</Typography>
          <IconButton
            size="small"
            onClick={handleHistory}
            sx={{ color: "inherit" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {documentHistory && documentHistory.length > 0 ? (
            documentHistory.map((historyItem, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={historyItem.action}
                  secondary={`${historyItem.userName}: ${formatTimestamp(historyItem.timestamp)}`}
                />
              </ListItem>
            ))
          ) : (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body3" color="text.secondary">
                No history available
              </Typography>
            </Box>
          )}
        </List>
      </Box>

      {/* Comments Side Panel */}

      <Box
        sx={(theme) => ({
          width: "100%",
          background: (theme) => theme.vars.palette.background.paper,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "absolute",
          bottom: 0,
          maxHeight: showComments ? "50%" : "0%",
          overflowY: "auto",
          left: 0,
          transition: theme.transitions.create(["top", "max-height"]),
        })}
      >
        <Box
          sx={{
            px: 2,
            py: 0.5,
            background: (theme) => theme.vars.palette.appBar.background,
            color: (theme) => theme.vars.palette.appBar.defaultContrast,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 100,
          }}
        >
          <Typography variant="body3">Comments</Typography>
          <IconButton
            size="small"
            onClick={handleComments}
            sx={{ color: "inherit" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box
          sx={{ p: 1, flex: 1, overflow: "auto", height: "100%" }}
          data-comments-container
        >
          <List>
            {comments.length > 0 ? (
              comments.map((commentItem) => (
                <ListItem key={commentItem.id} divider>
                  <ListItemAvatar>
                    <Avatar
                      src={commentItem.users?.avatar || undefined}
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: (theme) =>
                          theme.vars.palette.secondary.main,
                        borderRadius: 1,
                      }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        component="span"
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          component="span"
                          variant="body3"
                          fontWeight={500}
                        >
                          {`${commentItem.first_name} ${commentItem.last_name}`}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body3"
                          color="text.secondary"
                        >
                          {formatTimestamp(commentItem.created_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={commentItem.comment}
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography
                      variant="body3"
                      color="text.secondary"
                      align="center"
                    >
                      No comments yet
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
          <Box
            sx={(theme) => ({
              display: "flex",
              flexDirection: "column",
              gap: 2,
              alignItems: "end",
              width: "100%",
              background: theme.vars.palette.background.paper,
            })}
          >
            {showCommentField && (
              <TextField
                label="Add Comment"
                aria-label="Add Comment"
                variant="outlined"
                size="small"
                fullWidth
                multiline
                rows={6}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                autoFocus
              />
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                if (showCommentField) {
                  void handleSubmitComment();
                } else {
                  handleAddComment();
                }
              }}
            >
              {showCommentField ? "Submit Comment" : "Add Comment"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ApprovalDrawer;
