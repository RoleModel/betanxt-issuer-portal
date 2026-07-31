import { unstable_cache as nextUnstableCache, revalidateTag } from "next/cache";

/**
 * Cache tag constants. Use these to group related cached fetches so we can
 * invalidate them after mutating operations (e.g. document uploads).
 */
export const CACHE_TAGS = {
  DOCUMENTS_BY_MEETING: (meetingId: string) => `documents:meeting:${meetingId}`,
  MEETING: (meetingId: string) => `meeting:${meetingId}`,
  CLIENT: (clientTicker: string) => `client:${clientTicker.toLowerCase()}`,
  TASKS_BY_MEETING: (meetingId: string) => `tasks:meeting:${meetingId}`,
  POSITIONS_BY_MEETING: (meetingId: string) => `positions:meeting:${meetingId}`,
} as const;

/**
 * Helper to wrap an async function with Next's server data cache while assigning tags.
 * Example:
 * const getDocumentsCached = cacheFn(
 *   async (meetingId: string) => fetchDocsFromApi(meetingId),
 *   (meetingId: string) => [CACHE_TAGS.DOCUMENTS_BY_MEETING(meetingId)],
 *   { revalidate: 60 }
 * )
 */
export function cacheFn<TArguments extends unknown[], TReturn>(
  function_: (...arguments_: TArguments) => Promise<TReturn>,
  tagBuilder: (...arguments_: TArguments) => string[],
  options: { revalidate?: number } = {}
): (...arguments_: TArguments) => Promise<TReturn> {
  return async (...arguments_: TArguments): Promise<TReturn> => {
    const builtTags = tagBuilder(...arguments_);
    const key = JSON.stringify([
      "cacheFn",
      function_.name ?? "anon",
      arguments_,
    ]);
    const cached = nextUnstableCache(
      async () => await function_(...arguments_),
      [key],
      {
        tags: builtTags,
        revalidate: options.revalidate ?? 60,
      }
    );
    return await cached();
  };
}

/**
 * Invalidate a set of cache tags.
 */
export function invalidateTags(tags: string[]) {
  for (const tag of tags) {
    revalidateTag(tag, "default");
  }
}
