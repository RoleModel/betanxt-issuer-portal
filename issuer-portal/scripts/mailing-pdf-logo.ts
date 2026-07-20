import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

import type { BrandConfig } from "../utils/brandConfig";

export interface RasterizedLogo {
  dataUri: string;
  aspect: number;
}

function publicFile(relPath: string): string {
  return path.join(process.cwd(), "public", relPath.replace(/^\//, ""));
}

async function rasterizeLogoFile(
  filePath: string
): Promise<RasterizedLogo | null> {
  if (!fs.existsSync(filePath)) return null;

  try {
    const meta = await sharp(filePath).metadata();
    const pngBuf = await sharp(filePath).png().toBuffer();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!width || !height) return null;

    return {
      dataUri: `data:image/png;base64,${pngBuf.toString("base64")}`,
      aspect: width / height,
    };
  } catch {
    return null;
  }
}

function pushCandidate(candidates: string[], seen: Set<string>, rel?: string) {
  if (!rel || seen.has(rel)) return;
  seen.add(rel);
  candidates.push(rel);
}

function collectLightCandidates(cfg: BrandConfig): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  pushCandidate(candidates, seen, cfg.iconPath);
  pushCandidate(candidates, seen, cfg.logoPath);

  if (cfg.ticker) {
    const ticker = cfg.ticker.toUpperCase();
    pushCandidate(candidates, seen, `/logos/${ticker}_icon.png`);
    pushCandidate(candidates, seen, `/logos/${ticker}_logo.png`);
    pushCandidate(candidates, seen, `/logos/${ticker}_logo.svg`);
    pushCandidate(candidates, seen, `/logos/${ticker}_logo-full.svg`);
  }

  return candidates;
}

function collectHeaderCandidates(cfg: BrandConfig): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  pushCandidate(candidates, seen, cfg.headerIconPath);
  pushCandidate(candidates, seen, cfg.headerLogoPath);

  if (cfg.ticker) {
    const ticker = cfg.ticker.toUpperCase();
    pushCandidate(candidates, seen, `/logos/${ticker}_icon-dark.svg`);
    pushCandidate(candidates, seen, `/logos/${ticker}_icon-dark.png`);
    pushCandidate(candidates, seen, `/logos/${ticker}_logo-dark.svg`);
    pushCandidate(candidates, seen, `/logos/${ticker}_logo-dark.png`);
  }

  return candidates;
}

/** Logos for light/white backgrounds (default Brandfetch light-theme assets). */
export async function loadLogoForBrand(
  cfg: BrandConfig
): Promise<RasterizedLogo | null> {
  for (const rel of collectLightCandidates(cfg)) {
    const loaded = await rasterizeLogoFile(publicFile(rel));
    if (loaded) return loaded;
  }
  return null;
}

/** Light logos for dark/primary-colored PDF headers (Brandfetch dark-theme assets). */
export async function loadHeaderLogoForBrand(
  cfg: BrandConfig
): Promise<RasterizedLogo | null> {
  for (const rel of collectHeaderCandidates(cfg)) {
    const loaded = await rasterizeLogoFile(publicFile(rel));
    if (loaded) return loaded;
  }
  return null;
}
