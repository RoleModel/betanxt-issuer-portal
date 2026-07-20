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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";

import { useClient } from "@/contexts/ClientContext";
import buildApiClient from "@/domain-models/apiClient";
import {
  ALL_FEATURE_KEYS,
  type ClientFeatureKey,
  DEFAULT_FEATURE_KEYS,
} from "@/hooks/useClients";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FEATURE_KEYS, FEATURE_LABELS } from "@/utils/clientFeatures";

interface ClientFeaturesCardProps {
  clientTicker: string;
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
export function ClientFeaturesCard({ clientTicker }: ClientFeaturesCardProps) {
  const { data: session } = useSession();
  const { currentClient, updateCurrentClientFeatures } = useClient();
  const { mutate } = useSWRConfig();
  // The event manager lives outside [clientTicker] routes, so pass the
  // meeting's ticker explicitly for per-client flag targeting.
  const { flags } = useFeatureFlags(clientTicker);
  const isCSM =
    session?.user?.type === "CSM" || session?.user?.type === "ADMIN";

  // The NOBO chip is gated behind the Vercel `enable-nobo` flag — when the
  // flag is off, CSMs cannot toggle NOBO per client at all.
  const visibleFeatureKeys = useMemo(
    () =>
      flags.enableNobo
        ? ALL_FEATURE_KEYS
        : ALL_FEATURE_KEYS.filter((feature) => feature !== FEATURE_KEYS.nobo),
    [flags.enableNobo]
  );

  const [enabledFeatures, setEnabledFeatures] =
    useState<ClientFeatureKey[]>(DEFAULT_FEATURE_KEYS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialise only when the client changes, not on every SWR re-fetch.
  // Using clientTicker as the dependency prevents the re-fetch's new array
  // reference from overwriting the optimistic local state mid-save.
  useEffect(() => {
    if (Array.isArray(currentClient?.enabledFeatures)) {
      setEnabledFeatures(currentClient.enabledFeatures);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientTicker]);

  const handleChipClick = useCallback(
    async (feature: ClientFeatureKey) => {
      if (saving) return;
      const previous = enabledFeatures;
      const next = previous.includes(feature)
        ? previous.filter((f) => f !== feature)
        : [...previous, feature];

      setEnabledFeatures(next);
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      try {
        const apiClient = await buildApiClient();
        const { error } = await apiClient.PUT("/clients/{ticker}", {
          params: { path: { ticker: clientTicker } },
          body: { enabledFeatures: next },
        });
        if (error) {
          setSaveError("Failed to save feature settings");
          setEnabledFeatures(previous);
        } else {
          // Patch currentClient in context immediately so EventTabs re-renders
          // without waiting for the SWR re-fetch round-trip.
          updateCurrentClientFeatures(next);
          // Also invalidate the SWR cache so any re-mount gets fresh server data.
          void mutate(
            (key) => Array.isArray(key) && key[0] === "/clients",
            undefined,
            {
              revalidate: true,
            }
          );
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      } catch {
        setSaveError("Failed to save feature settings");
        setEnabledFeatures(previous);
      } finally {
        setSaving(false);
      }
    },
    [enabledFeatures, clientTicker, mutate, saving, updateCurrentClientFeatures]
  );

  if (!isCSM) return null;

  return (
    <Card variant="outlined">
      <CardHeader
        title={"Services & Features"}
        action={saving && <CircularProgress size={16} />}
        subheader="Enable or disable navigation tabs for this client. Changes take effect immediately. Dashboard is always visible."
      />
      <CardContent>
        <Stack direction="row" flexWrap="wrap" gap={0.75} mb={2}>
          {visibleFeatureKeys.map((feature) => {
            const isEnabled = enabledFeatures.includes(feature);
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
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Saved — navigation updated
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
