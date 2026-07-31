import * as fs from "node:fs";
import * as path from "node:path";
import { config } from "dotenv";

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

config({ path: path.resolve(__dirname, "../.env") });

export const { BRANDFETCH_API_KEY } = process.env;

export const LOGOS_DIR = path.resolve(__dirname, "../public/logos/brands");

export interface BrandFormat {
  src: string;
  format: string;
  width?: number;
  height?: number;
}

export interface BrandLogo {
  type: string;
  theme: string;
  formats: BrandFormat[];
}

export interface BrandColor {
  hex: string;
  type: string;
  brightness: number;
}

export interface BrandResponse {
  name: string;
  domain: string;
  logos: BrandLogo[];
  colors: BrandColor[];
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

export async function fetchBrand(
  domain: string,
  apiKey: string
): Promise<BrandResponse | null> {
  try {
    const response = await fetch(
      `https://api.brandfetch.io/v2/brands/${domain}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as BrandResponse;
  } catch {
    return null;
  }
}

export function pickBestLogo(
  logos: BrandLogo[],
  preferredType: string,
  preferredTheme: string
): BrandFormat | null {
  const themed = logos.filter(
    (l) => l.type === preferredType && l.theme === preferredTheme
  );
  const typed =
    themed.length > 0 ? themed : logos.filter((l) => l.type === preferredType);
  const candidates = typed.length > 0 ? typed : logos;

  if (candidates.length === 0) {
    return null;
  }

  const logo = candidates[0];
  const svg = logo.formats.find((f) => f.format === "svg");
  if (svg) {
    return svg;
  }
  const png = logo.formats.find((f) => f.format === "png");
  if (png) {
    return png;
  }
  return logo.formats[0] ?? null;
}

export async function downloadFile(
  url: string,
  destinationPath: string
): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return false;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.writeFileSync(destinationPath, buffer);
    return true;
  } catch {
    return false;
  }
}

/** File base name for brand assets (e.g. `donnelley-financial-solutions-inc` or `WEN`). */
export function inferAssetBase(
  logoPath: string,
  iconPath: string,
  ticker?: string,
  companyKey?: string
): string {
  const assetPath = logoPath || iconPath;
  if (assetPath) {
    const rel = assetPath.replace(/^.*\/logos\//, "");
    const filename = rel.includes("/") ? (rel.split("/").pop() ?? rel) : rel;
    const noExtension = filename.replace(/\.[^.]+$/, "");
    const stripped = noExtension.replace(
      /_(logo-full|logo|icon)(-dark)?$/i,
      ""
    );
    if (stripped) {
      return stripped;
    }
  }
  if (ticker) {
    return ticker.toLowerCase();
  }
  return slugify(companyKey ?? "brand");
}

export function usesBrandsFolder(logoPath: string, iconPath: string): boolean {
  return logoPath.includes("/brands/") || iconPath.includes("/brands/");
}

export function darkAssetPublicPath(
  base: string,
  kind: "logo" | "icon",
  extension: string,
  inBrandsFolder: boolean
): string {
  const filename = `${base}_${kind}-dark.${extension}`;
  return inBrandsFolder ? `/logos/brands/${filename}` : `/logos/${filename}`;
}
