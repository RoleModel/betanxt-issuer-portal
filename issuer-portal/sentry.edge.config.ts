import * as Sentry from "@sentry/nextjs";

// A DSN is a public, write-only ingest key — safe to commit. The env var
// takes precedence so a fork or a separate environment can redirect events.
const DEFAULT_DSN =
  "https://fb98f028a0a481298e221dbd146ebdfd@o4507464889073664.ingest.us.sentry.io/4511836801662976";

/**
 * Edge-runtime Sentry init (proxy/middleware and any edge route handlers).
 *
 * See instrumentation-client.ts for why `dataCollection` is intentionally
 * omitted rather than passed as an empty object.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN ?? DEFAULT_DSN,

  // Full sampling while developing, 10% of production traffic.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1 : 0.1,

  enableLogs: true,
});
