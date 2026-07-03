/**
 * MUI module augmentation that adds a `tertiary` palette color, so
 * `theme.palette.tertiary` and `<Button color="tertiary" />` type-check.
 *
 * Importing anything from this package's theme entry point pulls this in. If
 * your bundler tree-shakes it away, add `import "@your-scope/client-theming";`
 * (or a direct import of this file) once in your app's setup.
 *
 * @module theme/augmentation
 */

import type { PaletteColor, PaletteColorOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    /** Optional third brand color, derived alongside primary/secondary. */
    tertiary: PaletteColor;
  }
  interface PaletteOptions {
    /** Optional third brand color, derived alongside primary/secondary. */
    tertiary?: PaletteColorOptions;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    /** Allow `<Button color="tertiary" />`. */
    tertiary: true;
  }
}

// This file only contributes ambient types; the empty export keeps it a module.
export {};
