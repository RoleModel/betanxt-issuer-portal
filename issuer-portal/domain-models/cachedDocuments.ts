import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { CACHE_TAGS, cacheFn } from '@/lib/caching'

type Document = components['schemas']['Document']

async function fetchDocuments(meetingId: string): Promise<Document[]> {
  const api = await buildApiClient()
  const { data } = await api.GET('/meetings/{meetingId}/documents', {
    params: { path: { meetingId } },
  })
  if (!data) return []
  return data as Document[]
}

export const getDocumentsCached = cacheFn(
  fetchDocuments,
  (meetingId: string) => [CACHE_TAGS.DOCUMENTS_BY_MEETING(meetingId)],
  { revalidate: 60 }
)
