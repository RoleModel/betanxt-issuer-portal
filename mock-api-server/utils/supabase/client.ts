import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
// Use service role key for server-side API access to bypass RLS
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Revalidation TTLs (in seconds)
const CACHE_TTL = {
  short: 30, // frequently-updated data: meetings, tasks
  medium: 120, // moderately stable: proposals, phases, positions
  long: 300, // rarely-changing: clients, accounts, users
} as const;

// In development the Next.js data cache survives reseeds and serves stale
// rows (stale-while-revalidate), which makes charts render pre-reseed data on
// first load. Bypass the cache entirely outside production.
const isProduction = process.env.NODE_ENV === "production";

/**
 * Tables the user mutates directly from the portal.
 *
 * Caching reads of these makes a fresh upload or edit appear to vanish: the
 * row is written, but the follow-up list request is served from the Next.js
 * data cache for up to {@link CACHE_TTL.short} seconds, so the UI looks like
 * nothing was saved at all.
 */
const uncachedTables = new Set([
  "document",
  "document_history",
  "comment",
  "signature",
  "task",
  "mailing",
  "notification",
]);

/**
 * Normalises the several shapes `fetch` accepts into a plain URL string.
 *
 * @param url - The first argument handed to `fetch`
 * @returns The request URL as a string
 */
const toUrlString = (url: RequestInfo | URL): string => {
  if (typeof url === "string") {
    return url;
  }
  return url instanceof URL ? url.href : url.url;
};

/**
 * Decides whether a PostgREST request targets a table listed in
 * {@link uncachedTables} and must therefore bypass the data cache.
 *
 * @param url - The outgoing request URL
 * @returns True when the request reads a user-mutated table
 */
const isUncachedTableRequest = (url: RequestInfo | URL): boolean => {
  const table = /\/rest\/v1\/(?<table>[^?/]+)/u.exec(toUrlString(url))?.groups
    ?.table;
  return table !== undefined && uncachedTables.has(table);
};

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: async (url, options = {}) => {
        const method = (options.method ?? "GET").toUpperCase();
        // Only cache read operations — Next.js data cache deduplicates identical
        // in-flight requests and revalidates on the given interval.
        if (
          isProduction &&
          (method === "GET" || method === "HEAD") &&
          !isUncachedTableRequest(url)
        ) {
          return await fetch(url, {
            ...options,
            next: { revalidate: CACHE_TTL.short },
          });
        }
        // Mutations (and all dev reads) must never be served from cache.
        return await fetch(url, { ...options, cache: "no-store" });
      },
    },
  }
);
