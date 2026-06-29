import type { Session } from "next-auth";

import { getSession } from "next-auth/react";
import createClient from "openapi-fetch";

import type { paths as ExpandedPaths } from "@/types/api";

import type { paths as LegacyPaths } from "./generated-schema";

type CombinedPaths = LegacyPaths & ExpandedPaths;

export type ApiClientReturnType<T> =
  | {
      data: T;
      error: undefined;
    }
  | {
      data: undefined;
      error: {
        message: string;
        statusCode?: number;
      };
    };

// Session cache to prevent excessive getSession() calls
interface SessionCacheEntry {
  session: Session | null;
  timestamp: number;
}

let sessionCache: SessionCacheEntry | null = null;
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes - longer cache to reduce API calls
const EMPTY_SESSION_CACHE_TTL = 1000; // 1 second - avoids pinning a pre-login null session

const getCachedSession = async (): Promise<Session | null> => {
  // Check if we have a valid cached session
  if (
    sessionCache &&
    Date.now() - sessionCache.timestamp <
      (sessionCache.session ? SESSION_CACHE_TTL : EMPTY_SESSION_CACHE_TTL)
  ) {
    return sessionCache.session;
  }

  // Fetch fresh session
  try {
    const session = await getSession();
    if (session) {
      sessionCache = { session, timestamp: Date.now() };
    } else {
      sessionCache = { session: null, timestamp: Date.now() };
    }
    return session;
  } catch (error) {
    console.error("Failed to retrieve session in buildApiClient", error);
    return null;
  }
};

// Function to clear session cache (useful for logout or session changes)
export const clearSessionCache = () => {
  sessionCache = null;
};

export const buildApiClient = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

  let session: Session | null = null;

  // Only try to get session if auth bypass is not enabled
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH !== "true") {
    session = await getCachedSession();
  }

  const client = createClient<CombinedPaths>({
    baseUrl,
    headers: {
      ...(session?.user?.id && { Authorization: `Bearer ${session.user.id}` }),
    },
  });

  return client;
};

export default buildApiClient;
