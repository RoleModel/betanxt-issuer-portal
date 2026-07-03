/**
 * Server-side Brandfetch integration: API client, response types, logo/color
 * selection, and mapping to {@link BrandConfig}. Requires `BRANDFETCH_API_KEY`.
 *
 * @module brandfetch
 */

export type {
  BrandFormat,
  BrandLogo,
  BrandColor,
  BrandResponse,
  BrandSearchResult,
} from "./types.js";
export type { BrandfetchRequestOptions } from "./client.js";
export { getBrandfetchApiKey, fetchBrand, searchBrands, fetchBrandByName } from "./client.js";
export type { BrandColorPair } from "./pickLogo.js";
export { pickBestLogo, pickBrandColors } from "./pickLogo.js";
export type { ToBrandConfigOptions } from "./toBrandConfig.js";
export { slugify, brandResponseToBrandConfig } from "./toBrandConfig.js";
