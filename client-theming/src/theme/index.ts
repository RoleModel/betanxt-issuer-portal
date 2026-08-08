/**
 * MUI theme generation from brand colors. Isomorphic; requires `@mui/material`.
 *
 * @module theme
 */

export {
  DARK_THEME_SURFACE_COLOR,
  createBrandPaletteColor,
  createDarkThemeColors,
} from "./brandPalette.js";
export type {
  BrandColorScheme,
  BrandPaletteColor,
  BrandThemeColors,
} from "./brandPalette.js";
export {
  CONTRAST_THRESHOLD,
  contrastText,
  getMostLegibleText,
} from "./contrast.js";
export type { ClientChartColor, ClientChartPalette } from "./chartPalette.js";
export { createClientChartPalette } from "./chartPalette.js";
export type { BrandColors, ClientThemeInput } from "./createClientTheme.js";
export {
  resolveBrandColors,
  createClientThemeOptions,
  createClientTheme,
} from "./createClientTheme.js";
import "./augmentation.js";
