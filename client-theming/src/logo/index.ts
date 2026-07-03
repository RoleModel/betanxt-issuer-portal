/**
 * Browser-only logo utilities (path resolution + PNG rasterization).
 *
 * @module logo
 */

export type { LoadClientLogoOptions } from "./browser.js";
export {
  computeClientLogoBase,
  computeClientLogoSrc,
  loadImageAsPngDataUrl,
  loadClientLogoAsPngBase64,
} from "./browser.js";
