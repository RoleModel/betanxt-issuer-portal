/**
 * Contrast utilities for choosing readable text colors on top of arbitrary
 * brand colors. Wraps MUI's `getContrastRatio` with the WCAG-ish 4.5:1
 * threshold used across the theme.
 *
 * @module theme/contrast
 */

import { getContrastRatio } from "@mui/material/styles";

/** Minimum contrast ratio (WCAG AA for normal text) used for text decisions. */
export const CONTRAST_THRESHOLD = 4.5;

/**
 * Chooses the more legible of two foreground candidates for a fill.
 *
 * @param background - The fill behind the label.
 * @param light - The light foreground candidate. Defaults to `"#fff"`.
 * @param dark - The dark foreground candidate. Defaults to `"#111"`.
 * @returns The candidate with the higher contrast ratio.
 */
export function getMostLegibleText(
  background: string,
  light = "#fff",
  dark = "#111"
): string {
  return getContrastRatio(background, light) >=
    getContrastRatio(background, dark)
    ? light
    : dark;
}

/**
 * Choose a readable text color to place on top of `background`.
 *
 * Returns `light` when white text clears the {@link CONTRAST_THRESHOLD} against
 * the background, otherwise `dark`.
 *
 * @param background - The background color (any CSS color MUI can parse).
 * @param light - Color to use on dark backgrounds. Defaults to `"#fff"`.
 * @param dark - Color to use on light backgrounds. Defaults to `"#111"`.
 * @returns Either `light` or `dark`.
 *
 * @example
 * ```ts
 * contrastText("#0078A3"); // "#fff"
 * contrastText("#DAD55E"); // "#111"
 * ```
 */
export function contrastText(
  background: string,
  light = "#fff",
  dark = "#111"
): string {
  const mostLegibleText = getMostLegibleText(background, light, dark);
  return getContrastRatio(background, mostLegibleText) >= CONTRAST_THRESHOLD
    ? mostLegibleText
    : dark;
}
