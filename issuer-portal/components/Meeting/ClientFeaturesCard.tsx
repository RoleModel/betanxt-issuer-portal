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
import { useRef, useState } from "react";
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
 * The chip state is derived from the client identified by `clientTicker`, not
 * the global active client. This matters on Edit Event, which does not have a
 * ticker in its URL and can manage a different client from the active context.
 * Chip toggles remain optimistic while the PUT is in flight, then revalidate
 * the client list so ticker-routed navigation uses the persisted selection.
 */
export const ClientFeaturesCard = ({
  clientTicker,
}: ClientFeaturesCardProps) => {
  const { data: session } = useSession();
  const { availableClients } = useClient();
  const { mutate } = useSWRConfig();
  // The event manager lives outside [clientTicker] routes, so pass the
  // meeting's ticker explicitly for per-client flag targeting.
  const { flags } = useFeatureFlags(clientTicker);
  const isCSM = session?.user.type === "CSM" || session?.user.type === "ADMIN";

  // The NOBO chip is gated behind the Vercel `enable-nobo` flag — when the
  // flag is off, CSMs cannot toggle NOBO per client at all.
  const visibleFeatureKeys =
    flags.enableNobo === true
      ? ALL_FEATURE_KEYS
      : ALL_FEATURE_KEYS.filter((feature) => feature !== FEATURE_KEYS.nobo);

  const managedClient =
    availableClients.find((client) => client.ticker === clientTicker) ?? null;
  const savedFeatures = managedClient?.enabledFeatures ?? DEFAULT_FEATURE_KEYS;

  const [pendingFeatures, setPendingFeatures] = useState<
    ClientFeatureKey[] | null
  >(null);
  const enabledFeatures = pendingFeatures ?? savedFeatures;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /**
   * The set the user has asked for, which is not always the set on screen yet.
   *
   * @remarks
   * Held in a ref so that clicking several chips in a row composes: reading the
   * rendered value instead would let two clicks in the same frame both start
   * from the same base, and the second would undo the first.
   */
  const desiredFeaturesRef = useRef<ClientFeatureKey[] | null>(null);
  const savingRef = useRef(false);

  /**
   * Writes the latest requested set, coalescing anything asked for while a
   * write is in flight.
   *
   * @remarks
   * This used to return early whenever a save was running, which silently
   * dropped every click after the first — enabling four features saved one and
   * discarded three, with nothing to say so. Now a click always registers, and
   * a write already underway picks up whatever arrived while it ran.
   */
  const persistFeatures = async (): Promise<void> => {
    if (savingRef.current) {
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const apiClient = await buildApiClient();

      while (desiredFeaturesRef.current !== null) {
        const nextFeatures = desiredFeaturesRef.current;
        desiredFeaturesRef.current = null;

        const { response } = await apiClient.PUT("/clients/{ticker}", {
          params: { path: { ticker: clientTicker } },
          body: { enabledFeatures: nextFeatures },
        });

        if (response.ok !== true) {
          setSaveError("Failed to save feature settings");
          setPendingFeatures(null);
          return;
        }
      }

      // Refresh the client list so ticker-routed pages use the persisted
      // selection rather than the active global client from Edit Event.
      await mutate(
        (key) => Array.isArray(key) && key[0] === "/clients",
        undefined,
        {
          revalidate: true,
        }
      );

      // The optimistic set deliberately stays. Clearing it here hands the
      // chips back to `savedFeatures`, and the revalidation above has not
      // necessarily reached `availableClients` yet — so every chip snapped
      // straight back to its old state the moment it saved.
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch {
      setSaveError("Failed to save feature settings");
      setPendingFeatures(null);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleChipClick = (feature: ClientFeatureKey): void => {
    const base = desiredFeaturesRef.current ?? enabledFeatures;
    const nextFeatures = base.includes(feature)
      ? base.filter((enabledFeature) => enabledFeature !== feature)
      : [...base, feature];

    desiredFeaturesRef.current = nextFeatures;
    setPendingFeatures(nextFeatures);
    void persistFeatures();
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
        subheader={`Enable or disable navigation tabs for ${managedClient?.company_name ?? clientTicker}. Changes take effect immediately. Dashboard is always visible.`}
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
