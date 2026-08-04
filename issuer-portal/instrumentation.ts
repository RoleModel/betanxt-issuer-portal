import * as Sentry from "@sentry/nextjs";

/**
 * Next.js server-side registration hook. Loads the Sentry init matching the
 * runtime the server is booting under; the browser bundle loads
 * instrumentation-client.ts directly.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/** Captures unhandled server-side request errors (nested React Server Components included). */
export const onRequestError = Sentry.captureRequestError;
