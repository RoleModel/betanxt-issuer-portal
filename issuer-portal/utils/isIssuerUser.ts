const MULTI_CLIENT_ROLES = new Set([
  "ADMIN",
  "CSM",
  "PARENT_CLIENT",
  "SOLICITOR",
  "RELATIONSHIP_MANAGER",
]);

export interface IssuerSessionUser {
  type?: string;
  client_ticker?: string | null;
  clientTickers?: string[];
  roles?: string[];
  username?: string;
}

function normalizeRole(role: string | undefined): string | undefined {
  return role?.trim().toUpperCase();
}

/** Mock issuer credentials in auth.ts — used when JWT type is missing or stale. */
const ISSUER_USERNAMES = new Set(["tim", "mike", "lisa", "david", "jenny"]);

export function isIssuerUser(user: IssuerSessionUser | null | undefined): boolean {
  if (!user) {
    return (
      process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" &&
      process.env.NEXT_PUBLIC_BYPASS_USER_ROLE === "ISSUER"
    );
  }

  const role = normalizeRole(user.type);
  if (role === "ISSUER") return true;

  if (user.roles?.some((r) => normalizeRole(r) === "ISSUER")) return true;

  if (user.username && ISSUER_USERNAMES.has(user.username)) return true;

  if (role && MULTI_CLIENT_ROLES.has(role)) return false;

  const homeTicker = user.client_ticker?.trim();
  if (!homeTicker) return false;

  const assigned = user.clientTickers ?? [];
  if (assigned.length === 0) return true;
  if (assigned.length === 1 && assigned[0] === homeTicker) return true;

  return false;
}

export function canUserSwitchClients(user: IssuerSessionUser | null | undefined): boolean {
  if (isIssuerUser(user)) return false;

  const role = normalizeRole(user?.type);
  if (
    role === "ADMIN" ||
    role === "RELATIONSHIP_MANAGER" ||
    role === "CSM" ||
    role === "PARENT_CLIENT" ||
    role === "SOLICITOR"
  ) {
    return true;
  }

  if (process.env.NEXT_PUBLIC_BYPASS_AUTH !== "true") return false;

  if (!user) {
    const bypassRole = normalizeRole(process.env.NEXT_PUBLIC_BYPASS_USER_ROLE);
    return (
      bypassRole === "ADMIN" ||
      bypassRole === "CSM" ||
      bypassRole === "PARENT_CLIENT" ||
      bypassRole === "SOLICITOR"
    );
  }

  return false;
}
