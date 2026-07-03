/**
 * Brand records and registry lookups.
 *
 * @module brand
 */

export type { BrandConfig } from "./types.js";
export {
  brandConfigs,
  brandConfigsByTicker,
  getBrandConfig,
  getBrandConfigByTicker,
  getBrandLogoPath,
  getBrandIconPath,
} from "./registry.js";
