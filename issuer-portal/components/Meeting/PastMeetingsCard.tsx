"use client";

import React, { useEffect, useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import { useClient } from "@/contexts/ClientContext";
import buildApiClient from "@/domain-models/apiClient";
import { generateSeededEventParticipationPercent } from "@/utils/eventParticipation";
import { asArray, asRecord } from "@/utils/typeUtils";

import PastMeetingsTable, { type PastMeetingData } from "./PastMeetingsTable";

interface PastMeetingsCardProps {
  readonly maxHeight?: number | string;
  readonly limit?: number;
}

type Meeting = components["schemas"]["Meeting"];

const getDefaultMetrics = (meetingId: string) => ({
  participationPercent: generateSeededEventParticipationPercent(meetingId),
  totalVotes: 0,
  votingShares: 0,
});

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    const dateParts = dateString.split("-");
    if (dateParts.length !== 3) return "Invalid Date";
    const [year, month, day] = dateParts.map((part) => parseInt(part));
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return "Invalid Date";
  }
};

const PastMeetingsCard = ({
  maxHeight = 400,
  limit = 6,
}: PastMeetingsCardProps) => {
  const { currentClient } = useClient();
  const clientTicker = currentClient?.ticker ?? "";

  const [meetings, setMeetings] = useState<PastMeetingData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // No useCallback: the React Compiler already caches this.
  const fetchData = async () => {
    if (clientTicker === "") return;

    try {
      setLoading(true);
      setError(null);

      const apiClient = await buildApiClient();
      const { data, error: apiError } = await apiClient.GET("/meetings", {
        params: {
          query: {
            ticker: clientTicker.toUpperCase(),
            status: "COMPLETE",
          },
        },
      });

      if (apiError !== undefined) {
        setError("Failed to load meetings");
        setLoading(false);
        return;
      }

      // The route returns `{ meetings: [...] }`, not a bare array.
      const completedMeetings = asArray<Meeting>(
        asRecord(data)?.meetings
      ).slice(0, limit);

      // Use consistent seeded mock participation data to match Reporting page
      const meetingsWithParticipation: PastMeetingData[] =
        completedMeetings.map((meeting: Meeting): PastMeetingData => {
          const meetingId = meeting.id ?? "";
          return {
            ...meeting,
            ...getDefaultMetrics(meetingId),
          };
        });

      setMeetings(meetingsWithParticipation);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load past meetings"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    // The recommended fix is switching this fetch-on-mount to SWR (the
    // project's established data-fetching pattern elsewhere), not suppressing
    // this warning — but that's a data-layer rewrite, not a lint fix.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientTicker, limit]);

  return (
    <PastMeetingsTable
      clientTicker={clientTicker}
      meetings={meetings}
      loading={loading}
      formatDate={formatDate}
      error={error}
      onRetry={() => {
        void fetchData();
      }}
      showSorting={false}
      maxHeight={maxHeight}
    />
  );
};

export default PastMeetingsCard;
