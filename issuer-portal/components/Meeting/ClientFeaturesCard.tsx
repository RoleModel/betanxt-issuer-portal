"use client";

import { Alert, Card, CardContent, CardHeader, Chip, CircularProgress, Stack } from "@mui/material";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";
import { useSWRConfig } from "swr";

import { useClient } from "@/contexts/ClientContext";
import buildApiClient from "@/domain-models/apiClient";
import { ALL_FEATURE_KEYS, type ClientFeatureKey } from "@/hooks/useClients";
import { FEATURE_LABELS } from "@/utils/clientFeatures";

interface ClientFeaturesCardProps {
  clientTicker: string;
}

export function ClientFeaturesCard({ clientTicker }: ClientFeaturesCardProps) {
  const { data: session } = useSession();
  const { currentClient, updateCurrentClientFeatures } = useClient();
  const { mutate } = useSWRConfig();
  const isCSM = session?.user?.type === "CSM" || session?.user?.type === "ADMIN";

  const [enabledFeatures, setEnabledFeatures] = useState<ClientFeatureKey[]>(ALL_FEATURE_KEYS);
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
          void mutate((key) => Array.isArray(key) && key[0] === "/clients", undefined, {
            revalidate: true,
          });
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
    [enabledFeatures, clientTicker, mutate, saving, updateCurrentClientFeatures],
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
          {ALL_FEATURE_KEYS.map((feature) => {
            const isEnabled = enabledFeatures.includes(feature);
            return (
              <Chip
                key={feature}
                label={FEATURE_LABELS[feature]}
                onClick={() => void handleChipClick(feature)}
                onDelete={isEnabled ? () => void handleChipClick(feature) : undefined}
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
