import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const nextConfig = {
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
