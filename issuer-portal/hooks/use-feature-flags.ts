"use client";

import useSWR from "swr";

import { useClient } from "@/contexts/ClientContext";

interface FeatureFlags {
  /** Vercel `enable-nobo` flag — gates NOBO/Engage functionality per client. */
  enableNobo: boolean;
  /**
   * Vercel `configure-distribution` flag — gates the Configure Distribution
   * feature (automated daily tabulation delivery). Phase 2, off for MVP.
   */
  configureDistribution: boolean;
  /** Gates updated client-brand colors in the Tabulation Tracker. */
  enableTabulationTrackerColors: boolean;
  /**
   * Vercel `enable-csm-tabulation-approval` flag — gates the prototype CSM
   * review/release workflow for tabulation reports.
   */
  enableCsmTabulationApproval: boolean;
}

interface UseFeatureFlagsResult {
  flags: FeatureFlags;
  isLoading: boolean;
}

const defaultFlags: FeatureFlags = {
  configureDistribution: false,
  enableNobo: false,
  enableTabulationTrackerColors: false,
  enableCsmTabulationApproval: false,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const fetchFeatureFlags = async (ticker: string | null): Promise<FeatureFlags> => {
  // eslint-disable-next-line compat/compat -- This client hook runs only in browsers supported by Next.js.
  const response = await fetch("/api/feature-flags", {
    headers: ticker !== null && ticker.length > 0 ? { "x-client-ticker": ticker } : undefined,
  });
  if (!response.ok) {
    return defaultFlags;
  }

  const data: unknown = await response.json();
  if (!isRecord(data)) {
    return defaultFlags;
  }

  return {
    configureDistribution: data.configureDistribution === true,
    enableNobo: data.enableNobo === true,
    enableTabulationTrackerColors: data.enableTabulationTrackerColors === true,
    enableCsmTabulationApproval: data.enableCsmTabulationApproval === true,
  };
};

/**
 * Reads server-evaluated Vercel Flags from `/api/feature-flags`.
 *
 * The client ticker is sent as the `x-client-ticker` header so the Vercel
 * dashboard targeting rules (on `Team id`) apply per issuer. Pass
 * `tickerOverride` when the relevant client differs from the URL-derived
 * context (e.g. the event manager, which lives outside `[clientTicker]`
 * routes). Defaults every flag to off until the response arrives so gated
 * UI (e.g. the NOBO chip in the event manager) never flashes on.
 */
export const useFeatureFlags = (tickerOverride?: string): UseFeatureFlagsResult => {
  const { currentClient } = useClient();
  const ticker = tickerOverride ?? currentClient?.ticker ?? null;

  const { data, isLoading } = useSWR(
    ["/api/feature-flags", ticker] as const,
    async ([, clientTicker]) => await fetchFeatureFlags(clientTicker),
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
    },
  );

  return { flags: data ?? defaultFlags, isLoading };
};
