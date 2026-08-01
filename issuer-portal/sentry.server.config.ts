import * as Sentry from "@sentry/nextjs";

/**
 * Node.js server-runtime Sentry init.
 *
 * See instrumentation-client.ts for why `dataCollection` is intentionally
 * omitted rather than passed as an empty object.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Full sampling while developing, 10% of production traffic.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1 : 0.1,

  // Attach local variable values to stack frames.
  includeLocalVariables: true,

  enableLogs: true,
});
