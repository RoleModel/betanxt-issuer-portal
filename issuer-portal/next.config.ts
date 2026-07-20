import { withRelatedProject } from "@vercel/related-projects";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

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
  productionBrowserSourceMaps: true,
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

export default nextConfig;
