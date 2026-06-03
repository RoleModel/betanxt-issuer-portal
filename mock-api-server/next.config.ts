import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  turbopack: {
    root: repoRoot,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  async headers() {
    const cacheHeader = (revalidate: number) => [
      {
        key: "Cache-Control",
        value: `private, max-age=${revalidate}, stale-while-revalidate=${revalidate * 2}`,
      },
    ];

    return [
      // Rarely-changing reference data
      { source: "/api/clients/:path*", headers: cacheHeader(300) },
      { source: "/api/accounts/:path*", headers: cacheHeader(300) },
      { source: "/api/users/:path*", headers: cacheHeader(300) },
      // Frequently-updated operational data
      { source: "/api/meetings/:path*", headers: cacheHeader(30) },
      { source: "/api/tasks/:path*", headers: cacheHeader(30) },
      { source: "/api/phases/:path*", headers: cacheHeader(30) },
      { source: "/api/mailing/:path*", headers: cacheHeader(30) },
      // Moderately stable data
      { source: "/api/proposals/:path*", headers: cacheHeader(120) },
      { source: "/api/positions/:path*", headers: cacheHeader(60) },
      { source: "/api/votes/:path*", headers: cacheHeader(60) },
      { source: "/api/documents/:path*", headers: cacheHeader(60) },
      { source: "/api/key-dates/:path*", headers: cacheHeader(120) },
    ];
  },
};

export default nextConfig;
