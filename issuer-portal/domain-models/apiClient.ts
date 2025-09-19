import { getSession } from 'next-auth/react'
import createClient from 'openapi-fetch'

import type { paths } from './generated-schema'

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

export const buildApiClient = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

  let session = null

  // Only try to get session if auth bypass is not enabled
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'true') {
    try {
      session = await getSession()
    } catch (error) {
      // Silently handle session fetch errors in development
    }
  }

  const client = createClient<paths>({
    baseUrl,
    headers: {
      ...(session?.user?.id && { Authorization: `Bearer ${session.user.id}` }),
    },
  })

  return client
}

export default buildApiClient
