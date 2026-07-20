import { NextResponse } from "next/server";

/**
 * Handle CORS for API routes
 * This function creates an OPTIONS handler for API routes
 */
export function handleCors() {
  const response = new NextResponse(null, { status: 200 });
  const origin = "*"; // Allow all origins in development

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

/**
 * Add CORS headers to a NextResponse.
 * Pass `revalidate` (seconds) on GET responses to enable browser-level HTTP caching
 * with stale-while-revalidate so clients never block on a cache miss.
 */
export function withCors(
  response: NextResponse,
  origin = "*",
  revalidate?: number
) {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");

  if (revalidate !== undefined) {
    response.headers.set(
      "Cache-Control",
      `private, max-age=${revalidate}, stale-while-revalidate=${revalidate * 2}`
    );
  }

  return response;
}
