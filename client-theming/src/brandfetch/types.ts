/**
 * Type definitions for the subset of the Brandfetch Brand API responses that
 * this package consumes.
 *
 * @see https://docs.brandfetch.com/reference/brand-api
 * @module brandfetch/types
 */

/**
 * A single downloadable representation of a logo (one file, one format).
 */
export interface BrandFormat {
  /** Absolute URL to the asset (Brandfetch CDN). */
  src: string;
  /** File format, e.g. `"svg"`, `"png"`, `"webp"`. */
  format: string;
  /** Intrinsic width in pixels, when Brandfetch reports it. */
  width?: number;
  /** Intrinsic height in pixels, when Brandfetch reports it. */
  height?: number;
}

/**
 * A logo entry. Brandfetch returns several per brand (e.g. full logo vs.
 * icon-only "symbol", and light- vs. dark-background variants), each with one
 * or more downloadable {@link BrandFormat}s.
 */
export interface BrandLogo {
  /** Logo variant, typically `"logo"` (wordmark) or `"symbol"` / `"icon"`. */
  type: string;
  /** Background the asset is designed for: `"light"`, `"dark"`, or `""`. */
  theme: string;
  /** Available file formats for this logo, usually SVG and/or PNG. */
  formats: BrandFormat[];
}

/**
 * A brand color with Brandfetch's classification.
 */
export interface BrandColor {
  /** Hex color string, e.g. `"#0078A3"`. */
  hex: string;
  /** Role reported by Brandfetch: `"accent"`, `"dark"`, `"light"`, etc. */
  type: string;
  /** Perceived brightness (0–255); higher is lighter. */
  brightness: number;
}

/**
 * The trimmed Brandfetch Brand API payload used by this package. The live API
 * returns additional fields (fonts, links, description…) that are ignored here.
 */
export interface BrandResponse {
  /** Brand display name. */
  name: string;
  /** Primary domain the brand resolves to, e.g. `"wendys.com"`. */
  domain: string;
  /** All logo variants Brandfetch has on file. */
  logos: BrandLogo[];
  /** Brand color palette. */
  colors: BrandColor[];
}

/**
 * A single result from the Brandfetch Search API.
 *
 * @see https://docs.brandfetch.com/reference/search-brands
 */
export interface BrandSearchResult {
  /** Brand display name. */
  name: string;
  /** Domain that can be passed to {@link fetchBrand}. */
  domain: string;
  /** Icon URL for the result, when present. */
  icon?: string;
}
