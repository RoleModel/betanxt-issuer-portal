"use client";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import MailingAffidavitSection from "@/components/Meeting/MailingAffidavitSection";
import MailingStatusTimeline from "@/components/Meeting/MailingStatusTimeline";
import {
  formatMailingStatusDate,
  hasNonEmptyString,
  WORKFLOW_STEPS,
  type MailingStatus,
  type MailingTimelineDates,
  type WorkflowStep,
} from "@/components/Meeting/mailingTimeline";
import buildApiClient from "@/domain-models/apiClient";

type UpdateMeetingRequest = components["schemas"]["UpdateMeetingRequest"];

export type { MailingStatus } from "@/components/Meeting/mailingTimeline";

interface MailingTimelineCardProps {
  readonly brokerSearchDate?: string | null;
  readonly currentStatus?: MailingStatus | null;
  readonly meetingId?: string;
  readonly mailingDate?: string | null;
  readonly onStatusChange?: (newStatus: MailingStatus) => void;
  readonly preFilingDate?: string | null;
  readonly recordDate?: string | null;
}

const MailingTimelineCard = ({
  brokerSearchDate,
  currentStatus,
  meetingId,
  mailingDate,
  onStatusChange,
  preFilingDate,
  recordDate,
}: MailingTimelineCardProps) => {
  const { data: session } = useSession();
  const isCSM = session?.user?.type === "CSM";
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<MailingStatus | null>(
    null
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [localStatus, setLocalStatus] = useState<
    MailingStatus | null | undefined
  >(undefined);

  const displayStatus = localStatus === undefined ? currentStatus : localStatus;
  const activeIndex =
    displayStatus !== null && displayStatus !== undefined
      ? WORKFLOW_STEPS.findIndex((step) => step.label === displayStatus)
      : -1;
  const timelineDates: MailingTimelineDates = {
    "Preparing for Mailing": formatMailingStatusDate(preFilingDate),
    "Proofing & Approval": formatMailingStatusDate(brokerSearchDate),
    "Mailing In Progress": formatMailingStatusDate(recordDate),
    "Mailing Completed": formatMailingStatusDate(mailingDate),
  };

  const handleStatusStepClick = (step: WorkflowStep) => {
    if (!isCSM || !hasNonEmptyString(meetingId)) return;

    setPendingStatus(step.label);
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (pendingStatus === null || !hasNonEmptyString(meetingId)) return;

    setIsUpdatingStatus(true);
    try {
      const apiClient = await buildApiClient();
      const body: UpdateMeetingRequest = { mailingStatus: pendingStatus };

      await apiClient.PUT("/meetings/{meetingId}", {
        params: { path: { meetingId } },
        body,
      });
      setLocalStatus(pendingStatus);
      onStatusChange?.(pendingStatus);
      setStatusDialogOpen(false);
      setPendingStatus(null);
      setIsUpdatingStatus(false);
    } catch {
      // Update failed; dialog stays open for retry.
      setIsUpdatingStatus(false);
    }
  };

  const closeStatusDialog = () => {
    if (isUpdatingStatus) return;

    setStatusDialogOpen(false);
    setPendingStatus(null);
  };

  return (
    <>
      <MailingStatusTimeline
        activeIndex={activeIndex}
        isCSM={isCSM}
        isUpdatingStatus={isUpdatingStatus}
        meetingId={meetingId}
        onStepClick={handleStatusStepClick}
        timelineDates={timelineDates}
      />
      <MailingAffidavitSection isCSM={isCSM} meetingId={meetingId} />
      <Dialog
        open={statusDialogOpen}
        onClose={closeStatusDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Update Mailing Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Set the mailing timeline status to <strong>{pendingStatus}</strong>?
          </DialogContentText>
          <Select
            fullWidth
            size="small"
            value={pendingStatus ?? ""}
            onChange={(event) => {
              setPendingStatus(event.target.value);
            }}
          >
            {WORKFLOW_STEPS.map((step) => (
              <MenuItem key={step.label} value={step.label}>
                {step.label}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={closeStatusDialog}
            disabled={isUpdatingStatus}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={pendingStatus === null || isUpdatingStatus}
            onClick={handleStatusUpdate}
            startIcon={
              isUpdatingStatus ? <CircularProgress size={16} /> : undefined
            }
          >
            {isUpdatingStatus ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MailingTimelineCard;
