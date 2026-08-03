/**
 * Determines whether this runtime should send events to Sentry.
 *
 * Local Next.js development emits compiler, Fast Refresh, and browser-runtime
 * errors that are useful in the terminal but do not represent deployable
 * failures. Production and Vercel preview builds stay enabled automatically;
 * a developer can opt a local browser in with `NEXT_PUBLIC_SENTRY_ENABLED` and
 * the server/edge runtimes in with `SENTRY_ENABLED`.
 *
 * @returns Whether the current runtime should initialize Sentry event capture.
 */
export const isSentryEnabled = (): boolean =>
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" ||
  process.env.SENTRY_ENABLED === "true";
