import fs from "node:fs";

import type { BrandConfig } from "../utils/brandConfig";

function formatConfigKey(key: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return key;
  if (key.includes("'")) return `"${key.replace(/"/g, '\\"')}"`;
  return `'${key.replace(/'/g, "\\'")}'`;
}

function serializeEntry(val: BrandConfig): string {
  const lines: string[] = [
    `    companyName: '${val.companyName.replace(/'/g, "\\'")}',`,
  ];

  if (val.ticker) lines.push(`    ticker: "${val.ticker}",`);
  lines.push(`    domain: '${val.domain}',`);
  lines.push(`    logoPath: '${val.logoPath}',`);
  lines.push(`    iconPath: '${val.iconPath}',`);
  if (val.headerLogoPath)
    lines.push(`    headerLogoPath: '${val.headerLogoPath}',`);
  if (val.headerIconPath)
    lines.push(`    headerIconPath: '${val.headerIconPath}',`);
  lines.push(`    primaryColor: '${val.primaryColor}',`);
  lines.push(`    secondaryColor: '${val.secondaryColor}',`);

  return lines.join("\n");
}

export function writeBrandConfigFile(
  configs: Record<string, BrandConfig>,
  configPath: string
): void {
  const entries = Object.entries(configs)
    .map(
      ([key, val]) =>
        `  ${formatConfigKey(key)}: {\n${serializeEntry(val)}\n  }`
    )
    .join(",\n");

  const content = `/**
 * Brand configuration for event companies.
 * headerLogoPath / headerIconPath: dark-theme assets from Brandfetch (light logos on primary headers).
 * Refresh: npx tsx scripts/fetch-dark-logos.ts
 */

export interface BrandConfig {
  companyName: string;
  ticker?: string;
  domain: string;
  logoPath: string;
  iconPath: string;
  headerLogoPath?: string;
  headerIconPath?: string;
  primaryColor: string;
  secondaryColor: string;
}

export const brandConfigs: Record<string, BrandConfig> = {
${entries},
};

/**
 * Secondary index keyed by ticker for reliable logo lookup.
 * Use this when you have a ticker but not a company name — avoids
 * brittle exact-string key matching on company names.
 */
export const brandConfigsByTicker: Record<string, BrandConfig> = Object.values(brandConfigs).reduce(
  (acc, config) => {
    if (config.ticker) acc[config.ticker] = config;
    return acc;
  },
  {} as Record<string, BrandConfig>,
);

/** Look up brand config by event/company name */
export function getBrandConfig(companyName: string): BrandConfig | null {
  return brandConfigs[companyName] ?? null;
}

/** Look up brand config by stock ticker (more reliable than company name) */
export function getBrandConfigByTicker(ticker: string): BrandConfig | null {
  return brandConfigsByTicker[ticker] ?? null;
}

/** Get the logo path for a company, with fallback */
export function getBrandLogoPath(companyName: string, fallback = "/images/logo.svg"): string {
  return brandConfigs[companyName]?.logoPath || fallback;
}

/** Get the icon path for a company, with fallback */
export function getBrandIconPath(companyName: string, fallback = "/images/logo.svg"): string {
  return brandConfigs[companyName]?.iconPath || fallback;
}
`;

  fs.writeFileSync(configPath, content, "utf-8");
}
