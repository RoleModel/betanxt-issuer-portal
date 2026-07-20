"use client";

/**
 * Geographic distribution of shareholder positions for a meeting.
 *
 * Buckets every position into a US state, "International", or "Unknown"
 * location and aggregates shareholder counts and shares held per bucket,
 * filtered by holder category (REGISTERED / PLAN / BENEFICIAL / NOBO).
 * Backs the Geographic Distribution heatmap card on the Reporting page.
 */
import { useMemo } from "react";
import useSWR from "swr";

import buildApiClient from "@/domain-models/apiClient";
import {
  type HolderCategory,
  normalizeHolderCategory,
} from "@/utils/holderCategory";
import { asArray, asRecord, asString } from "@/utils/typeUtils";

/** Bucket label for positions outside the United States. */
export const INTERNATIONAL_LOCATION = "International";
/** Bucket label for positions with no resolvable state or country. */
export const UNKNOWN_LOCATION = "Unknown";

/** Classification of a geographic bucket: a US state/territory, international, or unresolvable. */
export type GeoLocationKind = "state" | "international" | "unknown";

/** Per-holder-category totals within a geographic bucket. */
export interface GeoCategoryTotals {
  shareholderCount: number;
  sharesHeld: number;
}

/** One aggregated geographic bucket of shareholder positions. */
export interface GeoDistributionRow {
  /** US state/territory code (e.g. `NY`), {@link INTERNATIONAL_LOCATION}, or {@link UNKNOWN_LOCATION}. */
  location: string;
  kind: GeoLocationKind;
  /** Number of positions bucketed into this location (all included categories). */
  shareholderCount: number;
  /** Total shares held across all positions in this location (all included categories). */
  sharesHeld: number;
  /** Breakdown of the totals by holder category, for matrix-style rendering. */
  byCategory: Partial<Record<HolderCategory, GeoCategoryTotals>>;
}

export interface UseGeoDistributionResult {
  rows: GeoDistributionRow[];
  loading: boolean;
  error: string | null;
}

interface GeoPosition {
  holderCategory: HolderCategory;
  state: string | null;
  country: string | null;
  shares: number;
}

const LEGACY_REGISTERED_ACCOUNT_TYPE = "DTC/CDS";

const US_COUNTRY_CODES = new Set(["US", "USA"]);

const US_STATE_CODES = new Set([
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
  "PR",
  "VI",
  "GU",
  "AS",
  "MP",
]);

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Converts a raw `/positions` API record (snake_case or camelCase) into the
 * minimal {@link GeoPosition} shape, returning null for malformed entries.
 */
const normalizeGeoPosition = (value: unknown): GeoPosition | null => {
  const record = asRecord(value);
  if (!record) return null;

  const accountType =
    asString(record.account_type) ?? asString(record.accountType) ?? "";
  // Missing holderCategory falls back to the legacy accountType inference
  const holderCategory =
    normalizeHolderCategory(record.holder_category ?? record.holderCategory) ??
    (accountType === LEGACY_REGISTERED_ACCOUNT_TYPE
      ? "REGISTERED"
      : "BENEFICIAL");

  return {
    holderCategory,
    state: asString(record.state),
    country: asString(record.country),
    shares: toFiniteNumber(record.shares),
  };
};

/** SWR fetcher: loads all positions for a meeting and normalizes them for geo bucketing. */
const fetchGeoPositions = async (meetingId: string): Promise<GeoPosition[]> => {
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
    .map((position) => normalizeGeoPosition(position))
    .filter((position): position is GeoPosition => position !== null);
};

/**
 * Resolves a position to its geographic bucket. A non-US country wins over any
 * state value; a recognized US state/territory code maps to that state;
 * anything else falls into the Unknown bucket.
 */
const resolveLocation = (
  position: GeoPosition
): { location: string; kind: GeoLocationKind } => {
  const country = position.country?.trim().toUpperCase() ?? null;
  const state = position.state?.trim().toUpperCase() ?? null;

  if (country && !US_COUNTRY_CODES.has(country)) {
    return { location: INTERNATIONAL_LOCATION, kind: "international" };
  }
  if (state && US_STATE_CODES.has(state)) {
    return { location: state, kind: "state" };
  }
  return { location: UNKNOWN_LOCATION, kind: "unknown" };
};

/**
 * Aggregates a meeting's positions into geographic distribution rows.
 *
 * Fetches positions once per meeting (SWR-cached) and re-buckets client-side
 * whenever the included holder categories change, so toggling category
 * filters does not trigger refetches.
 *
 * @param meetingId - Meeting whose positions to aggregate; no fetch occurs while undefined
 * @param includedCategories - Holder categories to include in the aggregation; positions in other categories are skipped
 * @returns Aggregated rows (unsorted) plus loading/error state
 *
 * @example
 * const { rows, loading } = useGeoDistribution(meetingId, ['REGISTERED', 'BENEFICIAL'])
 */
export const useGeoDistribution = (
  meetingId: string | undefined,
  includedCategories: readonly HolderCategory[]
): UseGeoDistributionResult => {
  const { data, error, isLoading } = useSWR(
    meetingId ? (["/geo-distribution", meetingId] as const) : null,
    ([, id]) => fetchGeoPositions(id),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 2000,
    }
  );

  const includedKey = includedCategories.join(",");

  const rows = useMemo<GeoDistributionRow[]>(() => {
    const positions = data ?? [];
    const included = new Set(includedKey.split(",").filter(Boolean));
    const buckets = new Map<string, GeoDistributionRow>();

    positions.forEach((position) => {
      if (!included.has(position.holderCategory)) return;

      const { location, kind } = resolveLocation(position);
      const bucket = buckets.get(location) ?? {
        location,
        kind,
        shareholderCount: 0,
        sharesHeld: 0,
        byCategory: {},
      };

      bucket.shareholderCount += 1;
      bucket.sharesHeld += position.shares;

      const categoryTotals = bucket.byCategory[position.holderCategory] ?? {
        shareholderCount: 0,
        sharesHeld: 0,
      };
      categoryTotals.shareholderCount += 1;
      categoryTotals.sharesHeld += position.shares;
      bucket.byCategory[position.holderCategory] = categoryTotals;

      buckets.set(location, bucket);
    });

    return Array.from(buckets.values());
  }, [data, includedKey]);

  return {
    rows,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
};
