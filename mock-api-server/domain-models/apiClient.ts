import createClient from 'openapi-fetch'

import type { paths } from '@/types/api'

// Create the openapi-fetch client with proper typing
const client = createClient<paths>({
  baseUrl: 'http://localhost:3001/api',
})

// Export the client directly
export const apiClient = client

// Export as default
export default client

// Re-export the type for easier imports
export type { paths } from '@/types/api'
