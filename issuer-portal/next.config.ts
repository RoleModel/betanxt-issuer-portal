import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";
import { withRelatedProject } from "@vercel/related-projects";

const repoRoot = path.resolve(import.meta.dirname, "..");

// On Vercel, resolve the mock-api-server host for the matching environment
// (preview branch deploys talk to the same branch's API deploy). Locally and
// off-Vercel this falls back to the explicit env var, then localhost.
const fallbackApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

const relatedApiHost = withRelatedProject({
  projectName: "mock-api-server",
  defaultHost: "",
});

const apiBaseUrl =
  process.env.VERCEL && relatedApiHost
    ? `${relatedApiHost}/api`
    : fallbackApiBaseUrl;

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
  },
  experimental: {
    viewTransition: true,
  },
  productionBrowserSourceMaps: true,
  // Deliberately NOT enabling `reactCompiler`. It forces Next to configure
  // babel-loader even under Turbopack (see `turbopackUseBuiltinBabel`), which
  // replaces the SWC transform path for every file and made route compilation
  // slow enough that navigation stalled on loading states. Manual useMemo /
  // useCallback in this codebase is therefore load-bearing — do not strip it
  // on the assumption that the compiler handles memoization.
  reactStrictMode: false,
  turbopack: {
    root: repoRoot,
  },
  transpilePackages: [
    "@rolemodel/betanxt-design-system",
    "@mui/x-data-grid",
    "@mui/x-data-grid-pro",
    "@mui/x-date-pickers",
  ],
};

// Wraps the build so Sentry can upload source maps and instrument the
// runtimes. Org and project are the real values from `sentry wizard`, with env
// overrides for anyone pointing a build at a different Sentry project. The
// upload token is build-time only and never hardcoded: it comes from
// SENTRY_AUTH_TOKEN, which `.env.sentry-build-plugin` (gitignored) supplies
// locally and the CI/Vercel environment supplies for deploys.
//
// Note: `withSentryConfig`'s tree-shaking and automaticVercelMonitors options
// are webpack-only, and this app builds with Turbopack, so they are omitted —
// the wizard's generated config set them, but they would be inert here.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? "rolemodel-software",
  project: process.env.SENTRY_PROJECT ?? "issuer-portal",
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload a wider set of client files so browser stack traces resolve.
  widenClientFileUpload: true,

  // Proxy events through the app's own origin so ad-blockers don't drop them.
  tunnelRoute: "/monitoring",

  silent: !process.env.CI,
});
