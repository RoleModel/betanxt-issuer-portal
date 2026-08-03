"use client";

import { useState } from "react";

import type { ReviewQueueItem } from "@/hooks/use-tabulation-review-queue";

export interface UseTabulationReviewSelectionResult {
  effectiveSelectedId: string | null;
  pendingItems: ReviewQueueItem[];
  resetSelection: () => void;
  select: (meetingId: string) => void;
  selected: ReviewQueueItem | null;
  verifiedItems: ReviewQueueItem[];
}

/**
 * Derives which report is selected in the review workspace: an explicit
 * click always wins, otherwise the deep-linked `initialMeetingId`, otherwise
 * the first report still needing review.
 */
export const useTabulationReviewSelection = (
  items: ReviewQueueItem[],
  initialMeetingId: string | null,
): UseTabulationReviewSelectionResult => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pendingItems = items.filter((item) => !item.verified);
  const verifiedItems = items.filter((item) => item.verified);

  const requestedItem =
    initialMeetingId === null
      ? undefined
      : items.find((item) => item.meetingId === initialMeetingId);
  const fallbackItem = pendingItems.at(0) ?? items.at(0);
  const effectiveSelectedId =
    selectedId ?? requestedItem?.meetingId ?? fallbackItem?.meetingId ?? null;
  const selected = items.find((item) => item.meetingId === effectiveSelectedId) ?? null;

  return {
    effectiveSelectedId,
    pendingItems,
    resetSelection: () => {
      setSelectedId(null);
    },
    select: setSelectedId,
    selected,
    verifiedItems,
  };
};
