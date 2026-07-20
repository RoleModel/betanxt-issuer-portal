"use client";

import { useCallback, useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import buildApiClient from "@/domain-models/apiClient";

type MailingType = components["schemas"]["Mailing"];

export interface UseMailingResult {
  loading: boolean;
  error: string | null;
  getMailingByMeetingId: (meetingId: string) => Promise<MailingType | null>;
}

export function useMailing(): UseMailingResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMailingByMeetingId = useCallback(
    async (meetingId: string): Promise<MailingType | null> => {
      setLoading(true);
      setError(null);

      try {
        const apiClient = await buildApiClient();

        const { data, error: fetchError } = await apiClient.GET(
          "/meetings/{meetingId}/mailing",
          {
            params: { path: { meetingId } },
          }
        );

        if (fetchError) {
          const errorMsg =
            typeof fetchError === "object" && "message" in fetchError
              ? String((fetchError as { message: unknown }).message)
              : "Failed to fetch mailing data";
          setError(errorMsg);
          return null;
        }

        return data || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        console.error("Error in getMailingByMeetingId:", err);
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    getMailingByMeetingId,
  };
}
