import type { components } from "@/domain-models/generated-schema";

import buildApiClient from "@/domain-models/apiClient";
import { CACHE_TAGS, cacheFn } from "@/lib/caching";

type Position = components["schemas"]["Position"];

async function fetchPositions(meetingId: string): Promise<Position[]> {
  const api = await buildApiClient();
  // Positions endpoint is PostgREST style; filter by meeting with eq.<meetingId>
  const { data } = await api.GET("/positions", {
    params: { query: { meetingId: `eq.${meetingId}` } },
  });
  if (!data) return [];
  return data;
}

export const getPositionsCached = cacheFn(
  fetchPositions,
  (meetingId: string) => [CACHE_TAGS.POSITIONS_BY_MEETING(meetingId)],
  { revalidate: 300 },
);
