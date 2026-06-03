import { supabase } from "@/utils/supabase/client";

/**
 * Maps NextAuth session identifiers to a user row in the database.
 * Mock auth IDs (e.g. csm.user) may not match seeded UUIDs unless aligned in seed.config.
 */
export async function resolveNotificationUserId(
  userId?: string | null,
  username?: string | null,
): Promise<string | undefined> {
  const trimmedUsername = username?.trim();
  if (trimmedUsername) {
    const { data: byUsername } = await supabase
      .from("user")
      .select("id")
      .eq("username", trimmedUsername)
      .maybeSingle();
    if (byUsername?.id) return byUsername.id;
  }

  const trimmedUserId = userId?.trim();
  if (trimmedUserId) {
    const { data: byId } = await supabase
      .from("user")
      .select("id")
      .eq("id", trimmedUserId)
      .maybeSingle();
    if (byId?.id) return byId.id;
    return trimmedUserId;
  }

  return undefined;
}

export async function getMeetingIdsForTicker(ticker: string): Promise<string[]> {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized) return [];

  const { data } = await supabase.from("meeting").select("id").eq("ticker", normalized);

  return (data ?? []).map((row) => row.id).filter((id): id is string => Boolean(id));
}
