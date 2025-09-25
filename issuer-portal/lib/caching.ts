import { unstable_cache as nextUnstableCache, revalidateTag } from 'next/cache'

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
} as const

/**
 * Helper to wrap an async function with Next's server data cache while assigning tags.
 * Example:
 * const getDocumentsCached = cacheFn(
 *   async (meetingId: string) => fetchDocsFromApi(meetingId),
 *   (meetingId: string) => [CACHE_TAGS.DOCUMENTS_BY_MEETING(meetingId)],
 *   { revalidate: 60 }
 * )
 */
export function cacheFn<Fn extends (...args: any[]) => Promise<any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
  fn: Fn,
  tagBuilder: (...args: Parameters<Fn>) => string[],
  options: { revalidate?: number } = {}
): (...args: Parameters<Fn>) => Promise<Awaited<ReturnType<Fn>>> {
  return async (...args: Parameters<Fn>): Promise<Awaited<ReturnType<Fn>>> => {
    const builtTags = tagBuilder(...args)
    const key = JSON.stringify(['cacheFn', fn.name || 'anon', args])
    const cached = nextUnstableCache(
      async () => fn(...args),
      [key],
      { tags: builtTags, revalidate: options.revalidate ?? 60 }
    )
    return cached() as Promise<Awaited<ReturnType<Fn>>>
  }
}

/**
 * Invalidate a set of cache tags.
 */
export function invalidateTags(tags: string[]) {
  for (const tag of tags) revalidateTag(tag)
}
