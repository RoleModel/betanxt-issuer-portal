"use client";

import { Alert, Button } from "@mui/material";

import type { ReviewQueueItem } from "@/hooks/use-tabulation-review-queue";

interface VerifiedBannerProps {
  readonly item: ReviewQueueItem;
  readonly onReopen: () => void;
  readonly saving: boolean;
}

/** Shows the recorded reviewer metadata for a verified tabulation report. */
export const VerifiedBanner = ({ item, onReopen, saving }: VerifiedBannerProps) => (
  <Alert
    action={
      <Button color="inherit" disabled={saving} onClick={onReopen} size="small">
        Reopen review
      </Button>
    }
    severity="success"
  >
    Verified
    {item.review?.reviewedBy == null ? "" : ` by ${item.review.reviewedBy}`}
    {item.review?.reviewedAt == null
      ? ""
      : ` on ${new Date(item.review.reviewedAt).toLocaleString()}`}
    .
  </Alert>
);
