"use client";

import useSWR from "swr";

import { getBrowserSupabase } from "@/lib/browserSupabase";

export type EventRiskLevel = "AT_RISK" | "ON_SCHEDULE";

/**
 * Statuses that count as done for risk purposes. Mirrors the phase-advancement
 * completion statuses documented in CLAUDE.md — a task in any of these is not
 * holding the event up, even if its due date has passed.
 */
const COMPLETION_STATUSES: ReadonlySet<string> = new Set([
  "COMPLETE",
  "AUTHORIZED",
  "SUBMITTED_AWAITING_RECORD_DATE",
  "WAITING_FOR_FORM_RETURN",
  "REQUEST_FORM_TO_FOLLOW",
  "PENDING_AUTHORIZATION",
  "CANCELLED",
]);

interface RiskTaskRow {
  readonly meeting_id: string | null;
  readonly due_date: string | null;
  readonly status: string | null;
}

const isRiskTaskRow = (value: unknown): value is RiskTaskRow => {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const row: Record<string, unknown> = { ...value };
  const hasNullableString = (field: unknown): boolean =>
    field === null || field === undefined || typeof field === "string";

  return (
    hasNullableString(row.meeting_id) &&
    hasNullableString(row.due_date) &&
    hasNullableString(row.status)
  );
};

/** Midnight today, so a task due today is not yet considered late. */
const startOfToday = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

const isOverdue = (dueDate: string | null, todayStart: number): boolean => {
  if (dueDate === null || dueDate.length === 0) {
    return false;
  }

  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() < todayStart;
};

interface UseEventRiskResult {
  /** Meeting ids that have at least one overdue, unfinished task. */
  readonly atRiskMeetingIds: ReadonlySet<string>;
  readonly loading: boolean;
}

/**
 * Resolves which meetings are behind schedule.
 *
 * The task API is per-meeting only, so asking it for an events list of several
 * hundred rows would mean one request per row. This reads the task table
 * directly in a single query instead — the same "OpenAPI first, direct Supabase
 * as fallback" arrangement the document repository uses. If a bulk or
 * aggregated tasks endpoint is added later, this is the only place to change.
 */
export function useEventRisk(): UseEventRiskResult {
  const { data, isLoading } = useSWR(
    "/event-risk/overdue-tasks",
    async (): Promise<ReadonlySet<string>> => {
      const supabase = getBrowserSupabase();
      const { data: rows, error } = await supabase
        .from("task")
        .select("meeting_id, due_date, status");

      if (error || !Array.isArray(rows)) {
        return new Set<string>();
      }

      const todayStart = startOfToday();
      const atRisk = new Set<string>();

      for (const row of rows) {
        if (!isRiskTaskRow(row)) {
          continue;
        }

        const meetingId = row.meeting_id;
        if (meetingId === null || meetingId.length === 0) {
          continue;
        }
        if (COMPLETION_STATUSES.has(row.status ?? "")) {
          continue;
        }
        if (!isOverdue(row.due_date, todayStart)) {
          continue;
        }

        atRisk.add(meetingId);
      }

      return atRisk;
    },
    { revalidateOnFocus: false }
  );

  return {
    atRiskMeetingIds: data ?? new Set<string>(),
    loading: isLoading,
  };
}
