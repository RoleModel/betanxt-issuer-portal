/**
 * Fetch dark-theme logos from Brandfetch for PDF headers on primary-colored backgrounds.
 *
 * Usage: npx tsx scripts/fetch-dark-logos.ts
 * Requires BRANDFETCH_API_KEY in issuer-portal/.env
 */
import * as path from "node:path";

import { brandConfigs } from "../utils/brandConfig";
import {
  BRANDFETCH_API_KEY,
  darkAssetPublicPath,
  downloadFile,
  fetchBrand,
  inferAssetBase,
  pickBestLogo,
  usesBrandsFolder,
} from "./brandfetch-utils";
import { writeBrandConfigFile } from "./write-brand-config";
import type { BrandConfig } from "../utils/brandConfig";

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const CONFIG_PATH = path.resolve(__dirname, "../utils/brandConfig.ts");
const PUBLIC_LOGOS = path.resolve(__dirname, "../public/logos");

async function downloadDarkAsset(
  format: { src: string; format: string } | null,
  publicPath: string
): Promise<string | null> {
  if (!format) {
    return null;
  }
  const rel = publicPath.replace(/^\//, "");
  const destinationPath = path.join(PUBLIC_LOGOS, rel.replace(/^logos\//, ""));
  const isOk = await downloadFile(format.src, destinationPath);
  return isOk ? publicPath : null;
}

async function main(): Promise<void> {
  if (!BRANDFETCH_API_KEY) {
    console.error("Error: BRANDFETCH_API_KEY not found in .env");
    process.exit(1);
  }

  const updated: Record<string, BrandConfig> = { ...brandConfigs };
  let fetched = 0;
  let skipped = 0;

  const entries = Object.entries(brandConfigs);
  for (let index = 0; index < entries.length; index++) {
    const [company, config] = entries[index];
    console.log(`[${index + 1}/${entries.length}] ${company}`);

    if (!config.domain) {
      console.warn("  No domain — skipping");
      skipped++;
      continue;
    }

    const brand = await fetchBrand(config.domain, BRANDFETCH_API_KEY);
    if (!brand?.logos?.length) {
      console.warn(`  No brand data for ${config.domain}`);
      skipped++;
      continue;
    }

    const base = inferAssetBase(
      config.logoPath,
      config.iconPath,
      config.ticker,
      company
    );
    const isInBrands = usesBrandsFolder(config.logoPath, config.iconPath);

    const darkFull =
      pickBestLogo(brand.logos, "logo", "dark") ??
      pickBestLogo(brand.logos, "symbol", "dark");
    const darkIcon =
      pickBestLogo(brand.logos, "icon", "dark") ??
      pickBestLogo(brand.logos, "symbol", "dark");

    let { headerLogoPath, headerIconPath } = config;

    if (darkFull) {
      const publicPath = darkAssetPublicPath(
        base,
        "logo",
        darkFull.format === "svg" ? "svg" : "png",
        isInBrands
      );
      const saved = await downloadDarkAsset(darkFull, publicPath);
      if (saved) {
        headerLogoPath = saved;
        console.log(`  Header logo: ${saved}`);
      }
    }

    if (darkIcon) {
      const publicPath = darkAssetPublicPath(
        base,
        "icon",
        darkIcon.format === "svg" ? "svg" : "png",
        isInBrands
      );
      const saved = await downloadDarkAsset(darkIcon, publicPath);
      if (saved) {
        headerIconPath = saved;
        console.log(`  Header icon: ${saved}`);
      }
    }

    if (headerLogoPath || headerIconPath) {
      updated[company] = {
        ...config,
        headerLogoPath: headerLogoPath ?? config.headerLogoPath,
        headerIconPath: headerIconPath ?? config.headerIconPath,
      };
      fetched++;
    } else {
      console.warn("  No dark-theme logo in Brandfetch response");
      skipped++;
    }

    await new Promise((r) => setTimeout(r, 250));
  }

  writeBrandConfigFile(updated, CONFIG_PATH);
  console.log(`\nUpdated ${CONFIG_PATH}`);
  console.log(`Dark header logos: ${fetched} fetched, ${skipped} skipped`);
}

main().catch(console.error);
