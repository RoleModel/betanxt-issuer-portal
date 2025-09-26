import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { CACHE_TAGS, cacheFn } from '@/lib/caching'

type Document = components['schemas']['Document']

async function fetchDocuments(meetingId: string): Promise<Document[]> {
  const api = await buildApiClient()
  const res = await api.GET('/meetings/{meetingId}/documents', {
    params: { path: { meetingId } },
  })
  if (res.error || !res.data) return []
  return res.data as unknown as Document[]
}

export const getDocumentsCached = cacheFn(
  fetchDocuments,
  (meetingId: string) => [CACHE_TAGS.DOCUMENTS_BY_MEETING(meetingId)],
  { revalidate: 60 }
)
