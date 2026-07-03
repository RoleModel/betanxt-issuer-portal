/**
 * Generates a MUI theme from a client's brand colors.
 *
 * This is the portable distillation of the pattern used in the source app:
 * take one to three brand colors, compute readable contrast text for each, and
 * produce light **and** dark color schemes with `primary`, `secondary`, and
 * `tertiary` set. It depends only on `@mui/material` — no private design
 * system — so it drops into any MUI v6/v7 project.
 *
 * @module theme/createClientTheme
 */

import type { PaletteMode, PaletteOptions, Theme, ThemeOptions } from "@mui/material/styles";

import { createTheme, darken, lighten } from "@mui/material/styles";

import type { BrandConfig } from "../brand/types.js";

import { getBrandConfigByTicker } from "../brand/registry.js";
import { contrastText } from "./contrast.js";
// Ensure the `tertiary` palette augmentation is part of this module graph.
import "./augmentation.js";

/**
 * A minimal set of brand colors. `secondaryColor` and `tertiaryColor` fall
 * back to `primaryColor` when omitted.
 */
export interface BrandColors {
  /** Primary brand color (hex or any MUI-parseable color). */
  primaryColor: string;
  /** Secondary brand color. Defaults to `primaryColor`. */
  secondaryColor?: string;
  /** Tertiary/accent brand color. Defaults to `secondaryColor` or `primaryColor`. */
  tertiaryColor?: string;
}

/**
 * Accepted forms of theme input:
 * - a {@link BrandColors} object,
 * - a {@link BrandConfig} (its primary/secondary colors are used),
 * - a ticker `string`, resolved against the package's brand registry.
 */
export type ClientThemeInput = BrandColors | BrandConfig | string;

/** Neutral fallback used when a ticker cannot be resolved. */
const FALLBACK_COLORS: Required<BrandColors> = {
  primaryColor: "#171717",
  secondaryColor: "#363636",
  tertiaryColor: "#5c5c5c",
};

/** Type guard: is this input a {@link BrandConfig}? */
function isBrandConfig(input: ClientThemeInput): input is BrandConfig {
  return typeof input === "object" && "companyName" in input && "domain" in input;
}

/**
 * Normalize any {@link ClientThemeInput} into a complete color triple.
 *
 * @param input - Colors, a brand config, or a ticker string.
 * @returns Resolved primary/secondary/tertiary colors (never partial).
 */
export function resolveBrandColors(input: ClientThemeInput): Required<BrandColors> {
  if (typeof input === "string") {
    const config = getBrandConfigByTicker(input);
    if (!config) return { ...FALLBACK_COLORS };
    return {
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      tertiaryColor: config.secondaryColor,
    };
  }

  if (isBrandConfig(input)) {
    return {
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      tertiaryColor: input.secondaryColor,
    };
  }

  return {
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor ?? input.primaryColor,
    tertiaryColor: input.tertiaryColor ?? input.secondaryColor ?? input.primaryColor,
  };
}

/**
 * Build a MUI {@link PaletteOptions} for one mode from resolved brand colors.
 * Contrast text is computed per color; the tertiary color gets `light`/`dark`
 * shades via MUI's `lighten`/`darken`.
 *
 * @param colors - Resolved brand colors.
 * @param mode - `"light"` or `"dark"`.
 * @returns Palette options for the requested mode.
 */
function buildClientPalette(colors: Required<BrandColors>, mode: PaletteMode): PaletteOptions {
  return {
    mode,
    primary: {
      main: colors.primaryColor,
      contrastText: contrastText(colors.primaryColor),
    },
    secondary: {
      main: colors.secondaryColor,
      contrastText: contrastText(colors.secondaryColor),
    },
    tertiary: {
      main: colors.tertiaryColor,
      light: lighten(colors.tertiaryColor, 0.2),
      dark: darken(colors.tertiaryColor, 0.2),
      contrastText: contrastText(colors.tertiaryColor),
    },
  };
}

/**
 * Build the client-specific {@link ThemeOptions} (light + dark color schemes,
 * CSS variables enabled) without creating a `Theme`. Useful when you want to
 * merge these options into your own base before calling `createTheme`.
 *
 * @param input - Colors, a brand config, or a ticker string.
 * @returns Theme options with `colorSchemes.light` and `colorSchemes.dark`.
 */
export function createClientThemeOptions(input: ClientThemeInput): ThemeOptions {
  const colors = resolveBrandColors(input);
  return {
    cssVariables: { colorSchemeSelector: "class" },
    colorSchemes: {
      light: { palette: buildClientPalette(colors, "light") },
      dark: { palette: buildClientPalette(colors, "dark") },
    },
  };
}

/**
 * Create a ready-to-use MUI {@link Theme} for a client.
 *
 * Any `baseOptions` you pass are deep-merged **first** (via `createTheme`'s
 * multi-argument merge), then the client brand palette is layered on top — so
 * bring your own typography, component overrides, breakpoints, etc.
 *
 * @param input - Colors, a brand config, or a ticker string (resolved against
 *   the package registry).
 * @param baseOptions - Optional base theme options to merge underneath.
 * @returns A created MUI `Theme`.
 *
 * @example
 * ```ts
 * // From explicit colors:
 * const theme = createClientTheme({ primaryColor: "#0078A3", secondaryColor: "#DAD55E" });
 *
 * // From a ticker in the registry:
 * const wendys = createClientTheme("WEN");
 *
 * // Merging your own base:
 * const branded = createClientTheme(brandConfig, { typography: { fontFamily: "Inter" } });
 * ```
 */
export function createClientTheme(input: ClientThemeInput, baseOptions?: ThemeOptions): Theme {
  const clientOptions = createClientThemeOptions(input);
  return baseOptions ? createTheme(baseOptions, clientOptions) : createTheme(clientOptions);
}
