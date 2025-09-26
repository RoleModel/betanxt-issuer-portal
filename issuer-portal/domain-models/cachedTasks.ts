import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { CACHE_TAGS, cacheFn } from '@/lib/caching'

type Task = components['schemas']['Task']

async function fetchTasks(meetingId: string): Promise<Task[]> {
  const api = await buildApiClient()
  const res = await api.GET('/meetings/{meetingId}/tasks', {
    params: { path: { meetingId } },
  })
  if (res.error || !res.data) return []
  return res.data as unknown as Task[]
}

export const getTasksCached = cacheFn(
  fetchTasks,
  (meetingId: string) => [CACHE_TAGS.TASKS_BY_MEETING(meetingId)],
  { revalidate: 60 }
)
