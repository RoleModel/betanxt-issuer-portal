import type { components } from "@/domain-models/generated-schema";

import buildApiClient from "@/domain-models/apiClient";
import { CACHE_TAGS, cacheFn } from "@/lib/caching";

type Meeting = components["schemas"]["Meeting"];

async function fetchMeetings(ticker?: string): Promise<Meeting[]> {
  const api = await buildApiClient();
  const { data } = await api.GET("/meetings", {
    params: { query: ticker ? { ticker } : {} },
  });
  if (!data) return [];

  // The API returns an array of meetings directly
  return data;
}

export const getMeetingsCached = cacheFn(
  fetchMeetings,
  (ticker?: string) => (ticker ? [CACHE_TAGS.CLIENT(ticker)] : ["meetings:all"]),
  { revalidate: 120 },
);
