"use client";

import { Box, LinearProgress, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useClient } from "@/contexts/ClientContext";

export default function HomePage() {
  const { data: session, status } = useSession();
  const { currentClient, availableClients, loading: clientLoading, error } = useClient();
  const router = useRouter();
  const [showError, setShowError] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Always redirect unauthenticated users to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Show error after 5 seconds if still loading
    const timer = setTimeout(() => {
      if (clientLoading && !currentClient) {
        setShowError(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [clientLoading, currentClient]);

  useEffect(() => {
    if (hasRedirected) return;
    if (status !== "authenticated") return;

    const userType = session?.user?.type;
    const clientTicker = session?.user?.client_ticker;

    // PARENT_CLIENT, SOLICITOR, and CSM users go to the events overview dashboard
    if (userType === "PARENT_CLIENT" || userType === "SOLICITOR" || userType === "CSM") {
      setHasRedirected(true);
      router.push("/events");
      return;
    }

    // ISSUER users with a client_ticker can redirect immediately (no API dependency)
    if (userType === "ISSUER" && clientTicker) {
      const defaultMeetingId = `${clientTicker.toLowerCase()}-annual-meeting-2026`;
      setHasRedirected(true);
      router.push(`/${clientTicker}/meeting/${defaultMeetingId}`);
      return;
    }

    // Wait for client context to finish loading before attempting fallback
    if (clientLoading) return;

    // Don't attempt fallback routing until user type is known
    if (!userType) return;

    if (currentClient) {
      const defaultMeetingId = `${currentClient.ticker.toLowerCase()}-annual-meeting-2026`;
      setHasRedirected(true);
      router.push(`/${currentClient.ticker}/meeting/${defaultMeetingId}`);
    } else if (availableClients.length > 0) {
      const firstClient = availableClients[0];
      const defaultMeetingId = `${firstClient.ticker.toLowerCase()}-annual-meeting-2026`;
      setHasRedirected(true);
      router.push(`/${firstClient.ticker}/meeting/${defaultMeetingId}`);
    } else {
      // No clients available — ADMIN gets a default, others go to login
      if (userType === "ADMIN") {
        setHasRedirected(true);
        router.push("/WEN/meeting/wen-annual-meeting-2026");
      } else {
        setHasRedirected(true);
        router.push("/login");
      }
    }
  }, [
    router,
    currentClient,
    availableClients,
    clientLoading,
    hasRedirected,
    session?.user?.type,
    session?.user?.client_ticker,
    status,
  ]);

  if (error || showError) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 2,
        }}
      >
        <Typography variant="h6" color="error">
          {error || "Failed to load client data"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please refresh the page or contact support.
        </Typography>
      </Box>
    );
  }

  // Show loading spinner while determining client
  return <LinearProgress />;
}
