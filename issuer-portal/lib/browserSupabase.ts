import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Lazily create a browser (anon) Supabase client.
// We intentionally do NOT ever embed a service role key in the browser bundle.
// If env vars are missing we log a warning and return a no-op shim that throws only when an operation is attempted, instead of blowing up at import time.

let browserClient: SupabaseClient | null = null;
let disabledClient: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Cached rather than recreated per call: callers commonly put this
    // client in a useEffect dependency array, and a fresh Proxy identity on
    // every render loops that effect forever.
    if (!disabledClient) {
      console.warn(
        "[browserSupabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Returning disabled client."
      );
      // Create a tiny proxy that surfaces clearer errors when used
      disabledClient = new Proxy({} as SupabaseClient, {
        get() {
          throw new Error(
            "Supabase client not configured in browser – missing env vars."
          );
        },
      });
    }
    return disabledClient;
  }

  browserClient = createClient(url, anon, {
    auth: { persistSession: true },
  });
  return browserClient;
}
