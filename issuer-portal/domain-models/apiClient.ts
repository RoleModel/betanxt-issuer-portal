import { getSession } from 'next-auth/react'
import createClient from 'openapi-fetch'

import type { paths as ExpandedPaths } from '@/types/api'

import type { paths as LegacyPaths } from './generated-schema'

type CombinedPaths = LegacyPaths & ExpandedPaths

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

// Simple cache to prevent duplicate API calls within a short time window
interface CacheEntry {
  data: unknown
  timestamp: number
}

const apiCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5000 // 5 seconds cache TTL for performance

// Session cache to prevent excessive getSession() calls
interface SessionCacheEntry {
  session: unknown
  timestamp: number
}

let sessionCache: SessionCacheEntry | null = null
const SESSION_CACHE_TTL = 60 * 1000 // 60 seconds - longer cache to reduce API calls

const getCachedSession = async () => {
  // Check if we have a valid cached session
  if (sessionCache && Date.now() - sessionCache.timestamp < SESSION_CACHE_TTL) {
    return sessionCache.session
  }

  // Fetch fresh session
  try {
    const session = await getSession()
    sessionCache = { session, timestamp: Date.now() }
    return session
  } catch (error) {
    console.error('Failed to retrieve session in buildApiClient', error)
    return null
  }
}

// Function to clear session cache (useful for logout or session changes)
export const clearSessionCache = () => {
  sessionCache = null
}

export const getCacheKey = (url: string, params?: Record<string, unknown>): string => {
  return `${url}:${JSON.stringify(params || {})}`
}

export const getCachedResponse = <T>(key: string): T | null => {
  const entry = apiCache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T
  }
  return null
}

export const setCachedResponse = <T>(key: string, data: T): void => {
  apiCache.set(key, { data, timestamp: Date.now() })
}

export const buildApiClient = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

  let session = null

  // Only try to get session if auth bypass is not enabled
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'true') {
    session = await getCachedSession()
  }

  const client = createClient<CombinedPaths>({
    baseUrl,
    headers: {
      ...(session?.user?.id && { Authorization: `Bearer ${session.user.id}` }),
    },
  })

  return client
}

export default buildApiClient
