import createClient from 'openapi-fetch'

import type { paths } from '@/types/api'

// Create the openapi-fetch client with proper typing
// Use environment variable to avoid circular dependency when running as mock server
// Prefer API_BASE_URL, then construct from SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL, fallback to local
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const baseUrl =
  process.env.API_BASE_URL ||
  (supabaseUrl ? `${supabaseUrl}/rest/v1` : 'http://127.0.0.1:54321/rest/v1')

// Get Supabase credentials for authentication
// Use service role key to bypass RLS since this is a backend service
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const client = createClient<paths>({
  baseUrl,
  headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Prefer: 'return=representation',
  },
})

// Export the client directly
export const apiClient = client

// Export as default
export default client

// Re-export the type for easier imports
export type { paths } from '@/types/api'
