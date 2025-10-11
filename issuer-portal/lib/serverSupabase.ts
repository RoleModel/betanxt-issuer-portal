import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client using service role key (never expose this client to the browser!)
// Falls back to anon key if service role not configured so local dev doesn't hard fail.
// This allows us to tighten storage & RLS policies later without changing application code.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function getServerSupabase() {
  const key = SERVICE_ROLE_KEY || ANON_KEY
  if (!key) {
    throw new Error(
      '[serverSupabase] Missing Supabase key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable.'
    )
  }
  return createClient(SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export const DOCUMENTS_BUCKET = 'documents'
