"use client";

import { Box, Typography } from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { useMeeting } from "@/contexts/MeetingContext";
import { asParamString } from "@/utils/typeUtils";

const parsePhaseNumber = (
  phase: string | number | null | undefined
): number => {
  if (typeof phase === "number" && Number.isFinite(phase)) {
    return Math.max(1, phase);
  }

  if (typeof phase === "string") {
    const match = /(\d+)/.exec(phase);
    if (match?.[1]) {
      const value = Number.parseInt(match[1], 10);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  }

  return 1;
};

// This handles the Meeting Dashboard route and redirects to the active phase
const MeetingDashboardRedirect = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const meetingId = asParamString(params.meetingId);
  const clientTicker = asParamString(params.clientTicker);
  const { error, currentMeeting: meeting, isLoading } = useMeeting();

  useEffect(() => {
    // Wait for meeting to load before attempting redirect
    if (isLoading === true) {
      return;
    }

    // Only redirect if the meeting ID matches the URL and we have phase info
    if (
      meeting?.id === meetingId &&
      meeting?.currentPhase !== undefined &&
      meeting.currentPhase !== ""
    ) {
      // Use the meeting's current phase instead of looking for active phase in phases array
      const currentPhase = parsePhaseNumber(meeting.currentPhase);
      const search = searchParams.toString();
      const targetPath = `/${clientTicker}/past-meeting/${meetingId}/dashboard/${currentPhase}${search ? `?${search}` : ""}`;
      // This redirect target depends on client-only data (useMeeting()'s
      // load state and the fetched meeting's currentPhase), so it can't move
      // to a server-side redirect without also moving that data fetch there.
      // eslint-disable-next-line react-doctor/nextjs-no-client-side-redirect
      router.replace(targetPath);
    }
  }, [
    meeting?.id,
    meeting?.currentPhase,
    router,
    clientTicker,
    meetingId,
    isLoading,
    searchParams,
  ]);

  if (error !== null) {
    return (
      <Box p={2}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return null;
};

const MeetingDashboardPage = () => (
  <Suspense fallback={null}>
    <MeetingDashboardRedirect />
  </Suspense>
);

export default MeetingDashboardPage;
