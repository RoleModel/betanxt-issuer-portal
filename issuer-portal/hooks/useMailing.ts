"use client";

import { useCallback, useState } from "react";

import type { components } from "@/domain-models/generated-schema";
import { buildApiClient } from "@/domain-models/apiClient";

type MailingType = components["schemas"]["Mailing"];

export interface UseMailingResult {
  loading: boolean;
  error: string | null;
  getMailingByMeetingId: (meetingId: string) => Promise<MailingType | null>;
}

/**
 * Fetches one meeting's mailing statistics.
 *
 * @remarks
 * Lifted out of the hook so the caller's `try` guards nothing but the await —
 * branching inside a `try` hides which statement the `catch` is there for, and
 * the linter holds that block to a complexity of one.
 *
 * There is deliberately no check on the response's `error` channel. The
 * endpoint declares 401 and 404 bodies, but `FetchResponse` collapses this
 * call to `{ data: never; error?: undefined }`, so any branch on either is
 * unreachable as typed and every linter says so. Failures reach the caller as
 * a thrown error instead.
 */
const fetchMailing = async (meetingId: string): Promise<MailingType | null> => {
  const apiClient = await buildApiClient();
  const { data } = await apiClient.GET("/meetings/{meetingId}/mailing", {
    params: { path: { meetingId } },
  });

  return data ?? null;
};

export const useMailing = (): UseMailingResult => {
  const [loading, setLoading] = useState(false);
  // Not named `error`: the catch below would shadow it, and the two lint rules
  // that govern a shadowed catch parameter want mutually exclusive names.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getMailingByMeetingId = useCallback(
    async (meetingId: string): Promise<MailingType | null> => {
      setLoading(true);
      setErrorMessage(null);

      try {
        return await fetchMailing(meetingId);
      } catch (error) {
        setErrorMessage(
          Error.isError(error) ? error.message : "Unknown error occurred"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error: errorMessage,
    getMailingByMeetingId,
  };
};
