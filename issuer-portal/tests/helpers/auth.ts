import type { Page } from "@playwright/test";

/** Mock users defined in `issuer-portal/auth.ts`. All share the password below. */
export const MOCK_PASSWORD = "password";

export const MOCK_USERS = {
  mike: { username: "mike", ticker: "WEN", type: "ISSUER" },
  lisa: { username: "lisa", ticker: "PAYC", type: "ISSUER" },
  david: { username: "david", ticker: "WWD", type: "ISSUER" },
  jenny: { username: "jenny", ticker: "ELVN", type: "ISSUER" },
  csm: { username: "csm.user", ticker: null, type: "CSM" },
} as const;

export type MockUserKey = keyof typeof MOCK_USERS;

/** Cookie names NextAuth may use for the session, mirroring `proxy.ts`. */
const SESSION_COOKIES = new Set([
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
]);

/**
 * Signs in through the real login form.
 *
 * An earlier version of this helper clicked per-user "Login as …" buttons that
 * the login page no longer has, and no spec imported it, so it rotted unnoticed.
 * `login.spec.ts` exercises it now so that cannot happen again silently.
 *
 * @param page - Playwright page
 * @param user - Key into {@link MOCK_USERS}
 */
export async function loginAs(
  page: Page,
  user: MockUserKey = "mike"
): Promise<void> {
  await page.goto("/login");
  await page.locator("#login-username").fill(MOCK_USERS[user].username);
  await page.locator("#login-password").fill(MOCK_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30_000,
  });
}

/** True once the browser holds a NextAuth session cookie. */
export async function hasSessionCookie(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some((cookie) => SESSION_COOKIES.has(cookie.name));
}

/**
 * Whether route protection is currently disabled by
 * `NEXT_PUBLIC_BYPASS_AUTH=true` (set in `issuer-portal/.env`). The proxy reads
 * it server-side, so it cannot be toggled per test — specs that need real
 * protection have to skip while it is on.
 */
export async function isAuthBypassed(page: Page): Promise<boolean> {
  const response = await page.request.get(
    "/WEN/meeting/wen-annual-meeting-2025",
    { maxRedirects: 0 }
  );
  const location = response.headers().location ?? "";
  return !location.includes("/login");
}
