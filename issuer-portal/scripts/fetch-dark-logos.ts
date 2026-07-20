/**
 * Fetch dark-theme logos from Brandfetch for PDF headers on primary-colored backgrounds.
 *
 * Usage: npx tsx scripts/fetch-dark-logos.ts
 * Requires BRANDFETCH_API_KEY in issuer-portal/.env
 */
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { type BrandConfig, brandConfigs } from "../utils/brandConfig";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.resolve(__dirname, "../utils/brandConfig.ts");
const PUBLIC_LOGOS = path.resolve(__dirname, "../public/logos");

async function downloadDarkAsset(
  format: { src: string; format: string } | null,
  publicPath: string
): Promise<string | null> {
  if (!format) return null;
  const rel = publicPath.replace(/^\//, "");
  const destPath = path.join(PUBLIC_LOGOS, rel.replace(/^logos\//, ""));
  const ok = await downloadFile(format.src, destPath);
  return ok ? publicPath : null;
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
  for (let i = 0; i < entries.length; i++) {
    const [company, cfg] = entries[i];
    console.log(`[${i + 1}/${entries.length}] ${company}`);

    if (!cfg.domain) {
      console.warn("  No domain — skipping");
      skipped++;
      continue;
    }

    const brand = await fetchBrand(cfg.domain, BRANDFETCH_API_KEY);
    if (!brand?.logos?.length) {
      console.warn(`  No brand data for ${cfg.domain}`);
      skipped++;
      continue;
    }

    const base = inferAssetBase(
      cfg.logoPath,
      cfg.iconPath,
      cfg.ticker,
      company
    );
    const inBrands = usesBrandsFolder(cfg.logoPath, cfg.iconPath);

    const darkFull =
      pickBestLogo(brand.logos, "logo", "dark") ??
      pickBestLogo(brand.logos, "symbol", "dark");
    const darkIcon =
      pickBestLogo(brand.logos, "icon", "dark") ??
      pickBestLogo(brand.logos, "symbol", "dark");

    let headerLogoPath = cfg.headerLogoPath;
    let headerIconPath = cfg.headerIconPath;

    if (darkFull) {
      const publicPath = darkAssetPublicPath(
        base,
        "logo",
        darkFull.format === "svg" ? "svg" : "png",
        inBrands
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
        inBrands
      );
      const saved = await downloadDarkAsset(darkIcon, publicPath);
      if (saved) {
        headerIconPath = saved;
        console.log(`  Header icon: ${saved}`);
      }
    }

    if (headerLogoPath || headerIconPath) {
      updated[company] = {
        ...cfg,
        headerLogoPath: headerLogoPath ?? cfg.headerLogoPath,
        headerIconPath: headerIconPath ?? cfg.headerIconPath,
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
