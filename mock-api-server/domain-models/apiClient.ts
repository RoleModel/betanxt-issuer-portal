import createClient from 'openapi-fetch'

import type { paths } from '@/types/api'

// Create the openapi-fetch client with proper typing
// Use environment variable to avoid circular dependency when running as mock server
const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:54321/rest/v1'
const client = createClient<paths>({
  baseUrl,
})

// Export the client directly
export const apiClient = client

// Export as default
export default client

// Re-export the type for easier imports
export type { paths } from '@/types/api'
