import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'
import { cacheFn, CACHE_TAGS } from '@/lib/caching'

type Meeting = components['schemas']['Meeting']

async function fetchMeetings(ticker?: string): Promise<Meeting[]> {
  const api = await buildApiClient()
  const res = await api.GET('/meetings', {
    params: { query: ticker ? { ticker } : {} },
  })
  if (res.error) return []
  const meetingsArray = (res.data as any)?.meetings ?? res.data ?? []
  return meetingsArray as Meeting[]
}

export const getMeetingsCached = cacheFn(
  fetchMeetings,
  (ticker?: string) => (ticker ? [CACHE_TAGS.CLIENT(ticker)] : ['meetings:all']),
  { revalidate: 120 }
)
