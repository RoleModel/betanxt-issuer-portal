/**
 * client-theming — a portable, drop-in module for per-client branding: fetch
 * brand data from Brandfetch, store it as {@link BrandConfig}s, and generate
 * contrast-aware MUI light/dark themes from brand colors.
 *
 * Import from the barrel for convenience, or from submodules to keep
 * environment-specific code isolated:
 * - `client-theming/brandfetch` — server-side (needs `BRANDFETCH_API_KEY`).
 * - `client-theming/logo` — browser-only (uses `canvas`/`document`).
 * - `client-theming/theme` — isomorphic (needs `@mui/material`).
 *
 * @packageDocumentation
 */

// --- Brand records + registry -------------------------------------------------
export type { BrandConfig } from "./brand/types.js";
export {
  brandConfigs,
  brandConfigsByTicker,
  getBrandConfig,
  getBrandConfigByTicker,
  getBrandLogoPath,
  getBrandIconPath,
} from "./brand/registry.js";

// --- Brandfetch API client ----------------------------------------------------
export type {
  BrandFormat,
  BrandLogo,
  BrandColor,
  BrandResponse,
  BrandSearchResult,
} from "./brandfetch/types.js";
export type { BrandfetchRequestOptions } from "./brandfetch/client.js";
export {
  getBrandfetchApiKey,
  fetchBrand,
  searchBrands,
  fetchBrandByName,
} from "./brandfetch/client.js";
export type { BrandColorPair } from "./brandfetch/pickLogo.js";
export { pickBestLogo, pickBrandColors } from "./brandfetch/pickLogo.js";
export type { ToBrandConfigOptions } from "./brandfetch/toBrandConfig.js";
export {
  slugify,
  brandResponseToBrandConfig,
} from "./brandfetch/toBrandConfig.js";

// --- Theme generation ---------------------------------------------------------
export {
  DARK_THEME_SURFACE_COLOR,
  createBrandPaletteColor,
  createDarkThemeColors,
} from "./theme/brandPalette.js";
export type {
  BrandColorScheme,
  BrandPaletteColor,
  BrandThemeColors,
} from "./theme/brandPalette.js";
export {
  CONTRAST_THRESHOLD,
  contrastText,
  getMostLegibleText,
} from "./theme/contrast.js";
export type {
  ClientChartColor,
  ClientChartPalette,
} from "./theme/chartPalette.js";
export { createClientChartPalette } from "./theme/chartPalette.js";
export type {
  BrandColors,
  ClientThemeInput,
} from "./theme/createClientTheme.js";
export {
  resolveBrandColors,
  createClientThemeOptions,
  createClientTheme,
} from "./theme/createClientTheme.js";

// --- Browser logo utilities ---------------------------------------------------
export type { LoadClientLogoOptions } from "./logo/browser.js";
export {
  computeClientLogoBase,
  computeClientLogoSrc,
  loadImageAsPngDataUrl,
  loadClientLogoAsPngBase64,
} from "./logo/browser.js";
