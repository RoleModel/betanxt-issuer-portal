"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { components } from "@/types/api";

import { useClient } from "@/contexts/ClientContext";
import { buildApiClient } from "@/domain-models/apiClient";

type DbNotification = components["schemas"]["Notification"];

// Helper to extract error message from API errors
const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
};

interface FetchNotificationsOptions {
  ticker?: string;
  meetingId?: string;
}

interface NotificationContextType {
  notifications: DbNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (options?: FetchNotificationsOptions) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

function extractTickerFromPathname(pathname: string): string | null {
  const match = /^\/([A-Z]{2,5})\//.exec(pathname);
  return match?.[1] ?? null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

const getFallbackReadState = (notificationId: string): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`notification-read:${notificationId}`) === "true";
};

const setFallbackReadState = (notificationId: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(`notification-read:${notificationId}`, "true");
};

const buildFallbackNotifications = (ticker: string): DbNotification[] => {
  const notificationId = `fallback-filing-complete-${ticker.toLowerCase()}`;

  return [
    {
      id: notificationId,
      title: "Filing Complete",
      message: "Filing Complete for the annual meeting.",
      type: "success",
      priority: "high",
      read: getFallbackReadState(notificationId),
      meetingId: `${ticker.toLowerCase()}-annual-meeting-2026`,
      actionUrl: `/${ticker}/meeting/${ticker.toLowerCase()}-annual-meeting-2026`,
      createdAt: new Date().toISOString(),
    },
  ];
};

const withFallbackNotifications = (
  ticker: string,
  dbNotifications: DbNotification[],
): DbNotification[] => {
  const fallbackNotifications = buildFallbackNotifications(ticker);
  const existingTitles = new Set(dbNotifications.map((notification) => notification.title));
  const missingFallbacks = fallbackNotifications.filter(
    (notification) => !existingTitles.has(notification.title),
  );

  return [...missingFallbacks, ...dbNotifications];
};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const { currentClient } = useClient();
  const { data: session } = useSession();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(
    async (options?: FetchNotificationsOptions) => {
      try {
        setLoading(true);
        setError(null);

        const ticker =
          options?.ticker ?? currentClient?.ticker ?? extractTickerFromPathname(pathname) ?? null;
        const userId = session?.user?.id;
        const username = session?.user?.username;

        if (!ticker || (!userId && !username)) {
          setNotifications([]);
          setLoading(false);
          return;
        }

        const apiClient = await buildApiClient();
        const { data, error } = await apiClient.GET("/notifications", {
          params: {
            query: {
              userId,
              username,
              ticker,
              meetingId: options?.meetingId,
            },
          },
        });

        if (error || !data) {
          setError(getApiErrorMessage(error, "Failed to fetch notifications"));
          setNotifications([]);
          return;
        }

        const dbNotifications = Array.isArray(data) ? (data as DbNotification[]) : [];
        setNotifications(withFallbackNotifications(ticker, dbNotifications));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch notifications");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    },
    [currentClient?.ticker, pathname, session?.user?.id, session?.user?.username],
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        if (notificationId.startsWith("fallback-")) {
          setFallbackReadState(notificationId);
          setNotifications((prev) =>
            prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
          );
          return;
        }

        const apiClient = await buildApiClient();
        await apiClient.PATCH("/notifications/{notificationId}/mark-read", {
          params: { path: { notificationId } },
        });

        // Update local state optimistically
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        );
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
        // Refetch to ensure consistency
        await fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const apiClient = await buildApiClient();
      const unreadNotifications = notifications.filter((n) => !n.read && n.id);

      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map((n) => {
          // We've already filtered for notifications with ids above
          const notificationId = n.id!;
          return apiClient.PATCH("/notifications/{notificationId}/mark-read", {
            params: { path: { notificationId } },
          });
        }),
      );

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      // Refetch to ensure consistency
      await fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    void fetchNotifications();

    // Refetch notifications every 60 seconds
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
