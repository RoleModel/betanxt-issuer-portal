"use client";

import { useMemo } from "react";

import { useClient } from "@/contexts/ClientContext";
import { type ClientFeatureKey, DEFAULT_FEATURE_KEYS } from "@/hooks/useClients";

interface UseClientFeaturesResult {
  /** Feature keys enabled for the current client (defaults applied when unset). */
  enabledFeatures: ClientFeatureKey[];
  /** Returns true when the given feature is enabled for the current client. */
  isEnabled: (feature: ClientFeatureKey) => boolean;
}

/**
 * Resolves which portal features are enabled for the currently selected
 * client, driving feature gating such as the NOBO tab/page.
 *
 * Resolution order: while no client is loaded, the standard default set is
 * shown (NOBO stays opt-in); a saved `enabledFeatures` array is trusted
 * verbatim — including an empty array, which means an admin disabled all
 * tabs; a missing value falls back to {@link DEFAULT_FEATURE_KEYS}.
 *
 * @example
 * const { isEnabled } = useClientFeatures()
 * if (isEnabled('nobo')) { ... render NOBO tab ... }
 */
export function useClientFeatures(): UseClientFeaturesResult {
  const { currentClient } = useClient();

  const enabledFeatures = useMemo<ClientFeatureKey[]>(() => {
    // No client loaded yet — show the standard set while loading (NOBO stays opt-in)
    if (!currentClient) return DEFAULT_FEATURE_KEYS;
    // Trust whatever was saved; an empty array means all tabs disabled (admin intent)
    if (Array.isArray(currentClient.enabledFeatures)) return currentClient.enabledFeatures;
    // Null / undefined means the column was never set — default to the standard set
    return DEFAULT_FEATURE_KEYS;
  }, [currentClient]);

  const isEnabled = useMemo(
    () =>
      (feature: ClientFeatureKey): boolean =>
        enabledFeatures.includes(feature),
    [enabledFeatures],
  );

  return { enabledFeatures, isEnabled };
}
