"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { clearSessionCache } from "@/domain-models/apiClient";
import { type Client, type ClientFeatureKey, useClients } from "@/hooks/useClients";
import { isIssuerUser } from "@/utils/isIssuerUser";

interface ClientContextType {
  currentClient: Client | null;
  availableClients: Client[];
  loading: boolean;
  error: string | null;
  switchClient: (client: Client) => void;
  canAccessClient: (clientId: string) => boolean;
  updateCurrentClientFeatures: (features: ClientFeatureKey[]) => void;
  isHydrated: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  const { clients, loading: clientsLoading, error: clientsError } = useClients();
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserSwitching, setIsUserSwitching] = useState(false);

  useEffect(() => {
    clearSessionCache();
  }, [session?.user?.id, sessionStatus]);

  // Extract client from ticker-based URL structure
  const extractTickerFromURL = useCallback((currentPathname: string): string | null => {
    const tickerMatch = /^\/([A-Z]{2,5})\//.exec(currentPathname);
    return tickerMatch?.[1] ?? null;
  }, []);

  // Check if user can access a specific client
  const canAccessClient = useCallback(
    (clientId: string): boolean => {
      const sessionUser = session?.user;
      if (isIssuerUser(sessionUser)) {
        const userTicker = sessionUser?.client_ticker;
        if (!userTicker) return false;

        const issuerClient = clients.find((client) => client.ticker === userTicker);
        if (!issuerClient) return false;

        return (
          issuerClient.id === clientId ||
          issuerClient.ticker === clientId ||
          issuerClient.company_name === clientId ||
          issuerClient.short_name === clientId
        );
      }

      if (bypassAuth) {
        return true; // Auth bypass allows access to all clients
      }

      // ADMIN, PARENT_CLIENT, SOLICITOR, and CSM users can access all clients
      if (
        session?.user?.type === "ADMIN" ||
        session?.user?.type === "PARENT_CLIENT" ||
        session?.user?.type === "SOLICITOR" ||
        session?.user?.type === "CSM" ||
        Boolean(session?.user?.roles?.includes("ADMIN"))
      ) {
        return true;
      }

      // ISSUER users can access the client matching their client_ticker
      const userTicker = session?.user?.client_ticker;
      if (userTicker) {
        const tickerMatch = clients.find((c) => c.ticker === userTicker);
        if (tickerMatch && (tickerMatch.id === clientId || tickerMatch.ticker === clientId)) {
          return true;
        }
      }

      // In normal auth mode, check user's relationships or account access
      const userAccountId = session?.user?.account_id;
      if (!userAccountId) return false;

      // Find client that matches the clientId
      const targetClient = clients.find(
        (c) =>
          c.id === clientId ||
          c.company_name === clientId ||
          c.short_name === clientId ||
          c.ticker === clientId,
      );
      if (!targetClient) return false;

      // Check if user has access (simplified - could be more complex with relationships)
      return userAccountId === targetClient.id || session?.user?.type === "RELATIONSHIP_MANAGER";
    },
    [
      bypassAuth,
      session?.user?.account_id,
      session?.user?.client_ticker,
      session?.user?.type,
      session?.user?.roles,
      clients,
    ],
  );

  // Determine current client based on URL and user context
  useEffect(() => {
    const determineClient = () => {
      try {
        setLoading(true);
        setError(null);

        if (!bypassAuth && sessionStatus === "loading") {
          setCurrentClient(null);
          setLoading(true);
          return;
        }

        if (clients.length === 0) {
          setCurrentClient(null);
          setLoading(false);
          return;
        }

        // If user is manually switching clients, don't re-determine automatically
        if (isUserSwitching) {
          setLoading(false);
          return;
        }

        // Issuers are single-client: always bind context to their ticker (never URL/localStorage).
        const sessionUser = session?.user;
        if (isIssuerUser(sessionUser)) {
          const issuerTicker = sessionUser?.client_ticker;
          const issuerClient = issuerTicker
            ? (clients.find((client) => client.ticker === issuerTicker) ?? null)
            : null;
          setCurrentClient(issuerClient);
          setLoading(false);
          return;
        }

        let targetClient: Client | null = null;

        // 1. First check if URL implies a specific client (takes priority for client access control)
        const tickerFromURL = extractTickerFromURL(pathname);
        if (tickerFromURL) {
          targetClient = clients.find((client) => client.ticker === tickerFromURL) ?? null;

          // If URL specifies a client, use it and update localStorage
          if (targetClient && bypassAuth) {
            try {
              if (typeof window !== "undefined") {
                localStorage.setItem("selectedClient", JSON.stringify({ id: targetClient.id }));
              }
            } catch (error) {
              console.warn("Failed to update selectedClient in localStorage:", error);
            }
          }
        }

        // 2. If no URL client, check localStorage for manually selected client (not for ISSUER)
        if (!targetClient && bypassAuth && !isIssuerUser(session?.user)) {
          try {
            const selectedClientStr =
              typeof window !== "undefined" ? localStorage.getItem("selectedClient") : null;
            if (selectedClientStr) {
              const selectedClient = JSON.parse(selectedClientStr) as { id: string };
              targetClient = clients.find((c) => c.id === selectedClient.id) ?? null;
            }
          } catch (parseError) {
            console.warn("Failed to parse selectedClient from localStorage:", parseError);
          }
        }

        // 3. For authenticated users, check access to URL client
        if (targetClient && !bypassAuth) {
          if (!canAccessClient(targetClient.id)) {
            setError(`Access denied to ${targetClient.company_name ?? targetClient.short_name}`);
            setLoading(false);
            return;
          }
        }

        // 4. Fallback only after auth has resolved.
        if (!targetClient && !tickerFromURL && clients.length > 0) {
          const userTicker = session?.user?.client_ticker ?? session?.user?.clientTickers?.[0];
          targetClient = userTicker
            ? (clients.find((client) => client.ticker === userTicker) ?? null)
            : null;

          // Multi-client roles may fall back to the first client; ISSUER stays on their ticker only.
          if (!targetClient && !isIssuerUser(session?.user)) {
            targetClient = clients[0] ?? null;
          }
        }

        setCurrentClient(targetClient);

        // Update localStorage if in auth bypass mode
        if (targetClient && bypassAuth) {
          localStorage.setItem(
            "selectedClient",
            JSON.stringify({
              id: targetClient.id,
              name: targetClient.company_name ?? targetClient.short_name,
              ticker: targetClient.ticker,
            }),
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to determine client";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (!clientsLoading) {
      determineClient();
    }
  }, [
    pathname,
    clients,
    clientsLoading,
    sessionStatus,
    session?.user?.accountId,
    session?.user?.type,
    session?.user?.client_ticker,
    session?.user?.clientTickers,
    isUserSwitching,
    extractTickerFromURL,
    canAccessClient,
    bypassAuth,
  ]);

  // Handle client switching
  const switchClient = (client: Client) => {
    if (isIssuerUser(session?.user)) {
      return;
    }

    try {
      if (!canAccessClient(client.id)) {
        setError(`Access denied to ${client.company_name ?? client.short_name}`);
        return;
      }

      // Set flag to prevent automatic client determination during switch
      setIsUserSwitching(true);

      // Update localStorage first
      localStorage.setItem(
        "selectedClient",
        JSON.stringify({
          id: client.id,
          name: client.company_name ?? client.short_name,
          ticker: client.ticker,
        }),
      );

      // Update current client state immediately
      setCurrentClient(client);

      // Navigate to the equivalent page for the selected client using ticker-based routing
      if (client.ticker) {
        // Only navigate if on a ticker-based route
        if (
          pathname === "/events" ||
          pathname.startsWith("/education") ||
          pathname.startsWith("/products")
        ) {
          // Global pages: update client context only, keep the user on the current view
          setTimeout(() => {
            setIsUserSwitching(false);
          }, 500);
          return;
        }

        const pastMeetingMatch = /^\/[A-Z]{2,5}\/past-meeting\/[^/]+(\/.*)?$/.exec(pathname);
        const activeMeetingMatch = /^\/[A-Z]{2,5}\/meeting\/[^/]+(\/.*)?$/.exec(pathname);

        // Past meetings are client-specific records, so do not carry a different client's
        // meeting id across the switch. Land on the target client's past-meetings index.
        if (pastMeetingMatch) {
          router.replace(`/${client.ticker}/past-meetings`);
          return;
        }

        // Active meeting pages can preserve the sub-page, but they must use the target
        // client's own default meeting id rather than the previous client's meeting id.
        if (activeMeetingMatch) {
          if (!client.meeting_id) {
            router.replace(`/${client.ticker}/past-meetings`);
            return;
          }

          const subPage = activeMeetingMatch[1] ?? "";
          router.replace(`/${client.ticker}/meeting/${client.meeting_id}${subPage}`);
          return;
        }

        // For other ticker-based routes, replace the old ticker with the new ticker
        const tickerMatch = /^\/([A-Z]{2,5})\//.exec(pathname);
        if (tickerMatch) {
          const oldTicker = tickerMatch[1];
          const newPath = pathname.replace(`/${oldTicker}/`, `/${client.ticker}/`);
          router.replace(newPath);
        } else {
          // Not on a ticker-based route - navigate to client's default meeting if available
          const defaultMeetingId = client.meeting_id;
          if (defaultMeetingId) {
            router.replace(`/${client.ticker}/meeting/${defaultMeetingId}`);
          } else {
            router.replace(`/${client.ticker}/past-meetings`);
          }
        }
      }

      // Reset the switching flag after navigation completes
      setTimeout(() => {
        setIsUserSwitching(false);
      }, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to switch client";
      setError(errorMessage);
      console.error("Client switch error:", error);
      // Reset the switching flag on error
      setIsUserSwitching(false);
    }
  };

  // Immediately patch enabledFeatures on the current client without waiting for SWR re-fetch.
  // Called by ClientFeaturesCard after a successful PUT so tabs update in real-time.
  const updateCurrentClientFeatures = useCallback((features: ClientFeatureKey[]) => {
    setCurrentClient((prev) => (prev ? { ...prev, enabledFeatures: features } : prev));
  }, []);

  const isSessionLoading = !bypassAuth && sessionStatus === "loading";
  const isLoading = loading || clientsLoading || isSessionLoading;

  return (
    <ClientContext.Provider
      value={{
        currentClient,
        availableClients: clients,
        loading: isLoading,
        error: error ?? clientsError,
        switchClient,
        canAccessClient,
        updateCurrentClientFeatures,
        isHydrated: !isLoading && !!currentClient,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    // Return default values when not within a ClientProvider (e.g., on login page)
    return {
      currentClient: null,
      availableClients: [],
      loading: false,
      error: null,
      switchClient: () => {
        // No-op when outside provider
      },
      canAccessClient: () => false,
      updateCurrentClientFeatures: () => {
        // No-op when outside provider
      },
      isHydrated: true,
    };
  }
  return context;
};
