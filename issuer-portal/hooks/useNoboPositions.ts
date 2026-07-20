"use client";

/**
 * NOBO (Non-Objecting Beneficial Owner) position data for a meeting.
 *
 * Fetches the meeting's positions and keeps only those whose holder category
 * is NOBO. Backs the NOBO positions table, which is gated behind the `nobo`
 * client feature (an opt-in Engage upsell).
 */
import useSWR from "swr";

import buildApiClient from "@/domain-models/apiClient";
import { normalizeHolderCategory } from "@/utils/holderCategory";
import { asArray, asRecord, asString } from "@/utils/typeUtils";

/** A single NOBO holder row as displayed in the NOBO positions table. */
export interface NoboPosition {
  id: string;
  holderName: string;
  accountNumber: string;
  shares: number;
  /** US state code when known; null for international or unresolved addresses. */
  state: string | null;
}

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Converts a raw `/positions` API record into a {@link NoboPosition},
 * returning null for malformed entries or positions that are not NOBO
 * (so the filter happens during normalization).
 */
const normalizeNoboPosition = (value: unknown): NoboPosition | null => {
  const record = asRecord(value);
  if (!record) return null;

  const holderCategory = normalizeHolderCategory(
    record.holder_category ?? record.holderCategory
  );
  if (holderCategory !== "NOBO") return null;

  return {
    id: asString(record.id) ?? "",
    holderName: asString(record.name) ?? "",
    accountNumber:
      asString(record.account_number) ?? asString(record.accountNumber) ?? "",
    shares: toFiniteNumber(record.shares),
    state: asString(record.state),
  };
};

/** SWR fetcher: loads a meeting's positions and keeps only NOBO holders. */
const fetchNoboPositions = async (
  meetingId: string
): Promise<NoboPosition[]> => {
  const apiClient = await buildApiClient();
  const { data, error } = await apiClient.GET("/positions", {
    params: { query: { meetingId, limit: 5000 } },
  });

  if (error) {
    throw new Error("Failed to fetch positions");
  }

  const positionsRaw = Array.isArray(data)
    ? data
    : asArray(asRecord(data)?.positions);
  return positionsRaw
    .map((position) => normalizeNoboPosition(position))
    .filter((position): position is NoboPosition => position !== null);
};

export interface UseNoboPositionsResult {
  positions: NoboPosition[];
  loading: boolean;
  error: string | null;
}

/**
 * Provides the NOBO positions for a meeting.
 *
 * Results are SWR-cached per meeting; callers are responsible for gating the
 * UI behind the `nobo` client feature (see `useClientFeatures`).
 *
 * @param meetingId - Meeting whose NOBO positions to load; no fetch occurs while undefined
 * @returns NOBO positions plus loading/error state
 */
export const useNoboPositions = (
  meetingId?: string
): UseNoboPositionsResult => {
  const { data, error, isLoading } = useSWR(
    meetingId ? (["/nobo-positions", meetingId] as const) : null,
    ([, id]) => fetchNoboPositions(id),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 2000,
    }
  );

  return {
    positions: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
};
