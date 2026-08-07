/**
 * Accessibility-preserving brand palette derivation for client themes.
 *
 * @module theme/brandPalette
 */

import { getContrastRatio, lighten } from "@mui/material/styles";

import { getMostLegibleText } from "./contrast.js";

/** Minimum WCAG contrast for non-text brand controls on the dark canvas. */
const MINIMUM_DARK_SURFACE_CONTRAST = 3;
/** WCAG AA contrast required for text placed on a brand-colored fill. */
const MINIMUM_BRAND_TEXT_CONTRAST = 4.5;
/** The default dark canvas used to validate branded accent colors. */
export const DARK_THEME_SURFACE_COLOR = "#0d0d0d";

/** Ordered from least to most visible so colors move only as much as needed. */
const LIGHTENING_STEPS = [
  0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64,
] as const;

/** Complete primary, secondary, and tertiary colors for a client brand. */
export interface BrandThemeColors {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly tertiaryColor: string;
}

/** MUI-compatible palette tokens for one resolved client brand role. */
export interface BrandPaletteColor {
  readonly contrastText: string;
  readonly dark: string;
  readonly light: string;
  readonly main: string;
}

/** The color scheme in which a client brand role is rendered. */
export type BrandColorScheme = "dark" | "light";

/**
 * Finds the nearest lighter variant that remains visible on the dark canvas.
 *
 * @param color - An approved client brand color in a MUI-parseable format.
 * @returns The original color when it qualifies, otherwise the first lighter
 * variant that satisfies non-text and label-text contrast.
 */
const ensureDarkSurfaceContrast = (color: string): string => {
  for (const amount of LIGHTENING_STEPS) {
    const candidate = amount === 0 ? color : lighten(color, amount);
    const contrastText = getMostLegibleText(candidate);

    if (
      getContrastRatio(candidate, DARK_THEME_SURFACE_COLOR) >=
        MINIMUM_DARK_SURFACE_CONTRAST &&
      getContrastRatio(candidate, contrastText) >= MINIMUM_BRAND_TEXT_CONTRAST
    ) {
      return candidate;
    }
  }

  return lighten(color, 0.64);
};

/**
 * Derives minimally adjusted dark-mode accents from approved brand colors.
 * Colors that already work on the dark canvas are preserved exactly.
 *
 * @param colors - Complete client brand colors.
 * @returns A readable dark-scheme color triple.
 */
export const createDarkThemeColors = (
  colors: BrandThemeColors
): BrandThemeColors => ({
  primaryColor: ensureDarkSurfaceContrast(colors.primaryColor),
  secondaryColor: ensureDarkSurfaceContrast(colors.secondaryColor),
  tertiaryColor: ensureDarkSurfaceContrast(colors.tertiaryColor),
});

/**
 * Builds MUI palette tokens for a resolved brand color.
 *
 * Native `color-mix()` keeps interaction-state variants in perceptually
 * uniform OKLCH, while `main` remains concrete for reliable contrast math.
 *
 * @param color - The resolved brand fill for the active scheme.
 * @param colorScheme - The scheme in which the role is rendered.
 * @returns Main, interaction-state, and text tokens for MUI components.
 */
export const createBrandPaletteColor = (
  color: string,
  colorScheme: BrandColorScheme
): BrandPaletteColor => ({
  main: color,
  light: `color-mix(in oklch, ${color} 82%, white 18%)`,
  dark:
    colorScheme === "dark"
      ? `color-mix(in oklch, ${color} 92%, white 8%)`
      : `color-mix(in oklch, ${color} 78%, black 22%)`,
  contrastText: getMostLegibleText(color),
});
