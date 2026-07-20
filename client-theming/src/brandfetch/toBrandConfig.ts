/**
 * Maps a raw Brandfetch API response into this package's canonical
 * {@link BrandConfig}. This is the bridge between "live data from Brandfetch"
 * and "a stored brand record you can theme with".
 *
 * @module brandfetch/toBrandConfig
 */

import type { BrandConfig } from "../brand/types.js";
import type { BrandResponse } from "./types.js";

import { pickBestLogo, pickBrandColors } from "./pickLogo.js";

/**
 * Convert a company/brand name into a filesystem- and URL-safe slug.
 *
 * @param name - Arbitrary name, e.g. `"J.P. Morgan Real Estate Trust, Inc."`.
 * @returns A lowercase, hyphenated slug, e.g. `"j-p-morgan-real-estate-trust-inc"`.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Options controlling how a {@link BrandResponse} becomes a {@link BrandConfig}.
 */
export interface ToBrandConfigOptions {
  /** Ticker to attach to the resulting config. */
  ticker?: string;
  /** Display name override. Defaults to the Brandfetch brand name. */
  companyName?: string;
  /**
   * Base public directory for asset paths. The generated paths follow the
   * pattern `{assetBaseDir}/{slug}_logo.{ext}`. Defaults to `/logos/brands`.
   */
  assetBaseDir?: string;
}

/**
 * Build a {@link BrandConfig} from a Brandfetch response.
 *
 * Colors are derived via {@link pickBrandColors}. Asset paths are generated
 * deterministically from a slug of the brand name and the chosen logo formats
 * (so they line up with files you download from the picked logo `src` URLs).
 * This function does **not** download anything — see the README for the
 * fetch-and-save workflow.
 *
 * @param brand - A response from {@link fetchBrand}.
 * @param options - Ticker, name, and asset-directory overrides.
 * @returns A fully-populated {@link BrandConfig}.
 */
export function brandResponseToBrandConfig(
  brand: BrandResponse,
  options: ToBrandConfigOptions = {}
): BrandConfig {
  const companyName = options.companyName ?? brand.name;
  const assetBaseDir = options.assetBaseDir ?? "/logos/brands";
  const slug = slugify(companyName);

  const { primaryColor, secondaryColor } = pickBrandColors(brand.colors);

  const lightLogo = pickBestLogo(brand.logos, "logo", "light");
  const lightIcon = pickBestLogo(brand.logos, "icon", "light");
  const darkLogo = pickBestLogo(brand.logos, "logo", "dark");
  const darkIcon = pickBestLogo(brand.logos, "icon", "dark");

  const ext = (format: string): string => (format === "svg" ? "svg" : "png");

  return {
    companyName,
    ticker: options.ticker,
    domain: brand.domain,
    logoPath: lightLogo
      ? `${assetBaseDir}/${slug}_logo.${ext(lightLogo.format)}`
      : "",
    iconPath: lightIcon
      ? `${assetBaseDir}/${slug}_icon.${ext(lightIcon.format)}`
      : "",
    headerLogoPath: darkLogo
      ? `${assetBaseDir}/${slug}_logo-dark.${ext(darkLogo.format)}`
      : undefined,
    headerIconPath: darkIcon
      ? `${assetBaseDir}/${slug}_icon-dark.${ext(darkIcon.format)}`
      : undefined,
    primaryColor,
    secondaryColor,
  };
}
