"use client";

import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useSWRConfig } from "swr";

import { useClient } from "@/contexts/ClientContext";
import buildApiClient from "@/domain-models/apiClient";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import {
  ALL_FEATURE_KEYS,
  type ClientFeatureKey,
  DEFAULT_FEATURE_KEYS,
} from "@/hooks/useClients";
import { FEATURE_KEYS, FEATURE_LABELS } from "@/utils/clientFeatures";

interface ClientFeaturesCardProps {
  readonly clientTicker: string;
}

/**
 * CSM/Admin-only card of toggleable feature chips that control which
 * navigation tabs (Agenda, Mailing, Tabulation, Reports, NOBO, …) are visible
 * for a client. Renders nothing for non-CSM users.
 *
 * Local state initialises to {@link DEFAULT_FEATURE_KEYS} (rather than all
 * features) until the client's saved selection loads, so gated features like
 * NOBO never flash on by default. Chip toggles save optimistically: the chip
 * flips immediately, the client context is patched so `EventTabs` updates
 * without waiting on SWR revalidation, and the previous selection is restored
 * if the PUT fails.
 */
export const ClientFeaturesCard = ({
  clientTicker,
}: ClientFeaturesCardProps) => {
  const { data: session } = useSession();
  const { currentClient, updateCurrentClientFeatures } = useClient();
  const { mutate } = useSWRConfig();
  // The event manager lives outside [clientTicker] routes, so pass the
  // meeting's ticker explicitly for per-client flag targeting.
  const { flags } = useFeatureFlags(clientTicker);
  const isCSM = session?.user.type === "CSM" || session?.user.type === "ADMIN";

  // The NOBO chip is gated behind the Vercel `enable-nobo` flag — when the
  // flag is off, CSMs cannot toggle NOBO per client at all.
  const visibleFeatureKeys = flags.enableNobo
    ? ALL_FEATURE_KEYS
    : ALL_FEATURE_KEYS.filter((feature) => feature !== FEATURE_KEYS.nobo);

  const [enabledFeatures, setEnabledFeatures] = useState<ClientFeatureKey[]>(
    () =>
      Array.isArray(currentClient?.enabledFeatures)
        ? currentClient.enabledFeatures
        : DEFAULT_FEATURE_KEYS
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChipClick = async (feature: ClientFeatureKey): Promise<void> => {
    if (saving) {
      return;
    }

    const previousFeatures = enabledFeatures;
    const nextFeatures = previousFeatures.includes(feature)
      ? previousFeatures.filter((enabledFeature) => enabledFeature !== feature)
      : [...previousFeatures, feature];

    setEnabledFeatures(nextFeatures);
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const apiClient = await buildApiClient();
      const { response } = await apiClient.PUT("/clients/{ticker}", {
        params: { path: { ticker: clientTicker } },
        body: { enabledFeatures: nextFeatures },
      });

      if (!response.ok) {
        setSaveError("Failed to save feature settings");
        setEnabledFeatures(previousFeatures);
        setSaving(false);
        return;
      }

      // Patch currentClient in context immediately so EventTabs re-renders
      // without waiting for the SWR re-fetch round-trip.
      updateCurrentClientFeatures(nextFeatures);
      // Also invalidate the SWR cache so any re-mount gets fresh server data.
      void mutate(
        (key) => Array.isArray(key) && key[0] === "/clients",
        undefined,
        {
          revalidate: true,
        }
      );
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch {
      setSaveError("Failed to save feature settings");
      setEnabledFeatures(previousFeatures);
    }

    setSaving(false);
  };

  if (!isCSM) {
    return null;
  }

  const enabledFeatureSet = new Set(enabledFeatures);

  return (
    <Card variant="outlined">
      <CardHeader
        title="Services & Features"
        action={saving ? <CircularProgress size={16} /> : null}
        subheader="Enable or disable navigation tabs for this client. Changes take effect immediately. Dashboard is always visible."
      />
      <CardContent>
        <Stack direction="row" flexWrap="wrap" gap={0.75} mb={2}>
          {visibleFeatureKeys.map((feature) => {
            const isEnabled = enabledFeatureSet.has(feature);
            return (
              <Chip
                key={feature}
                label={FEATURE_LABELS[feature]}
                onClick={() => void handleChipClick(feature)}
                onDelete={
                  isEnabled ? () => void handleChipClick(feature) : undefined
                }
                color={isEnabled ? "primary" : "default"}
                variant={isEnabled ? "filled" : "outlined"}
                disabled={saving}
              />
            );
          })}
        </Stack>
        {saveError !== null && saveError.length > 0 ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        ) : null}
        {saveSuccess ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Saved — navigation updated
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
};
