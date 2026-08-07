import { getSession } from "next-auth/react";
import createClient from "openapi-fetch";
import type { Session } from "next-auth";

import type { paths as ExpandedPaths } from "@/types/api";

/**
 * The single source of truth for the client's route table.
 *
 * This was previously `LegacyPaths & ExpandedPaths`, intersecting
 * `./generated-schema` with `@/types/api`. Those two modules are byte-identical
 * — both are emitted from `mock-api-server/openapi-schema/openapi.yaml`, one by
 * `generate:types` and one by `generate:api-types` — so the intersection added
 * no routes. It did, however, break every response type: openapi-fetch resolves
 * a body by distributing a conditional type over the operation's `responses`
 * member, and an intersection of two object types is not assignable to either
 * branch of that conditional. Every `apiClient.GET/POST/PUT(...)` therefore
 * resolved to `{ data: never; error?: undefined }`, which silently typed the
 * whole app's API surface as `never` and made `error` checks always-falsy.
 *
 * Keep this a single `paths` type. If the two generators ever diverge, fix the
 * generators rather than intersecting their output.
 */
type CombinedPaths = ExpandedPaths;

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

// Held in a const container so callers mutate `.current` rather than reassigning
// a module-level `let` (which the lint rules disallow from inside functions).
const sessionCacheStore: { current: SessionCacheEntry | null } = {
  current: null,
};
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes - longer cache to reduce API calls
const EMPTY_SESSION_CACHE_TTL = 1000; // 1 second - avoids pinning a pre-login null session

const getCachedSession = async (): Promise<Session | null> => {
  // Check if we have a valid cached session
  const cached = sessionCacheStore.current;
  if (
    cached &&
    Date.now() - cached.timestamp <
      (cached.session ? SESSION_CACHE_TTL : EMPTY_SESSION_CACHE_TTL)
  ) {
    return cached.session;
  }

  // Fetch fresh session (only the fallible call lives in the try block)
  let session: Session | null = null;
  try {
    session = await getSession();
  } catch (error) {
    console.error("Failed to retrieve session in buildApiClient", error);
    return null;
  }

  sessionCacheStore.current = { session, timestamp: Date.now() };
  return session;
};

// Function to clear session cache (useful for logout or session changes)
export const clearSessionCache = () => {
  sessionCacheStore.current = null;
};

export const buildApiClient = async () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

  let session: Session | null = null;

  // Only try to get session if auth bypass is not enabled
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH !== "true") {
    session = await getCachedSession();
  }

  return createClient<CombinedPaths>({
    baseUrl,
    headers: {
      ...(session?.user?.id && { Authorization: `Bearer ${session.user.id}` }),
    },
  });
};

export default buildApiClient;
