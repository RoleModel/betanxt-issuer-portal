import createClient from 'openapi-fetch'
import type { paths } from '@/types/api'
import { supabase } from '@/utils/supabase/client'

// Create the openapi-fetch client with proper typing
const client = createClient<paths>({
  baseUrl: 'http://localhost:3001/api'
})

// Export the client directly
export const apiClient = client

// For backward compatibility with domain models that still use Supabase directly
// TODO: Refactor domain models to use openapi-fetch instead of direct Supabase access
export const buildApiClient = () => {
  return supabase
}

// Export type for backward compatibility with domain models
export type ApiClientReturnType<T> =
  | {
    data: T
    error: undefined
  }
  | {
    data: undefined
    error: {
      message: string
      statusCode?: number
    }
  }

// Export as default
export default client

// Re-export the type for easier imports
export type { paths } from '@/types/api'