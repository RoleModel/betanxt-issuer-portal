/**
 * An in-memory registry of {@link BrandConfig}s plus lookup helpers.
 *
 * The entries below are a small, illustrative sample. In a real project you
 * generate this file (or a JSON equivalent) from Brandfetch — see the README's
 * "Generating a registry" section and {@link brandResponseToBrandConfig}. The
 * lookup helpers work the same regardless of how the data was produced.
 *
 * @module brand/registry
 */

import type { BrandConfig } from "./types.js";

/**
 * Example brand registry, keyed by company name.
 *
 * Replace or extend this with your own clients. Keys are the exact
 * `companyName` values; a ticker index is derived from these automatically
 * (see {@link brandConfigsByTicker}).
 */
export const brandConfigs: Record<string, BrandConfig> = {
  "The Wendy's Company": {
    companyName: "The Wendy's Company",
    ticker: "WEN",
    domain: "wendys.com",
    logoPath: "/logos/WEN_logo.svg",
    iconPath: "/logos/WEN_icon.svg",
    primaryColor: "#0078A3",
    secondaryColor: "#DAD55E",
  },
  "Paycom Software, Inc.": {
    companyName: "Paycom Software, Inc.",
    ticker: "PAYC",
    domain: "paycom.com",
    logoPath: "/logos/PAYC_logo.svg",
    iconPath: "/logos/PAYC_icon.svg",
    primaryColor: "#005C2B",
    secondaryColor: "#193E2D",
  },
  "Woodward, Inc.": {
    companyName: "Woodward, Inc.",
    ticker: "WWD",
    domain: "woodward.com",
    logoPath: "/logos/WWD_logo.svg",
    iconPath: "/logos/WWD_icon.svg",
    primaryColor: "#6D6E71",
    secondaryColor: "#24272A",
  },
};

/**
 * Ticker-indexed view of {@link brandConfigs}. Prefer ticker lookups where
 * possible — they are far more reliable than exact company-name string
 * matching. Rebuilt from `brandConfigs` at module load.
 */
export const brandConfigsByTicker: Record<string, BrandConfig> = Object.values(
  brandConfigs
).reduce(
  (accumulator, config) => {
    if (config.ticker) accumulator[config.ticker.toUpperCase()] = config;
    return accumulator;
  },
  {} as Record<string, BrandConfig>
);

/**
 * Look up a brand config by exact company name.
 *
 * @param companyName - The registry key (exact `companyName`).
 * @returns The matching {@link BrandConfig}, or `null`.
 */
export function getBrandConfig(companyName: string): BrandConfig | null {
  return brandConfigs[companyName] ?? null;
}

/**
 * Look up a brand config by ticker (case-insensitive).
 *
 * @param ticker - Stock ticker, e.g. `"WEN"`.
 * @returns The matching {@link BrandConfig}, or `null`.
 */
export function getBrandConfigByTicker(ticker: string): BrandConfig | null {
  return brandConfigsByTicker[ticker.toUpperCase()] ?? null;
}

/**
 * Get a company's light-background logo path, with a fallback.
 *
 * @param companyName - The registry key (exact `companyName`).
 * @param fallback - Returned when the company or its logo is missing.
 * @returns The logo path or the fallback.
 */
export function getBrandLogoPath(
  companyName: string,
  fallback = "/images/logo.svg"
): string {
  return brandConfigs[companyName]?.logoPath || fallback;
}

/**
 * Get a company's light-background icon path, with a fallback.
 *
 * @param companyName - The registry key (exact `companyName`).
 * @param fallback - Returned when the company or its icon is missing.
 * @returns The icon path or the fallback.
 */
export function getBrandIconPath(
  companyName: string,
  fallback = "/images/logo.svg"
): string {
  return brandConfigs[companyName]?.iconPath || fallback;
}
