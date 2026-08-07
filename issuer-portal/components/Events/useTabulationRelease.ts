"use client";

import { useCallback, useState } from "react";

import buildApiClient from "@/domain-models/apiClient";

export interface TabulationReleaseFeedback {
  readonly message: string;
  readonly severity: "error" | "success" | "warning";
}

export interface TabulationReleaseProgress {
  readonly completed: number;
  readonly total: number;
}

export interface UseTabulationReleaseResult {
  /** Clears the banner after the user dismisses it. */
  readonly clearFeedback: () => void;
  readonly feedback: TabulationReleaseFeedback | null;
  /** Meeting ids with an in-flight write, so their chips can show as busy. */
  readonly pendingMeetingIds: ReadonlySet<string>;
  /** Non-null only while a batch is running. */
  readonly progress: TabulationReleaseProgress | null;
  readonly setTabulationReleased: (
    meetingIds: readonly string[],
    released: boolean
  ) => Promise<void>;
}

interface UseTabulationReleaseOptions {
  /**
   * Called with the ids that actually persisted, so the caller can patch its
   * cache. Never called with the ids that failed.
   */
  readonly onReleased: (
    meetingIds: readonly string[],
    released: boolean
  ) => void;
}

const EMPTY_PENDING: ReadonlySet<string> = new Set<string>();

const buildFeedback = (
  succeededCount: number,
  total: number,
  released: boolean
): TabulationReleaseFeedback => {
  const verb = released ? "Released" : "Hid";
  const noun = total === 1 ? "event" : "events";

  if (succeededCount === total) {
    return {
      message: `${verb} tabulation for ${String(total)} ${noun}.`,
      severity: "success",
    };
  }

  if (succeededCount === 0) {
    return {
      message: `Could not update tabulation for ${String(total)} ${noun}. Nothing was changed.`,
      severity: "error",
    };
  }

  return {
    message: `${verb} tabulation for ${String(succeededCount)} of ${String(total)} ${noun}. ${String(
      total - succeededCount
    )} failed — try again.`,
    severity: "warning",
  };
};

/**
 * Writes `tabulationReleased` for one or many meetings.
 *
 * Every meeting is written independently and settled with `allSettled`, so a
 * single rejected row never aborts the rest of a batch; the caller is told how
 * many landed and only the successful ids are handed back for a cache patch.
 */
export const useTabulationRelease = ({
  onReleased,
}: UseTabulationReleaseOptions): UseTabulationReleaseResult => {
  const [pendingMeetingIds, setPendingMeetingIds] =
    useState<ReadonlySet<string>>(EMPTY_PENDING);
  const [progress, setProgress] = useState<TabulationReleaseProgress | null>(
    null
  );
  const [feedback, setFeedback] = useState<TabulationReleaseFeedback | null>(
    null
  );

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const setTabulationReleased = useCallback(
    async (meetingIds: readonly string[], released: boolean) => {
      const targets = [...new Set<string>(meetingIds)];
      if (targets.length === 0) {
        return;
      }

      setPendingMeetingIds(new Set<string>(targets));
      setProgress({ completed: 0, total: targets.length });
      setFeedback(null);

      const api = await buildApiClient();

      const markSettled = () => {
        setProgress((current) =>
          current === null
            ? current
            : { completed: current.completed + 1, total: current.total }
        );
      };

      const results = await Promise.allSettled(
        targets.map(async (meetingId) => {
          try {
            const { error } = await api.PUT("/meetings/{meetingId}", {
              params: { path: { meetingId } },
              body: { tabulationReleased: released },
            });

            if (error) {
              throw new Error(`Failed to update meeting ${meetingId}`);
            }
          } finally {
            markSettled();
          }
        })
      );

      const succeeded: string[] = [];
      for (const [index, result] of results.entries()) {
        const meetingId = targets[index];
        if (result.status === "fulfilled" && meetingId !== undefined) {
          succeeded.push(meetingId);
        }
      }

      if (succeeded.length > 0) {
        onReleased(succeeded, released);
      }

      setFeedback(buildFeedback(succeeded.length, targets.length, released));
      setPendingMeetingIds(EMPTY_PENDING);
      setProgress(null);
    },
    [onReleased]
  );

  return {
    clearFeedback,
    feedback,
    pendingMeetingIds,
    progress,
    setTabulationReleased,
  };
};
