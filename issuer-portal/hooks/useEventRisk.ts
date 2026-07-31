/* eslint-disable unicorn/filename-case, github/filenames-match-regex -- Filename intentionally stays camelCase: every other hook in `hooks/` (and the import in app/events/page.tsx) follows `useXxx.ts`, so renaming this one file to kebab-case would make the directory less consistent, not more. */
"use client";

import useSWR from "swr";

import { buildApiClient } from "@/domain-models/apiClient";
import { asRecord, asString } from "@/utils/typeUtils";

export type EventRiskLevel = "AT_RISK" | "ON_SCHEDULE";

/** Local date as YYYY-MM-DD. A task due today is not yet late. */
const todayIsoDate = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const pageLimit = 1000;

interface UseEventRiskResult {
  /** Meeting ids that have at least one overdue, unfinished task. */
  readonly atRiskMeetingIds: ReadonlySet<string>;
  readonly loading: boolean;
}

/**
 * Resolves which meetings are behind schedule.
 *
 * Uses the cross-meeting `GET /tasks` endpoint so the events index costs one
 * request rather than one per row. The "still open" rule (which statuses count
 * as done) lives on the server behind `openOnly`, and the overdue cutoff is
 * pushed down as `dueBefore` — so the response only ever contains tasks that
 * actually put a meeting at risk.
 */
export const useEventRisk = (): UseEventRiskResult => {
  const { data, isLoading } = useSWR(
    "/event-risk/overdue-tasks",
    async (): Promise<ReadonlySet<string>> => {
      const api = await buildApiClient();
      const atRisk = new Set<string>();
      let page = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        // Pagination is inherently sequential here: the next page number is only
        // worth requesting once the previous response reports how many pages
        // exist, so these requests cannot be issued in parallel.
        // eslint-disable-next-line no-await-in-loop -- sequential pagination, see comment above
        const { data: payload, error } = await api.GET("/tasks", {
          params: {
            query: {
              dueBefore: todayIsoDate(),
              limit: pageLimit,
              openOnly: true,
              page,
            },
          },
        });

        // `CombinedPaths` in domain-models/apiClient.ts intersects two path maps,
        // which collapses openapi-fetch's response union so TypeScript infers
        // both `payload` and `error` as `undefined`. That inference is wrong at
        // runtime (a 401/500 really does populate `error`), so this guard is live
        // defensive code, not a dead branch.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions -- degenerate openapi-fetch types, see comment above
        if (error || !payload) {
          break;
        }

        const payloadRecord = asRecord(payload);
        const tasks = Array.isArray(payloadRecord?.tasks)
          ? payloadRecord.tasks
          : [];

        for (const task of tasks) {
          const meetingId = asString(asRecord(task)?.meetingId);
          if (meetingId !== null && meetingId.length > 0) {
            atRisk.add(meetingId);
          }
        }

        const pagination = asRecord(payloadRecord?.pagination);
        const totalPages =
          typeof pagination?.totalPages === "number"
            ? pagination.totalPages
            : 1;

        hasMorePages = tasks.length >= pageLimit && page < totalPages;
        page += 1;
      }

      return atRisk;
    },
    { revalidateOnFocus: false }
  );

  return {
    atRiskMeetingIds: data ?? new Set<string>(),
    loading: isLoading,
  };
};
