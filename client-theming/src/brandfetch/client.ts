/**
 * Thin, dependency-free client for the Brandfetch Brand & Search APIs.
 *
 * The API key is read from the `BRANDFETCH_API_KEY` environment variable by
 * default so no secret is ever hard-coded in this package. See the README for
 * how to obtain a key. All calls use the global `fetch` (Node 18+ or any
 * browser), so there are no runtime dependencies.
 *
 * Because the key is a private, billable credential, prefer calling these
 * functions **server-side** (API route, script, backend) rather than shipping
 * the key to the browser.
 *
 * @module brandfetch/client
 */

import type { BrandResponse, BrandSearchResult } from "./types.js";

/** Base URL for the Brandfetch v2 API. */
const BRANDFETCH_BASE_URL = "https://api.brandfetch.io/v2";

/**
 * Resolve the Brandfetch API key.
 *
 * Resolution order:
 * 1. An explicit key passed by the caller (highest priority).
 * 2. `process.env.BRANDFETCH_API_KEY` (when running under Node).
 *
 * @param explicitKey - Optional key supplied directly by the caller.
 * @returns The resolved API key.
 * @throws {Error} If no key can be resolved.
 */
export function getBrandfetchApiKey(explicitKey?: string): string {
  if (explicitKey) return explicitKey;

  const fromEnv =
    typeof process !== "undefined" && process.env
      ? process.env.BRANDFETCH_API_KEY
      : undefined;

  if (fromEnv) return fromEnv;

  throw new Error(
    "Brandfetch API key not found. Set the BRANDFETCH_API_KEY environment " +
      "variable or pass a key explicitly. See the client-theming README for how " +
      "to obtain a key."
  );
}

/**
 * Options accepted by the Brandfetch request helpers.
 */
export interface BrandfetchRequestOptions {
  /**
   * API key override. Falls back to `BRANDFETCH_API_KEY` from the environment
   * when omitted.
   */
  apiKey?: string;
  /**
   * Optional `AbortSignal` to cancel the request (e.g. for timeouts).
   */
  signal?: AbortSignal;
}

/**
 * Fetch a brand's colors, logos, and metadata by domain.
 *
 * @param domain - The brand's primary domain, e.g. `"wendys.com"`.
 * @param options - API key override and/or abort signal.
 * @returns The {@link BrandResponse}, or `null` if the brand is not found or
 *   the request fails (non-2xx, network error). Failures are swallowed so
 *   callers can treat "no brand" and "request error" uniformly.
 *
 * @example
 * ```ts
 * const brand = await fetchBrand("wendys.com");
 * if (brand) {
 *   console.log(brand.colors[0]?.hex);
 * }
 * ```
 */
export async function fetchBrand(
  domain: string,
  options: BrandfetchRequestOptions = {}
): Promise<BrandResponse | null> {
  const apiKey = getBrandfetchApiKey(options.apiKey);
  try {
    const response = await fetch(
      `${BRANDFETCH_BASE_URL}/brands/${encodeURIComponent(domain)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: options.signal,
      }
    );
    if (!response.ok) return null;
    return (await response.json()) as BrandResponse;
  } catch {
    return null;
  }
}

/**
 * Search Brandfetch for brands matching a free-text query (typically a company
 * name), returning candidate domains you can pass to {@link fetchBrand}.
 *
 * @param query - Free-text search, e.g. `"Wendy's"`.
 * @param options - API key override and/or abort signal.
 * @returns An array of {@link BrandSearchResult} (possibly empty). Returns an
 *   empty array on any error.
 *
 * @example
 * ```ts
 * const [top] = await searchBrands("Paycom");
 * const brand = top ? await fetchBrand(top.domain) : null;
 * ```
 */
export async function searchBrands(
  query: string,
  options: BrandfetchRequestOptions = {}
): Promise<BrandSearchResult[]> {
  const apiKey = getBrandfetchApiKey(options.apiKey);
  try {
    const response = await fetch(
      `${BRANDFETCH_BASE_URL}/search/${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: options.signal,
      }
    );
    if (!response.ok) return [];
    return (await response.json()) as BrandSearchResult[];
  } catch {
    return [];
  }
}

/**
 * Convenience helper: search for a company by name and fetch the best-matching
 * brand in one call.
 *
 * @param companyName - Company name to search for.
 * @param options - API key override and/or abort signal.
 * @returns The first matching {@link BrandResponse}, or `null` if nothing
 *   matched.
 */
export async function fetchBrandByName(
  companyName: string,
  options: BrandfetchRequestOptions = {}
): Promise<BrandResponse | null> {
  const results = await searchBrands(companyName, options);
  const first = results[0];
  if (!first) return null;
  return fetchBrand(first.domain, options);
}
