"use client";

import { useMemo } from "react";

import { useClient } from "@/contexts/ClientContext";
import { ALL_FEATURE_KEYS, type ClientFeatureKey } from "@/hooks/useClients";

interface UseClientFeaturesResult {
  enabledFeatures: ClientFeatureKey[];
  isEnabled: (feature: ClientFeatureKey) => boolean;
}

export function useClientFeatures(): UseClientFeaturesResult {
  const { currentClient } = useClient();

  const enabledFeatures = useMemo<ClientFeatureKey[]>(() => {
    // No client loaded yet — show everything while loading
    if (!currentClient) return ALL_FEATURE_KEYS;
    // Trust whatever was saved; an empty array means all tabs disabled (admin intent)
    if (Array.isArray(currentClient.enabledFeatures)) return currentClient.enabledFeatures;
    // Null / undefined means the column was never set — default to all enabled
    return ALL_FEATURE_KEYS;
  }, [currentClient]);

  const isEnabled = useMemo(
    () =>
      (feature: ClientFeatureKey): boolean =>
        enabledFeatures.includes(feature),
    [enabledFeatures],
  );

  return { enabledFeatures, isEnabled };
}
