"use client";

import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import { useState } from "react";

import type { TabulationEmailPreviewData } from "@/hooks/use-tabulation-report-email-preview";
import type { UseTabulationReportReviewResult } from "@/hooks/use-tabulation-report-review";
import type { ReviewQueueItem } from "@/hooks/use-tabulation-review-queue";

import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { useTabulationReportEmailPreview } from "@/hooks/use-tabulation-report-email-preview";
import { useTabulationReportReview } from "@/hooks/use-tabulation-report-review";
import { useTabulationReviewQueue } from "@/hooks/use-tabulation-review-queue";
import { useTabulationReviewSelection } from "@/hooks/use-tabulation-review-selection";

interface UseTabulationReviewWorkspaceOptions {
  readonly initialMeetingId: string | null;
  readonly onClose: () => void;
}

export interface UseTabulationReviewWorkspaceResult {
  readonly effectiveSelectedId: string | null;
  readonly emailPreview: TabulationEmailPreviewData | null;
  readonly gateDescription: string;
  readonly gateOpen: boolean;
  readonly gateTitle: string;
  readonly handleClose: () => void;
  readonly handleCloseQueue: () => void;
  readonly handleOpenQueue: () => void;
  readonly handleSelectReport: (meetingId: string) => void;
  readonly isCSM: boolean;
  readonly isQueueDrawer: boolean;
  readonly loading: boolean;
  readonly pendingItems: ReviewQueueItem[];
  readonly progress: number;
  readonly progressColor: "success" | "warning";
  readonly progressLabel: string;
  readonly queueOpen: boolean;
  readonly review: UseTabulationReportReviewResult;
  readonly selected: ReviewQueueItem | null;
  readonly titleLabel: string;
  readonly verifiedItems: ReviewQueueItem[];
}

/**
 * Owns the full-screen tabulation review shell state: CSM gate checks,
 * report queue selection, mobile drawer state, progress labels, and
 * post-verification advancement to the next pending report.
 */
export const useTabulationReviewWorkspace = ({
  initialMeetingId,
  onClose,
}: UseTabulationReviewWorkspaceOptions): UseTabulationReviewWorkspaceResult => {
  const { data: session } = useSession();
  const theme = useTheme();
  const isQueueDrawer = useMediaQuery(theme.breakpoints.down("md"));
  const [queueOpen, setQueueOpen] = useState(false);
  const { flags, isLoading: flagsLoading } = useFeatureFlags();
  const { applyReview, items, loading, remaining, verifiedCount } = useTabulationReviewQueue();
  const { effectiveSelectedId, pendingItems, resetSelection, select, selected, verifiedItems } =
    useTabulationReviewSelection(items, initialMeetingId);

  const isCSM = session?.user?.type === "CSM";
  const gateOpen = isCSM && (flagsLoading || flags.enableCsmTabulationApproval);

  const handlePersisted = async (meetingId: string, reviewPayload: ReviewQueueItem["review"]) => {
    if (reviewPayload === null) {
      return;
    }
    const updatedItems = await applyReview(meetingId, reviewPayload);
    if (reviewPayload.status === "VERIFIED") {
      const nextPending = (updatedItems ?? items).find(
        (item) => !item.verified && item.meetingId !== meetingId,
      );
      if (nextPending !== undefined) {
        select(nextPending.meetingId);
      }
    }
  };

  const review = useTabulationReportReview(selected, handlePersisted);
  const emailPreview = useTabulationReportEmailPreview(selected, review.rows);

  const handleClose = () => {
    setQueueOpen(false);
    resetSelection();
    onClose();
  };

  const handleSelectReport = (meetingId: string) => {
    select(meetingId);
    if (isQueueDrawer) {
      setQueueOpen(false);
    }
  };

  const total = items.length;
  const progress = total === 0 ? 0 : (verifiedCount / total) * 100;
  const progressLabel =
    remaining === 0
      ? isQueueDrawer
        ? "All verified"
        : "All reports verified"
      : isQueueDrawer
        ? `${verifiedCount}/${total}`
        : `${verifiedCount} of ${total} verified`;
  const gateTitle = isCSM ? "Tabulation review is not enabled" : "Restricted area";
  const gateDescription = isCSM
    ? "Turn on the enable-csm-tabulation-approval flag in the Vercel Flags dashboard to use the review workflow."
    : "Tabulation report review is available to BetaNXT client success managers only.";

  return {
    effectiveSelectedId,
    emailPreview,
    gateDescription,
    gateOpen,
    gateTitle,
    handleClose,
    handleCloseQueue: () => {
      setQueueOpen(false);
    },
    handleOpenQueue: () => {
      setQueueOpen(true);
    },
    handleSelectReport,
    isCSM,
    isQueueDrawer,
    loading,
    pendingItems,
    progress,
    progressColor: remaining === 0 ? "success" : "warning",
    progressLabel,
    queueOpen,
    review,
    selected,
    titleLabel: isQueueDrawer ? "Tab Review" : "Tabulation Report Review",
    verifiedItems,
  };
};
