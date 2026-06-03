"use client";

import { Global } from "@emotion/react";
import { Close as CloseIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Snackbar,
  Stack,
  SwipeableDrawer,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { jsPDF } from "jspdf";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";

import type { components } from "@/domain-models/generated-schema";
import type { KeyDate, Task } from "@/types/api-exports";
import type { ContextMenuPosition } from "@/types/common";
import type { TaskLink } from "@/utils/taskLinks";

import TaskEditDialog from "@/components/Dialogs/TaskEditDialog";
import DocumentViewer from "@/components/Documents/DocumentViewer";
import ApprovalDrawer from "@/components/Drawers/ApprovalDrawer";
import DrawerTaskItem from "@/components/Drawers/DrawerTaskItem";
import DrawerHeader from "@/components/Drawers/shared/DrawerHeader";
import { useDrawerDocuments } from "@/components/Drawers/shared/hooks/useDrawerDocuments";
import BNFileDropzone from "@/components/FileUpload/BNFileDropzone";
import BNFilePreview from "@/components/FileUpload/BNFilePreview";
import TaskContextMenu from "@/components/ui/TaskContextMenu";
import { useMeeting } from "@/contexts/MeetingContext";
import buildApiClient from "@/domain-models/apiClient";
import { usePhaseCompletion } from "@/hooks/taskDrawer/usePhaseCompletion";
import { useClients } from "@/hooks/useClients";
import { useDocuments } from "@/hooks/useDocuments";
import { usePhases } from "@/hooks/usePhases";
import { useTasks } from "@/hooks/useTasks";
import { getBrowserSupabase } from "@/lib/browserSupabase";
import { handleFormDownload, handleFormSign } from "@/utils/broadridgeFormHandler";
import { calculateDaysUntil, formatDaysUntil, friendlyDate } from "@/utils/dateUtils";
import {
  handleFormDownload as handlePlanFormDownload,
  handleFormSign as handlePlanFormSign,
} from "@/utils/planFileRequestForm";
import { getDocumentTypeFromTask } from "@/utils/taskControl";
import { determineTaskStatus } from "@/utils/taskControl";
import {
  handleFormDownload as handleTransferAgentDownload,
  handleFormSign as handleTransferAgentSign,
} from "@/utils/transferAgentRequestForm";

import { getPhaseColor } from "../mui-styling/theme";

// Phase URL type for UI
interface PhaseUrl {
  title: string;
  description?: string;
  url?: string;
}

// Swipeable drawer constants
const drawerBleeding = 60;

// Styled components for swipeable drawer
const StyledBox = styled("div")(({ theme }) => ({
  backgroundColor: theme.vars?.palette.background.default,
}));

const Puller = styled("div")(({ theme }) => ({
  width: 30,
  height: 6,
  backgroundColor: theme.vars?.palette.divider ?? "#e0e0e0",
  borderRadius: 3,
  position: "absolute",
  top: 8,
  left: "calc(50% - 15px)",
}));

// Remove duplicate SignatureArea - use from DocumentViewer if needed

interface PhaseDrawerProps {
  open: boolean;
  onClose: () => void;
  phase: number;
  onPhaseChange?: (newPhase: number) => void;
  onTaskClick?: (taskId: string) => void;
}

const PhaseDrawer: React.FC<PhaseDrawerProps> = (props) => {
  const { open, onClose, phase = 1, onPhaseChange } = props;

  // Get active meeting and tasks from context (or defaults if no provider)
  let meetingContextValue = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    meetingContextValue = useMeeting();
  } catch {
    // No MeetingProvider available
  }

  const currentMeeting = meetingContextValue?.currentMeeting ?? null;
  const tasks = React.useMemo(() => meetingContextValue?.tasks ?? [], [meetingContextValue?.tasks]);
  const tasksLoading = meetingContextValue?.tasksLoading ?? false;
  const refreshMeetingData = meetingContextValue?.refreshMeetingData;
  const meetingKeyDates = React.useMemo(
    () => meetingContextValue?.keyDates ?? [],
    [meetingContextValue?.keyDates],
  );
  const setCurrentMeeting = meetingContextValue?.setCurrentMeeting;

  // Session and routing
  const { data: session } = useSession();
  const _router = useRouter();

  // Tasks and documents hooks
  const { updateTaskById, refetch } = useTasks(currentMeeting?.id);
  const { createNewDocument, addDocumentHistory, getDocumentsByMeeting, uploadDocument } =
    useDocuments();

  // Mobile detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Get phases using the proper hook
  const { phases, loading: phaseLoading, error: phaseError } = usePhases(currentMeeting?.id);

  // Get client data for form generation
  const params = useParams();
  const clientTicker = params?.clientTicker as string;

  const { clients } = useClients();
  const currentClient = clients.find((client) => client.ticker === clientTicker);

  const [currentView, setCurrentView] = useState<"overview" | "upload">("overview");

  // Determine current phase from MeetingContext, fallback to prop, then 1
  const currentPhaseNumber = React.useMemo(() => {
    const label = currentMeeting?.currentPhase ?? `Phase ${phase ?? 1}`;
    const parsed = parseInt(label.replace("Phase ", ""));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : (phase ?? 1);
  }, [currentMeeting?.currentPhase, phase]);

  // Use shared document management hook
  const {
    documentViewerOpen,
    documentUrl,
    documentTitle,
    signatureAreas,
    currentDocumentId,
    approvalDrawerOpen,
    approvalDocumentUrl,
    approvalTitle,
    uploadFiles,
    hasUnsupportedFiles,
    pdfFormState,
    setDocumentViewerOpen,
    setDocumentUrl,
    setDocumentTitle,
    setSignatureAreas,
    setCurrentDocumentId,
    handleDocumentViewerClose,
    setApprovalDrawerOpen,
    setApprovalDocumentUrl,
    setApprovalTitle,
    handleApprovalDrawerClose,
    handleFilesSelected,
    handleFileRejections,
    handleFileRemove,
    clearUploadFiles,
    handlePdfStateChange,
    setUploadFiles,
  } = useDrawerDocuments();

  const [uploadTaskTitle, setUploadTaskTitle] = useState("");
  const [currentTaskForUpload, setCurrentTaskForUpload] = useState<Task | null>(null);
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);
  const [mobileUploadOpen, setMobileUploadOpen] = useState(false);
  const [currentTaskForDocument, setCurrentTaskForDocument] = useState<Task | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Context menu states
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [TaskEditDialogOpen, setTaskEditDialogOpen] = useState(false);
  const [tasksWithSignedDocs, setTasksWithSignedDocs] = useState<Set<string>>(new Set());

  // Initialize phase completion hook
  const { checkAndCompletePhase } = usePhaseCompletion({
    currentMeeting,
    session,
    refreshContext: refreshMeetingData,
  });

  // Get theme and phase color using theme palette
  const phaseColor = theme.vars.palette.phase[currentPhaseNumber - 1].main;
  const phaseContrast = theme.vars.palette.phase[currentPhaseNumber - 1].contrastText;

  // Find the current phase data
  const currentPhaseData = phases.find((p) => p.orderIndex === currentPhaseNumber);
  const phaseTitle = currentPhaseData?.name ?? `Phase ${currentPhaseNumber}`;

  // Filter tasks for the current phase from context and cast to TaskWithLinks
  // Memoize filtered tasks for performance
  const phaseTasks = useMemo(
    () => tasks.filter((task) => task.phaseNumber === currentPhaseNumber),
    [tasks, currentPhaseNumber],
  );

  // Check for signed documents for all phase tasks (moved outside useEffect for reuse)
  const checkSignedDocuments = useCallback(async () => {
    if (!currentMeeting?.id || phaseTasks.length === 0) return;

    try {
      const meetingDocuments = await getDocumentsByMeeting(currentMeeting.id);

      const taskIdsWithSignedDocs = new Set<string>();

      phaseTasks.forEach((task) => {
        const matchingDocs = meetingDocuments.filter(
          (doc) => doc.taskId === (task.taskId ?? task.id) && doc.type === "signed-form",
        );

        if (matchingDocs.length > 0) {
          if (task.id) {
            taskIdsWithSignedDocs.add(task.id);
          }
        } else if (
          task.status === "SUBMITTED_AWAITING_RECORD_DATE" ||
          task.status === "PENDING_AUTHORIZATION"
        ) {
          // No signed documents required for these statuses
        }
      });

      setTasksWithSignedDocs(taskIdsWithSignedDocs);
    } catch (error) {
      console.error("Failed to check for signed documents:", error);
    }
  }, [currentMeeting?.id, phaseTasks, getDocumentsByMeeting]);

  // Run check when drawer opens or dependencies change
  React.useEffect(() => {
    if (open) {
      void checkSignedDocuments();
    }
  }, [open, checkSignedDocuments]);

  // Get key dates for current phase from MeetingContext
  const keyDates: KeyDate[] = React.useMemo(() => {
    // Check if phase data has key dates
    if (currentPhaseData?.keyDates && Object.keys(currentPhaseData.keyDates).length > 0) {
      // If phase has specific key dates in the phase data, use those
      const result = Object.entries(currentPhaseData.keyDates)
        .filter(([, value]) => value)
        .map(([key, value]) => ({
          id: key,
          title: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
          phaseNumber: currentPhaseNumber,
          date: value!,
        }));
      if (result.length > 0) {
        return result;
      }
    }

    // Use key dates from MeetingContext (with correct phase assignments)
    // Exclude pre-filing dates
    const filtered = meetingKeyDates.filter((kd) => {
      const title = kd.title?.toLowerCase() ?? "";
      const isPreFiling =
        title.includes("pre-fil") ||
        title.includes("prefil") ||
        title === "pre filing date" ||
        title === "pre-filing date";
      return kd.phaseNumber === currentPhaseNumber && !isPreFiling;
    });

    // If no dates found for the current phase, show dates without phase assignment for debugging
    if (filtered.length === 0 && meetingKeyDates.length > 0) {
      // For phase 1, show only filing date (not pre-filing)
      if (currentPhaseNumber === 1) {
        const phase1Dates = meetingKeyDates.filter((kd) => {
          const title = kd.title?.toLowerCase() ?? "";
          return (
            title.includes("filing") &&
            !title.includes("pre-filing") &&
            !title.includes("pre filing") &&
            !title.includes("prefiling")
          );
        });
        if (phase1Dates.length > 0) {
          return phase1Dates;
        }
      }
    }
    return filtered;
  }, [currentPhaseData, meetingKeyDates, currentPhaseNumber]);

  // URLs would come from phase data if available (currently not in our schema)
  const urls: PhaseUrl[] = [];

  const handleUploadSubmit = async () => {
    if (!currentTaskForUpload || !currentMeeting?.id || uploadFiles.length === 0) {
      return;
    }

    try {
      setIsSubmittingUpload(true);

      // Upload each file to document repository
      for (const uploadFile of uploadFiles) {
        // Update file status to uploading
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: "uploading" as const, progress: 0 } : f,
          ),
        );

        const documentType = getDocumentTypeFromTask(currentTaskForUpload);
        const uploadPath = await uploadDocument(
          uploadFile.file,
          documentType,
          currentMeeting.id,
          uploadFile.file.name,
          currentTaskForUpload.id,
        );

        if (uploadPath === null) {
          // Mark file as error
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "error" as const, error: "Upload failed" }
                : f,
            ),
          );
          throw new Error(`Failed to upload file: ${uploadFile.file.name}`);
        }

        // Mark file as complete
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: "complete" as const, progress: 100 } : f,
          ),
        );
      }

      // Determine appropriate status based on task type
      const newStatus = determineTaskStatus(currentTaskForUpload.title ?? "");

      // Update task status
      if (currentTaskForUpload.id) {
        await updateTaskById(currentTaskForUpload.id, { status: newStatus });
      }

      // Update meeting completion percentage
      if (currentMeeting.id) {
        try {
          const client = await buildApiClient();

          refetch();

          const completedStatuses = [
            "COMPLETE",
            "AUTHORIZED",
            "SUBMITTED_AWAITING_RECORD_DATE",
            "WAITING_FOR_FORM_RETURN",
            "REQUEST_FORM_TO_FOLLOW",
            "PENDING_AUTHORIZATION",
          ];

          const allTasks = tasks;
          const completedTasks = allTasks.filter((t) =>
            completedStatuses.includes(t.status ?? ""),
          ).length;
          const overallCompletion = Math.round((completedTasks / allTasks.length) * 100);

          await client.PUT("/meetings/{meetingId}", {
            params: {
              path: { meetingId: currentMeeting.id },
            },
            body: {
              overallCompletion: overallCompletion,
            },
          });
        } catch (error) {
          console.error("Failed to update meeting completion", error);
        }
      }

      // Check if all tasks in the current phase are complete
      await checkAndCompletePhase(currentTaskForUpload);

      // Clear state and close upload view
      clearUploadFiles();
      setCurrentTaskForUpload(null);
      setUploadTaskTitle("");
      void refreshMeetingData?.();

      if (isMobile) {
        handleMobileUploadClose();
      } else {
        // Return to overview of current phase, not switching phases
        setCurrentView("overview");
      }
    } catch (error) {
      console.error("Failed to submit upload", error);
      setSnackbarMessage("Failed to upload files. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  // Generate filled PDF with form data and signatures
  const generateFilledPDF = (taskTitle: string): Blob => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter",
    });

    // Add header
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${taskTitle} - Completed`, 20, 20);

    // Add form fields data
    let yPosition = 40;
    doc.setFontSize(12);
    doc.text("Form Fields:", 20, yPosition);
    yPosition += 10;

    Object.entries(pdfFormState.formFields).forEach(([fieldId, value]) => {
      if (value) {
        doc.text(`${fieldId}: ${value}`, 25, yPosition);
        yPosition += 8;
      }
    });

    // Add signatures data
    if (Object.keys(pdfFormState.signatures).length > 0) {
      yPosition += 10;
      doc.text("Signatures:", 20, yPosition);
      yPosition += 10;

      Object.entries(pdfFormState.signatures).forEach(([areaId, signature]) => {
        if (signature) {
          doc.text(`${areaId}: [Signed]`, 25, yPosition);
          yPosition += 8;
        }
      });
    }

    // Add completion timestamp
    yPosition += 10;
    doc.text(`Completed: ${new Date().toLocaleString()}`, 20, yPosition);

    return doc.output("blob");
  };

  // Handle task submission with PDF state
  const handleTaskSubmit = async (task: Task) => {
    if (!task) {
      return;
    }

    try {
      // Generate filled PDF
      const pdfBlob = generateFilledPDF(task.title ?? "Task");

      // Upload PDF to Supabase storage
      const fileName = `${task.id}-completed-${Date.now()}.pdf`;
      const filePath = `task-completions/${fileName}`;

      const supabase = getBrowserSupabase();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }

      // Determine appropriate status based on task type
      let newStatus: components["schemas"]["TaskStatus"] = "COMPLETE";
      const taskTitle = task.title?.toLowerCase() ?? "";

      if (taskTitle.includes("broadridge") || taskTitle.includes("ics access")) {
        newStatus = "PENDING_AUTHORIZATION";
      } else if (taskTitle.includes("transfer agent")) {
        newStatus = "SUBMITTED_AWAITING_RECORD_DATE";
      } else if (taskTitle.includes("plan file request")) {
        newStatus = "SUBMITTED_AWAITING_RECORD_DATE";
      }

      // Check if signed document already exists for this task
      let existingSignedDocument = null;
      if (task.meetingId) {
        const meetingDocuments = await getDocumentsByMeeting(task.meetingId);
        existingSignedDocument = meetingDocuments.find(
          (doc) => doc.taskId === (task.taskId ?? task.id) && doc.type === "signed-form",
        );
      }

      // Only create signed document if it doesn't already exist
      if (!existingSignedDocument) {
        const documentData = {
          title: `${task.title} - Signed`,
          description: `Signed document for task: ${task.title}`,
          type: "signed-form",
          file: uploadData.path,
          taskId: task.taskId ?? task.id,
          status: newStatus,
        };

        if (task.meetingId) {
          const newDocument = await createNewDocument(task.meetingId, documentData);
          if (newDocument?.id) {
            await addDocumentHistory(newDocument.id, "UPDATED");
          }

          // Refresh signed documents list to update button labels
          await checkSignedDocuments();
        }
      }

      // Update task status
      if (task.id) {
        try {
          await updateTaskById(task.id, { status: newStatus });
        } catch (error) {
          console.error("Failed to update task status", error);
          throw error;
        }
      }

      // Update meeting completion percentage
      if (currentMeeting?.id) {
        try {
          const client = await buildApiClient();

          refetch();

          const completedStatuses = [
            "COMPLETE",
            "AUTHORIZED",
            "SUBMITTED_AWAITING_RECORD_DATE",
            "WAITING_FOR_FORM_RETURN",
            "REQUEST_FORM_TO_FOLLOW",
            "PENDING_AUTHORIZATION",
          ];

          const allTasks = tasks;
          const completedTasks = allTasks.filter((t) =>
            completedStatuses.includes(t.status ?? ""),
          ).length;
          const overallCompletion = Math.round((completedTasks / allTasks.length) * 100);

          await client.PUT("/meetings/{meetingId}", {
            params: {
              path: { meetingId: currentMeeting.id },
            },
            body: {
              overallCompletion: overallCompletion,
            },
          });
        } catch (error) {
          console.error("Failed to update meeting completion", error);
        }
      }

      // Check if all tasks in the current phase are complete
      await checkAndCompletePhase(task);

      // Clear state and close
      clearUploadFiles();
      void refreshMeetingData?.();
    } catch (error) {
      console.error("Failed to submit task", error);
    }
  };

  const handleTaskLinkClick = useCallback(
    async (link: TaskLink, taskTitle: string, task?: Task) => {
      // Store the task for document submission
      if (task) {
        setCurrentTaskForDocument(task);
      }

      // Ensure required setters are available
      if (
        !setDocumentUrl ||
        !setCurrentDocumentId ||
        !setSignatureAreas ||
        !setDocumentViewerOpen
      ) {
        return;
      }

      // Create client data inside the handler to ensure latest meeting data (following TaskDrawer pattern)
      const clientData = currentClient
        ? {
            issuerName: currentClient.company_name ?? currentClient.short_name ?? "",
            cusipNumber: currentMeeting?.cusip ?? undefined,
            contactName: currentClient.primary_contact ?? "",
            email: currentClient.primary_contact_email ?? "",
            meetingDate: currentMeeting?.meetingDate ?? undefined,
            ticker: currentClient.ticker ?? undefined,
          }
        : undefined;

      console.log(
        "[PhaseDrawer] handleTaskLinkClick clientData:",
        clientData,
        "currentClient:",
        currentClient,
      );

      // Check which type of form task this is
      const isPlanFileRequestTask = taskTitle?.includes("Plan File Request");
      const isTransferAgentTask = taskTitle?.includes("Transfer Agent");

      switch (link.action) {
        case "signature":
          if (link.url) {
            // Generic signature link with URL - open for viewing only (no signature areas)
            setDocumentUrl(link.url);
            setDocumentTitle(taskTitle);
            setCurrentDocumentId(`doc-${Date.now()}-${link.url.replace(/[^a-zA-Z0-9]/g, "-")}`);
            setSignatureAreas([]); // No signature areas for generic links
            setDocumentViewerOpen(true);
          } else if (link.label === "View Form") {
            // View signed form document
            if (task?.meetingId && task?.id) {
              try {
                const meetingDocuments = await getDocumentsByMeeting(task.meetingId);
                const signedDoc = meetingDocuments.find(
                  (doc) => doc.taskId === (task.taskId ?? task.id) && doc.type === "signed-form",
                );

                if (signedDoc?.filePath) {
                  const { getStoragePublicUrl } = await import("@/utils/documentUtils");
                  const documentUrl = getStoragePublicUrl(signedDoc.filePath);

                  setDocumentUrl(documentUrl);
                  setDocumentTitle(taskTitle);
                  setCurrentDocumentId(signedDoc.id ?? "");
                  setSignatureAreas([]); // No signature areas for view-only
                  setDocumentViewerOpen(true);
                }
              } catch (error) {
                console.error("Failed to load signed form:", error);
              }
            }
          } else if (link.label === "Sign Form") {
            // Use appropriate handler based on task type
            const signHandler = isPlanFileRequestTask
              ? handlePlanFormSign
              : isTransferAgentTask
                ? handleTransferAgentSign
                : handleFormSign;
            await signHandler({
              onDocumentOpen: (documentUrl, documentId, signatureAreas) => {
                setDocumentUrl(documentUrl);
                setDocumentTitle(taskTitle);
                setCurrentDocumentId(documentId);
                setSignatureAreas(signatureAreas);
                setDocumentViewerOpen(true);
              },
              clientData,
            });
          }
          break;

        case "upload":
          setUploadTaskTitle(taskTitle);
          setCurrentTaskForUpload(task ?? null);
          if (isMobile) {
            setMobileUploadOpen(true);
          } else {
            setCurrentView("upload");
          }
          break;

        case "download":
          if (link.url) {
            window.open(link.url, "_blank");
          } else if (link.label === "Download") {
            // Use appropriate handler based on task type
            if (isPlanFileRequestTask) {
              await handlePlanFormDownload(clientData);
            } else if (isTransferAgentTask) {
              await handleTransferAgentDownload(clientData);
            } else {
              await handleFormDownload(clientData);
            }
          }
          break;

        case "authorize":
        case "external":
        default:
          if (link.url) {
            window.open(link.url, "_blank");
          }
          break;
      }
    },
    [
      isMobile,
      currentClient,
      currentMeeting,
      getDocumentsByMeeting,
      setDocumentUrl,
      setDocumentTitle,
      setCurrentDocumentId,
      setSignatureAreas,
      setDocumentViewerOpen,
    ],
  );

  const handleTaskApprovalClick = useCallback(
    (task: Task) => {
      if (task.type === "approve" && Array.isArray(task.links) && task.links[0]) {
        const firstLink = task.links[0] as { url?: string };
        if (firstLink.url) {
          setApprovalDocumentUrl(firstLink.url);
          setApprovalTitle(task.title ?? "Approval Task");
          setApprovalDrawerOpen(true);
        }
      }
    },
    [setApprovalDocumentUrl, setApprovalTitle, setApprovalDrawerOpen],
  );

  const handleBackToOverview = () => {
    setCurrentView("overview");
    clearUploadFiles();
    setUploadTaskTitle("");
    setCurrentTaskForUpload(null);
    setMobileUploadOpen(false);
  };

  const handleMobileUploadClose = () => {
    setMobileUploadOpen(false);
    clearUploadFiles();
    setUploadTaskTitle("");
    setCurrentTaskForUpload(null);
  };

  const toggleMobileUpload = (newOpen: boolean) => () => {
    setMobileUploadOpen(newOpen);
  };

  const handleMainDrawerClose = () => {
    setCurrentView("overview");
    clearUploadFiles();
    setUploadTaskTitle("");
    setCurrentTaskForUpload(null);
    onClose();
  };

  const handleApprove = useCallback(() => {
    // Handle approval logic here
    handleApprovalDrawerClose();
  }, [handleApprovalDrawerClose]);

  // Context menu handlers - memoized for performance
  const handleTaskRightClick = useCallback((event: React.MouseEvent, task: Task) => {
    event.preventDefault();
    setSelectedTask(task);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
    setSelectedTask(null);
  }, []);

  const handleTaskEdit = useCallback(() => {
    if (selectedTask) {
      setTaskEditDialogOpen(true);
      handleContextMenuClose();
    }
  }, [selectedTask, handleContextMenuClose]);

  const handleTaskEditDialogClose = useCallback(() => {
    setTaskEditDialogOpen(false);
  }, []);

  const handleTaskUpdated = useCallback(() => {
    // Refresh meeting data (including tasks) after task update
    void refreshMeetingData?.();
  }, [refreshMeetingData]);

  const handlePhaseNavigation = useCallback(
    (direction: "prev" | "next") => {
      const maxPhase = 8; // We have 8 phases
      const next =
        direction === "prev"
          ? Math.max(1, currentPhaseNumber - 1)
          : Math.min(maxPhase, currentPhaseNumber + 1);

      // Update MeetingContext.currentMeeting.currentPhase so all openers stay in sync
      if (currentMeeting && setCurrentMeeting) {
        setCurrentMeeting({
          ...currentMeeting,
          currentPhase: `Phase ${next}`,
        });
      }

      onPhaseChange?.(next);
    },
    [currentPhaseNumber, currentMeeting, setCurrentMeeting, onPhaseChange],
  );

  const renderMobileUploadDrawer = () => (
    <>
      <Global
        styles={{
          ".MuiDrawer-root > .MuiPaper-root": {
            height: `100%`,
            overflow: "visible",
          },
        }}
      />
      <SwipeableDrawer
        anchor="bottom"
        open={mobileUploadOpen}
        onClose={toggleMobileUpload(false)}
        onOpen={toggleMobileUpload(true)}
        swipeAreaWidth={drawerBleeding}
        disableSwipeToOpen={false}
        keepMounted
        ModalProps={{
          disableEnforceFocus: true,
        }}
        sx={{
          boxShadow: theme.shadows[10],
        }}
      >
        <StyledBox
          sx={{
            position: "absolute",
            top: -drawerBleeding,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            visibility: "visible",

            border: "1px solid",
            borderColor: theme.vars.palette.divider,
            right: 0,
            left: 0,
            height: drawerBleeding,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Puller />
        </StyledBox>
        <StyledBox sx={{ height: "100%", overflow: "hidden" }}>{renderUploadContent()}</StyledBox>
      </SwipeableDrawer>
    </>
  );

  const renderUploadContent = () => (
    <Stack sx={{ height: "100%" }}>
      {/* Header */}
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: theme.vars.palette.divider,
          p: 2,
          height: 60,
        })}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            noWrap
            variant="h6"
            sx={{
              fontSize: "18px",
              fontWeight: 500,
              maxWidth: 300,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {uploadTaskTitle ?? "Upload Form"}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={isMobile ? handleMobileUploadClose : handleBackToOverview}
          aria-label="Close upload view and return to overview"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Upload Area */}
      <Box sx={{ m: 3 }}>
        <Box sx={{ height: 300 }}>
          <BNFileDropzone
            onFilesSelected={handleFilesSelected}
            onFileRejections={handleFileRejections}
            maxFiles={5}
            maxSize={25 * 1024 * 1024} // 25MB to match API limit
            acceptedFileTypes={[".docx", ".doc", ".xlsx", ".pdf"]}
            multiple={true}
            linkText="Browse files"
            hasUnsupportedFiles={hasUnsupportedFiles}
          />
        </Box>

        {/* File Previews */}
        {uploadFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Stack spacing={1}>
              {uploadFiles.map((uploadFile) => (
                <BNFilePreview
                  key={uploadFile.id}
                  file={{
                    id: uploadFile.id,
                    file: uploadFile.file,
                    status: uploadFile.status,
                    progress: uploadFile.progress,
                    error: uploadFile.error,
                  }}
                  onRemove={handleFileRemove}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Submit Button */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "flex-end",
          borderTop: "1px solid rgba(31, 30, 28, 0.12)",
        }}
      >
        <Button
          variant="contained"
          disabled={uploadFiles.length === 0 || isSubmittingUpload}
          onClick={handleUploadSubmit}
        >
          {isSubmittingUpload ? "Submitting..." : `Submit File${uploadFiles.length > 1 ? "s" : ""}`}
        </Button>
      </Box>
    </Stack>
  );

  const renderUploadSection = () => renderUploadContent();

  const renderOverviewSection = () => (
    <Stack sx={{ height: "100%" }}>
      {/* Header */}
      <DrawerHeader
        title={`Phase ${currentPhaseNumber} Overview`}
        onClose={handleMainDrawerClose}
        navigation={{
          current: currentPhaseNumber,
          total: 8,
          onPrevious: () => handlePhaseNavigation("prev"),
          onNext: () => handlePhaseNavigation("next"),
        }}
      />

      {/* Phase Bar */}
      <Box
        sx={{
          backgroundColor: getPhaseColor(currentPhaseNumber),
          color: phaseContrast,
          px: 2,
          py: 1,
          fontSize: "14px",
          fontWeight: 500,
          textAlign: "left",
        }}
      >
        Phase {currentPhaseNumber}: {phaseTitle}
      </Box>
      {/* Linear Progress Loader */}
      {(phaseLoading || tasksLoading) && (
        <LinearProgress
          aria-label="Loading phase data"
          color={`phase[${currentPhaseNumber}].main` as "primary"}
          sx={{
            height: 4,
          }}
        />
      )}

      {/* Content */}
      <Box
        sx={{ p: 2, flexGrow: 1, overflow: "auto" }}
        tabIndex={0}
        role="region"
        aria-label={`Phase ${currentPhaseNumber} content`}
      >
        {phaseError ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 200,
            }}
          >
            <Typography variant="body3" color="error">
              Error loading phase data: {phaseError}
            </Typography>
          </Box>
        ) : phaseLoading || tasksLoading ? (
          <Box /> // Empty box while loading to hide old content
        ) : (
          <Stack spacing={2}>
            {/* Key Dates */}
            {keyDates.length > 0 && (
              <>
                <Typography variant="body3" fontWeight={500} sx={{ fontSize: "14px" }}>
                  {currentPhaseNumber === 7 ? "Tabulation Reports" : "Key Dates"}
                </Typography>

                {keyDates.map((keyDate: KeyDate) => (
                  <Card
                    key={keyDate.id}
                    elevation={5}
                    sx={(theme) => ({
                      background: theme.vars.palette.keydate.dark,
                      color: theme.vars.palette.common.white,
                      borderLeft: `6px solid ${theme.vars.palette.keydate.main}`,
                    })}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" sx={{ color: "#CCE5FF", fontWeight: 500 }}>
                        {friendlyDate(keyDate.date ?? "")}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, my: 0.5 }}>
                        {keyDate.title}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                        {formatDaysUntil(calculateDaysUntil(keyDate.date ?? ""))}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}

                {/* Phase-specific description after key dates */}
                {currentPhaseNumber === 2 && (
                  <Typography
                    variant="body3"
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: "14px", lineHeight: 1.6 }}
                  >
                    The Broker Search distribution signals the start of Phase 2 in your proxy
                    meeting project. The search ensures all necessary parties are aware of the
                    upcoming record date. Additionally, BetaNXT is now fully authorized to receive
                    all pertinent files related to shareholder mailings and tabulations.
                  </Typography>
                )}
                {currentPhaseNumber === 4 && (
                  <Typography
                    variant="body3"
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: "14px", lineHeight: 1.6 }}
                  >
                    Once the Record Date is reached, we will need to collect the required files
                    listed below. Final print quantities can only be confirmed after all files are
                    securely uploaded to our system. Typically, these tasks take approximately 3–4
                    business days to complete. The urgency of these tasks will depend on the
                    proximity to your Mailing Date. As that date approaches, you may experience an
                    increased need for timely responses and actions.
                  </Typography>
                )}
                {currentPhaseNumber === 5 && (
                  <Typography
                    variant="body3"
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: "14px", lineHeight: 1.6 }}
                  >
                    As your mailing date approaches, you will notice an increase in automated emails
                    from broker intermediary firms as we update their portal. You may disregard
                    these emails, regardless of their frequency. We have direct access to their
                    systems and already possess the information they are providing to you.
                  </Typography>
                )}
                {/* Phase-specific description after key dates */}
                {currentPhaseNumber === 6 && (
                  <Typography
                    variant="body3"
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: "14px", lineHeight: 1.6 }}
                  >
                    Once the mailing process is finalized, mailing affidavits will be delivered
                    shortly thereafter for your legal and record-keeping purposes. Please note,
                    mailing affidavits are not provided for beneficial holder distributions;
                    however, we proactively confirm that these beneficial mailings have been
                    completed by the relevant intermediaries according to applicable guidelines.
                  </Typography>
                )}
                {currentPhaseNumber === 7 && (
                  <Typography
                    variant="body3"
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: "14px", lineHeight: 1.6 }}
                  >
                    Tabulation reports will be sent to you daily beginning 10-15 days prior to your
                    meeting. Please keep in mind you can always log in to our online portal to view
                    real-time results on demand.
                  </Typography>
                )}
              </>
            )}

            {/* Tasks */}
            <Stack spacing={2}>
              {phaseTasks.map((task) => {
                const isCompleted = task.status === "COMPLETE";
                const hasSignedDoc = task.id ? tasksWithSignedDocs.has(task.id) : false;

                // Modify task links if signed document exists
                const modifiedTask: Task =
                  hasSignedDoc && task.links && Array.isArray(task.links)
                    ? {
                        ...task,
                        links: (task.links as TaskLink[]).map((link: TaskLink) => {
                          if (link.action === "signature" && link.label === "Sign Form") {
                            return { ...link, label: "View Form" };
                          }
                          return link;
                        }) as unknown as Record<string, unknown>,
                      }
                    : task;

                return (
                  <DrawerTaskItem
                    key={task.id}
                    task={modifiedTask}
                    phaseColor={phaseColor}
                    isCompleted={isCompleted}
                    onContextMenu={(e) => handleTaskRightClick(e, task)}
                    onClick={
                      task.type === "approve" ? () => handleTaskApprovalClick(task) : undefined
                    }
                    onStatusUpdate={handleTaskUpdated}
                    onLinkClick={(link, taskTitle) => handleTaskLinkClick(link, taskTitle, task)}
                  />
                );
              })}
            </Stack>

            {/* URLs Section */}
            {urls.length > 0 && (
              <>
                <Divider />
                {urls.map((urlItem: PhaseUrl, index: number) => (
                  <Box key={index}>
                    <Typography variant="body3" fontWeight={500} sx={{ mb: 1 }}>
                      {urlItem.title}
                    </Typography>
                    <Typography
                      variant="body3"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      {urlItem.description}
                    </Typography>
                    {urlItem.url && (
                      <Link href={urlItem.url} target="_blank" rel="noopener noreferrer">
                        {urlItem.url}
                      </Link>
                    )}
                  </Box>
                ))}
              </>
            )}
            {currentPhaseNumber === 5 && (
              <Typography
                variant="body3"
                color="text.secondary"
                sx={{ mt: 1, fontSize: "14px", lineHeight: 1.6 }}
              >
                IMPORTANT: As master tabulator, we do our due diligence to make sure that the shares
                we&apos;ve received from your transfer agent match the total outstanding shares
                presented in your proxy statement. Once you have that final number please provide it
                to your BetaNXT contact at your earliest convenience.
              </Typography>
            )}
            {currentPhaseNumber === 6 && (
              <>
                <Typography variant="body3" fontWeight={500} sx={{ mt: 2 }}>
                  Access to MIC
                </Typography>
                <Typography
                  variant="body3"
                  color="text.secondary"
                  sx={{ mt: 1, fontSize: "14px", lineHeight: 1.6 }}
                >
                  IMPORTANT: Confirmed company representatives should have access to BetaNXT&apos;s
                  Online Voting Portal (MIC) to view real-time voting and other reports.
                </Typography>
                <Link
                  href="https://www.mediantonline.com/mic/login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.mediantonline.com/mic/login
                </Link>
              </>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  );

  return (
    <Drawer
      anchor="left"
      elevation={10}
      open={open}
      onClose={handleMainDrawerClose}
      keepMounted={false}
      sx={{
        zIndex: 100,
      }}
      slotProps={{
        paper: {
          sx: {
            height: "100%",
            borderRadius: "0px 4px 4px 0px",
            boxShadow:
              "0px 8px 10px -5px rgba(0, 0, 0, 0.08), 0px 16px 24px 2px rgba(0, 0, 0, 0.05), 0px 6px 30px 5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
            alignItems: "center",
          },
        },
      }}
      ModalProps={{
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
        BackdropProps: {
          sx: {
            zIndex: -1,
            background: "rgba(0, 0, 0, 0.5)",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "row",
        }}
      >
        {/* Overview Content */}
        <Box className="overview-content" sx={{ height: "100%", width: isMobile ? "100%" : 600 }}>
          {renderOverviewSection()}
        </Box>

        {/* Upload Content - Desktop only */}
        {!isMobile && (
          <Collapse
            orientation="horizontal"
            in={currentView === "upload"}
            mountOnEnter
            unmountOnExit
          >
            <Paper
              sx={(theme) => ({
                width: 450,
                height: "100%",
                borderLeft: `1px solid ${theme.vars.palette.divider}`,
              })}
            >
              {renderUploadSection()}
            </Paper>
          </Collapse>
        )}
      </Box>

      {/* Document Viewer Modal */}
      <DocumentViewer
        open={documentViewerOpen}
        onClose={handleDocumentViewerClose}
        fileUrl={documentUrl}
        title={documentTitle}
        signatureAreas={signatureAreas}
        documentId={currentDocumentId}
        taskId={currentTaskForDocument?.id ?? currentTaskForDocument?.taskId}
        task={
          currentTaskForDocument
            ? {
                id: currentTaskForDocument.id ?? "",
                task_id: currentTaskForDocument.taskId ?? currentTaskForDocument.id,
                title: currentTaskForDocument.title ?? "Document",
                type: currentTaskForDocument.type,
                meeting_id: currentTaskForDocument.meetingId,
              }
            : undefined
        }
        documentType="signature"
        onPdfStateChange={handlePdfStateChange}
        onSubmitSuccess={async () => {
          if (!currentTaskForDocument) return;

          // Handle task submission with the current task
          await handleTaskSubmit(currentTaskForDocument);

          // Close the document viewer
          handleDocumentViewerClose();
        }}
      />

      {/* Approval Drawer */}
      <ApprovalDrawer
        open={approvalDrawerOpen}
        onClose={handleApprovalDrawerClose}
        title={approvalTitle}
        fileUrl={approvalDocumentUrl}
        onApprove={handleApprove}
        onAddComment={() => {
          // Comment functionality not implemented yet
        }}
      />

      {/* Context Menu */}
      <TaskContextMenu
        open={contextMenu !== null}
        position={contextMenu}
        onClose={handleContextMenuClose}
        onEdit={handleTaskEdit}
      />

      {/* Task Edit Modal - Only render when needed for performance */}
      {(TaskEditDialogOpen || selectedTask) && (
        <TaskEditDialog
          open={TaskEditDialogOpen}
          onClose={handleTaskEditDialogClose}
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
          onRefresh={refreshMeetingData}
          enableLinkEditing={true}
        />
      )}

      {/* Mobile Upload Drawer */}
      {isMobile && renderMobileUploadDrawer()}

      {/* Phase Completion Success Alert */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{
            width: "100%",
            maxWidth: "600px",
            boxShadow: 3,
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Drawer>
  );
};

export default PhaseDrawer;
