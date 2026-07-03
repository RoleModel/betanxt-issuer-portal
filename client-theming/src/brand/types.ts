/**
 * The canonical brand record used throughout this package. A `BrandConfig`
 * captures everything the theming and logo layers need for one client: its
 * identity, colors, and the resolved paths to its logo assets.
 *
 * @module brand/types
 */

/**
 * Per-client branding configuration.
 *
 * `logoPath` / `iconPath` point at assets intended for light backgrounds;
 * `headerLogoPath` / `headerIconPath` are the dark-background variants (light
 * artwork) used on brand-colored headers. Paths are whatever your app serves —
 * typically public URLs like `/logos/brands/acme_logo.svg`.
 */
export interface BrandConfig {
  /** Human-readable company name (also the registry key). */
  companyName: string;
  /** Stock ticker, when known — the most reliable lookup key. */
  ticker?: string;
  /** Primary domain, used to (re)fetch brand data from Brandfetch. */
  domain: string;
  /** Path/URL to the full logo for light backgrounds. */
  logoPath: string;
  /** Path/URL to the icon/symbol for light backgrounds. */
  iconPath: string;
  /** Path/URL to the full logo for dark/colored backgrounds. */
  headerLogoPath?: string;
  /** Path/URL to the icon/symbol for dark/colored backgrounds. */
  headerIconPath?: string;
  /** Primary brand color (hex), used as the theme's `primary.main`. */
  primaryColor: string;
  /** Secondary brand color (hex), used as the theme's `secondary.main`. */
  secondaryColor: string;
}
