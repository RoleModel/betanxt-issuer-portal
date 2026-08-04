import type { components } from "@/domain-models/generated-schema";

import buildApiClient from "@/domain-models/apiClient";
import { CACHE_TAGS, cacheFn } from "@/lib/caching";

type Task = components["schemas"]["Task"];

async function fetchTasks(meetingId: string): Promise<Task[]> {
  const api = await buildApiClient();
  const { data } = await api.GET("/meetings/{meetingId}/tasks", {
    params: { path: { meetingId } },
  });
  if (!data) {
    return [];
  }
  return data;
}

export const getTasksCached = cacheFn(
  fetchTasks,
  (meetingId: string) => [CACHE_TAGS.TASKS_BY_MEETING(meetingId)],
  { revalidate: 60 }
);
