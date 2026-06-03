"use client";

import { LinearProgress } from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// This page handles the base meeting route and redirects to the dashboard
export default function MeetingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const meetingId = params.meetingId as string;
  const clientTicker = params.clientTicker as string;

  useEffect(() => {
    // Redirect to dashboard which will then redirect to the active phase
    const search = searchParams.toString();
    const targetPath = `/${clientTicker}/meeting/${meetingId}/dashboard${search ? `?${search}` : ""}`;
    router.replace(targetPath);
  }, [clientTicker, meetingId, router, searchParams]);

  return <LinearProgress />;
}
