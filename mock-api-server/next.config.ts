import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

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
    /**
     * Browser cache policy for read-mostly endpoints. Stale responses stay
     * usable for twice the revalidation window so clients never block on a
     * cache miss.
     *
     * @param revalidate - Seconds a response stays fresh
     * @returns A `Cache-Control` header entry for `headers()`
     */
    const cacheHeader = (revalidate: number) => [
      {
        key: "Cache-Control",
        value: `private, max-age=${revalidate}, stale-while-revalidate=${revalidate * 2}`,
      },
    ];

    /**
     * Cache policy for user-uploaded content, which must never be cached: the
     * browser would otherwise serve the pre-upload list for up to `max-age`
     * seconds, making a saved document look like it was never written.
     */
    const noStoreHeader = [
      { key: "Cache-Control", value: "no-store, must-revalidate" },
    ];

    return [
      // Rarely-changing reference data
      { source: "/api/clients/:path*", headers: cacheHeader(300) },
      { source: "/api/accounts/:path*", headers: cacheHeader(300) },
      { source: "/api/users/:path*", headers: cacheHeader(300) },
      // Frequently-updated operational data
      // Everything under /api/meetings except the document sub-resource, which
      // is user-uploaded and handled by the no-store rule below. Excluded here
      // rather than overridden afterwards so the result does not depend on
      // which of two matching rules Next.js applies last.
      {
        source: "/api/meetings/:path((?!.*\\/documents$).*)",
        headers: cacheHeader(30),
      },
      { source: "/api/meetings", headers: cacheHeader(30) },
      { source: "/api/tasks/:path*", headers: cacheHeader(30) },
      { source: "/api/phases/:path*", headers: cacheHeader(30) },
      { source: "/api/mailing/:path*", headers: cacheHeader(30) },
      // Moderately stable data
      { source: "/api/proposals/:path*", headers: cacheHeader(120) },
      { source: "/api/positions/:path*", headers: cacheHeader(60) },
      { source: "/api/votes/:path*", headers: cacheHeader(60) },
      { source: "/api/key-dates/:path*", headers: cacheHeader(120) },
      // User-uploaded content: never cached, so a fresh upload is visible on
      // the very next refetch instead of after the TTL expires.
      { source: "/api/documents/:path*", headers: noStoreHeader },
      { source: "/api/meetings/:meetingId/documents", headers: noStoreHeader },
    ];
  },
};

export default nextConfig;
