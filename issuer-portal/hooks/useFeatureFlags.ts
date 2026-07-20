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
}

interface UseFeatureFlagsResult {
  flags: FeatureFlags;
  isLoading: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  enableNobo: false,
  configureDistribution: false,
};

async function fetchFeatureFlags(ticker: string | null): Promise<FeatureFlags> {
  const response = await fetch("/api/feature-flags", {
    headers: ticker ? { "x-client-ticker": ticker } : undefined,
  });
  if (!response.ok) return DEFAULT_FLAGS;

  const data = (await response.json()) as Partial<FeatureFlags>;
  return {
    enableNobo: data.enableNobo === true,
    configureDistribution: data.configureDistribution === true,
  };
}

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
export function useFeatureFlags(
  tickerOverride?: string
): UseFeatureFlagsResult {
  const { currentClient } = useClient();
  const ticker = tickerOverride ?? currentClient?.ticker ?? null;

  const { data, isLoading } = useSWR(
    ["/api/feature-flags", ticker] as const,
    ([, clientTicker]) => fetchFeatureFlags(clientTicker),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  return { flags: data ?? DEFAULT_FLAGS, isLoading };
}
