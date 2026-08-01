import * as Sentry from "@sentry/nextjs";

/**
 * Browser-runtime Sentry init.
 *
 * `dataCollection` is deliberately not passed. Supplying it — even as `{}` —
 * flips every unset category (user info, cookies, headers, bodies, query
 * params) to its permissive default. This portal handles shareholder and
 * proxy-voting data, so the conservative `sendDefaultPii: false` default is
 * kept and categories should be opted into individually if ever needed.
 *
 * Session Replay masks all text and blocks all media for the same reason.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Full sampling while developing, 10% of production traffic.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1 : 0.1,

  // Session Replay: 10% of all sessions, plus every session that errors.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,

  enableLogs: true,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
});

/** Reports App Router navigations as spans. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
