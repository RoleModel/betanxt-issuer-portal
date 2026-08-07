import type { APIRequestContext } from "@playwright/test";

/** Mock-api base, matching the app's own default. */
const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

/**
 * Releases a meeting's tabulation so its charts and tables render.
 *
 * @param request - Playwright's request context, from the test's fixtures
 * @param meetingId - The meeting to release
 *
 * @remarks
 * Tabulation is withheld until a CSM releases it, so any spec that asserts on a
 * chart, a vote table, or the tabulation report has to say so first — otherwise
 * it is asserting against the locked empty state. Stating it here rather than
 * relying on seeded values keeps these specs independent of whichever meetings
 * the seed happens to release.
 *
 * Idempotent, so a spec can call it per test without checking first.
 */
export async function releaseTabulation(
  request: APIRequestContext,
  meetingId: string
): Promise<void> {
  const response = await request.put(`${apiBase}/meetings/${meetingId}`, {
    data: { tabulationReleased: true },
  });

  if (!response.ok()) {
    throw new Error(
      `Could not release tabulation for ${meetingId}: ${String(response.status())}`
    );
  }
}
