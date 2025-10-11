import type { SWRConfiguration } from 'swr'

import { buildApiClient } from '@/domain-models/apiClient'

// Custom fetcher for API calls
export const apiFetcher = async (url: string) => {
  const client = await buildApiClient()

  // Parse the URL to extract the path and params
  const [path, queryString] = url.split('?')
  const params = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {}

  // Make the API call based on the path
  let response: { data?: unknown; error?: unknown }

  if (path === '/notifications') {
    response = await client.GET(
      '/notifications',
      params.read !== undefined
        ? { params: { query: { read: params.read === 'true' } } }
        : {}
    )
  } else if (path === '/clients') {
    response = await client.GET('/clients')
  } else {
    // For other endpoints, we'll need to handle them specifically as they're added
    throw new Error(`Unsupported API path for SWR: ${path}`)
  }

  if (response.error) {
    const errorMessage =
      typeof response.error === 'object' && 'message' in response.error
        ? String(response.error.message)
        : 'API Error'
    throw new Error(errorMessage)
  }

  return response.data
}

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  // Fetcher function
  fetcher: apiFetcher,

  // Revalidation settings
  revalidateOnFocus: false, // Don't refetch when window gains focus
  revalidateOnReconnect: true, // Refetch when reconnecting to network

  // Cache settings
  dedupingInterval: 5000, // 5 seconds - dedupe requests within this time window
  focusThrottleInterval: 5000, // 5 seconds - throttle focus revalidation

  // Error retry
  errorRetryCount: 3,
  errorRetryInterval: 5000,

  // Loading states
  loadingTimeout: 3000,

  // Comparison function to determine if data has changed
  compare: (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b)
  },

  // Keep previous data while revalidating
  keepPreviousData: true,
}

// Hook-specific configurations
export const notificationSWRConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 60000, // Poll every 60 seconds
  revalidateOnMount: true,
}

export const clientsSWRConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 0, // Don't poll - clients rarely change
  dedupingInterval: 60000, // 1 minute - clients are static
}

export const meetingDataSWRConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 30000, // Poll every 30 seconds for live data
  dedupingInterval: 10000, // 10 seconds
}
