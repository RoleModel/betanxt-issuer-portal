import { expect, test } from "@playwright/test";

import {
  hasSessionCookie,
  isAuthBypassed,
  loginAs,
  MOCK_PASSWORD,
  MOCK_USERS,
} from "../helpers/auth";

/**
 * E2E coverage for specs/003-user-login.
 *
 * Login had no tests at all before this file; the only auth helper in the repo
 * described a sign-in UI that no longer existed and was imported by nothing.
 */

test.describe("L1 — Login form", () => {
  test("renders username, password and a submit control", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("#login-username")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  // FR-006: both fields are required before the form will submit.
  test("will not submit with empty fields", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/login/);
    expect(await hasSessionCookie(page)).toBe(false);
  });

  // FR-004: password is masked so it is not shoulder-readable.
  test("masks the password field", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("#login-password")).toHaveAttribute(
      "type",
      "password"
    );
  });
});

test.describe("L2 — Rejected credentials", () => {
  // FR-004: a wrong password is refused and establishes no session.
  test("shows an error and creates no session for a bad password", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator("#login-username").fill(MOCK_USERS.mike.username);
    await page.locator("#login-password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid credentials")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page).toHaveURL(/\/login/);
    expect(await hasSessionCookie(page)).toBe(false);
  });

  // FR-005: an unknown username must be indistinguishable from a wrong
  // password, so the form cannot be used to enumerate accounts.
  test("does not reveal whether a username exists", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#login-username").fill("no-such-user-at-all");
    await page.locator("#login-password").fill(MOCK_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid credentials")).toBeVisible({
      timeout: 20_000,
    });
    expect(await hasSessionCookie(page)).toBe(false);
  });
});

test.describe("L3 — Successful sign-in", () => {
  // FR-003 / FR-011: valid credentials establish a session and leave /login.
  test("signs in an issuer and establishes a session", async ({ page }) => {
    await loginAs(page, "mike");

    expect(await hasSessionCookie(page)).toBe(true);
    await expect(page).not.toHaveURL(/\/login/);
  });

  // FR-008 / FR-009: the session carries the user's client scope, so an
  // issuer lands in their own client's context.
  test("scopes an issuer to their own client", async ({ page }) => {
    await loginAs(page, "mike");

    await page.goto(`/${MOCK_USERS.mike.ticker}/meeting`);
    await expect(page).toHaveURL(
      new RegExp(`/${MOCK_USERS.mike.ticker}/`, "i")
    );
    expect(await hasSessionCookie(page)).toBe(true);
  });

  // A second identity proves scoping is per-user rather than hardcoded.
  test("signs in a different issuer independently", async ({ page }) => {
    await loginAs(page, "lisa");

    expect(await hasSessionCookie(page)).toBe(true);
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("L4 — Route protection", () => {
  // FR-001 / FR-002. NEXT_PUBLIC_BYPASS_AUTH is read server-side by proxy.ts,
  // so it cannot be toggled per test. It ships as true in issuer-portal/.env,
  // which disables protection for local development — this skips rather than
  // reporting a false pass.
  test("redirects an unauthenticated deep link to /login", async ({ page }) => {
    test.skip(
      await isAuthBypassed(page),
      "NEXT_PUBLIC_BYPASS_AUTH=true disables route protection; set it to false to run this"
    );

    await page.goto("/WEN/meeting/wen-annual-meeting-2025/tabulation");

    await expect(page).toHaveURL(/\/login/);
  });

  test("serves the login page itself without a session", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
});
