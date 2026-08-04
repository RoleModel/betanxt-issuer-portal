/**
 * Single source of truth for whether the in-app developer overlay (the
 * hover-to-inspect tool and its supporting `/api/dev/source` route) is active.
 *
 * @returns `true` under `next dev`, or in any deployment where
 * `NEXT_PUBLIC_ENABLE_DEV_OVERLAY` is set to `"true"`.
 *
 * @remarks
 * The overlay used to be gated on `NODE_ENV === "development"` alone, so it was
 * compiled out of every Vercel build (preview and production both run with
 * `NODE_ENV=production`). Remote developers who never clone the repo could not
 * reach it. Gating on a public flag instead lets us switch the inspector on for
 * Preview deployments — set `NEXT_PUBLIC_ENABLE_DEV_OVERLAY=true` in Vercel's
 * Preview environment and leave it unset in Production.
 *
 * Because the name is prefixed `NEXT_PUBLIC_`, the value is inlined at build
 * time and this helper resolves identically on the server and in the browser.
 */
export const isDevOverlayEnabled = (): boolean =>
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_OVERLAY === "true";
