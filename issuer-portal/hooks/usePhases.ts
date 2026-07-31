"use client";

import useSWR from "swr";

import buildApiClient from "@/domain-models/apiClient";

export interface Phase {
  id: string;
  meetingId: string;
  name: string;
  orderIndex: number;
  status: "COMPLETE" | "ACTIVE" | "NOT_STARTED";
  keyDates: {
    startDate?: string | null;
    endDate?: string | null;
    dueDate?: string | null;
    completionDate?: string | null;
    recordDate?: string | null;
    mailingDate?: string | null;
    meetingDate?: string | null;
    preFilingDate?: string | null;
    filingDate?: string | null;
    brokerSearchDate?: string | null;
  };
  createdAt?: string | null;
  updatedAt?: string | null;
}

// Removed unused type definitions to fix linter warnings

const asString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;
const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const getString = (
  object: Record<string, unknown>,
  keys: string[]
): string | null => {
  for (const k of keys) {
    const v = asString(object[k]);
    if (v !== null) {
      return v;
    }
  }
  return null;
};

const getNumber = (
  object: Record<string, unknown>,
  keys: string[]
): number | null => {
  for (const k of keys) {
    const v = asNumber(object[k]);
    if (v !== null) {
      return v;
    }
  }
  return null;
};

const normalizePhase = (raw: unknown): Phase | null => {
  const rec = asRecord(raw);
  if (!rec) {
    return null;
  }

  const id = getString(rec, ["id"]);
  const name = getString(rec, ["name", "phase_name"]);
  if (!id || !name) {
    return null;
  }

  const meetingId = getString(rec, ["meetingId", "meeting_id"]) || "";
  const orderIndex = getNumber(rec, ["orderIndex", "order_index"]) ?? 0;
  const rawStatus = getString(rec, ["status"]) || "";
  const status: Phase["status"] =
    rawStatus === "COMPLETE"
      ? "COMPLETE"
      : rawStatus === "ACTIVE" || rawStatus === "IN_PROGRESS"
        ? "ACTIVE"
        : "NOT_STARTED";

  const kdRec = asRecord(rec.keyDates) || asRecord(rec.key_dates) || {};
  const keyDates: Phase["keyDates"] = {
    startDate: getString(kdRec, ["startDate", "start_date"]),
    endDate: getString(kdRec, ["endDate", "end_date"]),
    dueDate: getString(kdRec, ["dueDate", "due_date"]),
    completionDate: getString(kdRec, ["completionDate", "completion_date"]),
    recordDate: getString(kdRec, ["recordDate", "record_date"]),
    mailingDate: getString(kdRec, ["mailingDate", "mailing_date"]),
    meetingDate: getString(kdRec, ["meetingDate", "meeting_date"]),
    preFilingDate: getString(kdRec, ["preFilingDate", "pre_filing_date"]),
    filingDate: getString(kdRec, ["filingDate", "filing_date"]),
    brokerSearchDate: getString(kdRec, [
      "brokerSearchDate",
      "broker_search_date",
    ]),
  };

  const createdAt = getString(rec, ["createdAt", "created_at"]);
  const updatedAt = getString(rec, ["updatedAt", "updated_at"]);

  return {
    id,
    meetingId,
    name,
    orderIndex,
    status,
    keyDates,
    createdAt: createdAt ?? null,
    updatedAt: updatedAt ?? null,
  };
};

const fetchPhases = async (meetingId: string): Promise<Phase[]> => {
  const apiClient = await buildApiClient();
  const { data, error } = await apiClient.GET("/meetings/{meetingId}/phases", {
    params: { path: { meetingId } },
  });
  if (error) {
    throw new Error("Failed to fetch phases");
  }

  const items: unknown[] = Array.isArray(data) ? (data as unknown[]) : [];
  const normalized: Phase[] = [];
  for (const item of items) {
    const n = normalizePhase(item);
    if (n) {
      normalized.push(n);
    }
  }
  return normalized;
};

export interface UsePhasesResult {
  phases: Phase[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePhases = (meetingId?: string): UsePhasesResult => {
  // Use SWR to cache the phases data and prevent duplicate fetches
  const { data, error, isLoading, mutate } = useSWR(
    meetingId ? `/meetings/${meetingId}/phases` : null,
    async () => await fetchPhases(meetingId!),
    {
      // Cache for 30 seconds
      refreshInterval: 30_000,
      // Revalidate on focus
      revalidateOnFocus: false,
      // Don't revalidate on mount if data exists
      revalidateOnMount: true,
      // Keep previous data while revalidating
      keepPreviousData: true,
      // Dedupe multiple requests in 2 second window
      dedupingInterval: 2000,
    }
  );

  return {
    phases: data || [],
    loading: isLoading,
    error: error ? error.message : null,
    refetch: () => void mutate(),
  };
};
