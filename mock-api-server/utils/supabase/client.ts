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

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: (url, options = {}) => {
      const method = (options.method ?? "GET").toUpperCase();
      // Only cache read operations — Next.js data cache deduplicates identical
      // in-flight requests and revalidates on the given interval.
      if (method === "GET" || method === "HEAD") {
        return fetch(url, { ...options, next: { revalidate: CACHE_TTL.short } });
      }
      // Mutations must never be served from cache.
      return fetch(url, { ...options, cache: "no-store" });
    },
  },
});
