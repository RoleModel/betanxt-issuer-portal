import { getContrastRatio, lighten } from "@mui/material/styles";

/** Minimum WCAG contrast for non-text brand controls on the dark canvas. */
const minimumDarkSurfaceContrast = 3;
/** WCAG AA contrast required for text placed on a brand-colored fill. */
const minimumBrandTextContrast = 4.5;
/** The portal's dark canvas used when validating branded accent colors. */
export const darkThemeSurfaceColor = "#0d0d0d";
const lighteningSteps = [
  0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64,
] as const;

/** The three accent colors a client theme needs to render its palette. */
export interface BrandThemeColors {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly tertiaryColor: string;
}

/** A MUI-compatible brand palette role with its paired label foreground. */
export interface BrandPaletteColor {
  readonly contrastText: string;
  readonly dark: string;
  readonly light: string;
  readonly main: string;
}

/** The color scheme for which a client palette role is being generated. */
export type BrandColorScheme = "dark" | "light";

/**
 * Chooses the more legible portal foreground for a solid fill.
 *
 * @param background - The resolved fill color behind the text.
 * @returns The darker or lighter text token with the higher contrast ratio.
 */
export const getMostLegibleText = (background: string): string =>
  getContrastRatio(background, "#fff") >= getContrastRatio(background, "#111")
    ? "#fff"
    : "#111";

/**
 * Finds a usable brand-color variant for the portal's dark canvas.
 *
 * @param color - The approved client brand color in a MUI-parseable format.
 * @returns The original color when it is already sufficiently visible, or the
 * nearest lighter variant that meets the 3:1 non-text requirement against the
 * dark canvas and WCAG AA contrast for its paired label text.
 *
 * @remarks
 * The resolved `main` value must be a concrete color because MUI needs it to
 * calculate a reliable foreground. Theme hover and pressed variants still use
 * native `color-mix()` in the consuming palette.
 */
const ensureDarkSurfaceContrast = (color: string): string => {
  for (const amount of lighteningSteps) {
    const candidate = amount === 0 ? color : lighten(color, amount);
    const contrastText = getMostLegibleText(candidate);

    if (
      getContrastRatio(candidate, darkThemeSurfaceColor) >=
        minimumDarkSurfaceContrast &&
      getContrastRatio(candidate, contrastText) >= minimumBrandTextContrast
    ) {
      return candidate;
    }
  }

  // The final step is intentionally near white, so every valid CSS color has
  // a visible fallback even when a client supplies pure black as its brand.
  return lighten(color, lighteningSteps.at(-1) ?? 0.64);
};

/**
 * Derives dark-mode accents from a client's approved light-mode branding.
 *
 * @param colors - The client primary, secondary, and tertiary brand colors.
 * @returns A dark-scheme palette whose fills are readable against the portal's
 * dark surface without changing already-accessible brand colors.
 */
export const createDarkThemeColors = (
  colors: BrandThemeColors
): BrandThemeColors => ({
  primaryColor: ensureDarkSurfaceContrast(colors.primaryColor),
  secondaryColor: ensureDarkSurfaceContrast(colors.secondaryColor),
  tertiaryColor: ensureDarkSurfaceContrast(colors.tertiaryColor),
});

/**
 * Builds one client palette role with native-color state variants.
 *
 * @param color - The resolved brand fill for this color scheme.
 * @param colorScheme - The scheme where the role will render.
 * @returns Main, hover, pressed, and foreground tokens for MUI components.
 *
 * @remarks
 * Dark-mode pressed states move slightly toward white rather than black. A
 * brand fill may have been lightened to clear the dark canvas, and a black mix
 * would undo that accessibility guarantee.
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
