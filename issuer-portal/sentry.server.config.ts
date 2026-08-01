import * as Sentry from "@sentry/nextjs";

// A DSN is a public, write-only ingest key — safe to commit. The env var
// takes precedence so a fork or a separate environment can redirect events.
const DEFAULT_DSN =
  "https://fb98f028a0a481298e221dbd146ebdfd@o4507464889073664.ingest.us.sentry.io/4511836801662976";

/**
 * Node.js server-runtime Sentry init.
 *
 * See instrumentation-client.ts for why `dataCollection` is intentionally
 * omitted rather than passed as an empty object.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN ?? DEFAULT_DSN,

  // Flat 10% in every environment. Development previously sampled at 100%,
  // which flooded the project with local page loads (ui.long-animation-frame
  // in particular) and drowned out real signal.
  tracesSampleRate: 0.1,

  // Attach local variable values to stack frames.
  includeLocalVariables: true,

  enableLogs: true,
});
