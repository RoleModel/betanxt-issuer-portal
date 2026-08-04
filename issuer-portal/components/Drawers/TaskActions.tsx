"use client";

import { Box, Checkbox, FormControlLabel, Link, Stack } from "@mui/material";

import type { components } from "@/domain-models/generated-schema";
import type { TaskLink } from "@/utils/taskLinks";

import { getStoragePublicUrl } from "@/utils/documentUtils";
import { getTaskActionButtonLabel } from "@/utils/taskControl";
import { findSignedDocumentForTask } from "@/utils/taskDrawer/documentMatching";
import { isDTCCAuthorizationTask } from "@/utils/taskTransformers";

type Task = components["schemas"]["Task"];
type Document = components["schemas"]["Document"];

interface TaskActionsProps {
  task: Task;
  taskLinks: TaskLink[];
  hasSignedDocument: boolean;
  checkingSignedDocument: boolean;
  dtccAuthorized: boolean;
  onLinkClick: (link: TaskLink) => void;
  onDtccAuthorizationChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  getDocumentsByMeeting: (meetingId: string) => Promise<Document[]>;
  setDocumentUrl: (url: string) => void;
  setCurrentDocumentId: (id: string) => void;
  setSignatureAreas: (areas: never[]) => void;
  setDocumentViewerOpen: (open: boolean) => void;
}

const TaskActions: React.FC<TaskActionsProps> = ({
  task,
  taskLinks,
  hasSignedDocument,
  checkingSignedDocument,
  dtccAuthorized,
  onLinkClick,
  onDtccAuthorizationChange,
  getDocumentsByMeeting,
  setDocumentUrl,
  setCurrentDocumentId,
  setSignatureAreas,
  setDocumentViewerOpen,
}) => {
  // Only show actions for issuer-owned tasks
  if (!taskLinks.length || ["BetaNXT", "DFIN"].includes(task.owner ?? "")) {
    return null;
  }

  const handleViewSignedDocument = async () => {
    if (!task.meetingId) return;

    const meetingDocuments = await getDocumentsByMeeting(task.meetingId);
    const signedDoc = findSignedDocumentForTask(task, meetingDocuments);

    if (signedDoc?.filePath) {
      const documentUrl = getStoragePublicUrl(signedDoc.filePath);
      setDocumentUrl(documentUrl);
      setCurrentDocumentId(signedDoc.id ?? "");
      setSignatureAreas([]);
      setDocumentViewerOpen(true);
    } else {
      console.error("[TaskActions] Document search failed:", {
        taskId: task.id,
        taskIdField: task.taskId,
        taskTitle: task.title,
        taskStatus: task.status,
        meetingId: task.meetingId,
        documentsFound: meetingDocuments.length,
        documentTypes: meetingDocuments.map((d) => ({
          id: d.id,
          type: d.type,
          title: d.title,
          taskId: d.taskId,
        })),
      });
      alert(
        `No signed document found for this task.\n\nTask: ${task.title}\nStatus: ${task.status}\n\nPlease check the browser console for details.`
      );
    }
  };

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
      {taskLinks.map((link, linkIndex) => {
        // Don't render signature buttons while checking for signed documents
        if (checkingSignedDocument && link.action === "signature") {
          return null;
        }

        // For signature tasks that have a signed document, show "View" button instead
        if (hasSignedDocument && link.action === "signature") {
          const viewLabel = getTaskActionButtonLabel(task.title ?? "", true);

          return (
            <Link
              sx={{ cursor: "pointer" }}
              key={linkIndex}
              onClick={handleViewSignedDocument}
            >
              {viewLabel}
            </Link>
          );
        }

        // Skip upload action buttons - handled by dropzone in TaskDrawer
        if (link.action === "upload") {
          return null;
        }

        // Make sign and download actions clickable even without direct URL
        const isClickable =
          link.url || link.action === "signature" || link.action === "download";

        return isClickable ? (
          <Link
            key={linkIndex}
            onClick={() => {
              onLinkClick(link);
            }}
            sx={{ cursor: "pointer" }}
          >
            {link.label}
          </Link>
        ) : null;
      })}

      {/* DTCC Authorization Checkbox */}
      {isDTCCAuthorizationTask(task) && (
        <Box sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                color="secondary"
                checked={dtccAuthorized}
                onChange={onDtccAuthorizationChange}
                size="small"
              />
            }
            label="Authorization confirmed"
          />
        </Box>
      )}
    </Stack>
  );
};

export default TaskActions;
