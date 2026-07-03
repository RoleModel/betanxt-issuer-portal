/**
 * MUI theme generation from brand colors. Isomorphic; requires `@mui/material`.
 *
 * @module theme
 */

export { CONTRAST_THRESHOLD, contrastText } from "./contrast.js";
export type { BrandColors, ClientThemeInput } from "./createClientTheme.js";
export {
  resolveBrandColors,
  createClientThemeOptions,
  createClientTheme,
} from "./createClientTheme.js";
import "./augmentation.js";
