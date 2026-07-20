/**
 * Selection helpers that reduce a raw Brandfetch response down to the single
 * logo asset and the two brand colors this package's theming needs.
 *
 * @module brandfetch/pickLogo
 */

import type { BrandColor, BrandFormat, BrandLogo } from "./types.js";

/**
 * Pick the best downloadable logo asset from a list of Brandfetch logos.
 *
 * Preference order:
 * 1. A logo whose `type` and `theme` both match the requested values.
 * 2. A logo whose `type` matches (any theme).
 * 3. Any logo at all.
 *
 * Within the chosen logo, SVG is preferred (scalable), then PNG, then whatever
 * format is available first.
 *
 * @param logos - Logo variants from a {@link BrandResponse}.
 * @param preferredType - Desired logo type, e.g. `"logo"` or `"icon"`.
 * @param preferredTheme - Desired background theme, `"light"` or `"dark"`.
 * @returns The chosen {@link BrandFormat}, or `null` when `logos` is empty.
 */
export function pickBestLogo(
  logos: BrandLogo[],
  preferredType: string,
  preferredTheme: string
): BrandFormat | null {
  const themed = logos.filter(
    (logo) => logo.type === preferredType && logo.theme === preferredTheme
  );
  const typed =
    themed.length > 0
      ? themed
      : logos.filter((logo) => logo.type === preferredType);
  const candidates = typed.length > 0 ? typed : logos;

  const chosen = candidates[0];
  if (!chosen) return null;

  const svg = chosen.formats.find((format) => format.format === "svg");
  if (svg) return svg;

  const png = chosen.formats.find((format) => format.format === "png");
  if (png) return png;

  return chosen.formats[0] ?? null;
}

/**
 * The primary/secondary color pair extracted from a brand.
 */
export interface BrandColorPair {
  /** Main brand color (the accent, when Brandfetch identifies one). */
  primaryColor: string;
  /** Supporting color (typically the darkest available color). */
  secondaryColor: string;
}

/**
 * Derive a primary/secondary color pair from a Brandfetch color list.
 *
 * The `"accent"` color is used as primary when present, otherwise the first
 * color. The darkest color (lowest brightness) that differs from primary is
 * used as secondary, falling back to primary when only one color exists.
 *
 * @param colors - Colors from a {@link BrandResponse}.
 * @param fallback - Values returned when `colors` is empty. Defaults to a
 *   neutral dark pair.
 * @returns The resolved {@link BrandColorPair}.
 */
export function pickBrandColors(
  colors: BrandColor[],
  fallback: BrandColorPair = {
    primaryColor: "#171717",
    secondaryColor: "#363636",
  }
): BrandColorPair {
  if (colors.length === 0) return fallback;

  const accent = colors.find((color) => color.type === "accent");
  const primaryColor = (accent ?? colors[0])?.hex ?? fallback.primaryColor;

  const darkest = [...colors].sort((a, b) => a.brightness - b.brightness);
  const secondaryColor =
    darkest.find((color) => color.hex !== primaryColor)?.hex ?? primaryColor;

  return { primaryColor, secondaryColor };
}
