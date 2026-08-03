"use client";

import {
  createBrandPaletteColor,
  createDarkThemeColors,
  darkThemeSurfaceColor,
} from "@/utils/brand-theme-colors";
import { clientBranding } from "@/utils/client-branding";
import { generateChartPalette } from "@/utils/vote-chart-colors";

/**
 * Explains — and re-runs — the pipeline that turns a ticker into a theme.
 *
 * @remarks
 * Every derived value below is produced by calling the same functions the real
 * theme calls, so this panel cannot drift from the app: change
 * `createBrandPaletteColor` and the swatches change with it. The prose is the
 * only thing written by hand, and it describes decisions rather than values.
 */

export interface PipelineStep {
  readonly detail: string;
  /** Repo-relative file the step lives in. */
  readonly file: string;
  readonly title: string;
}

export const themePipeline: readonly PipelineStep[] = [
  {
    detail:
      "The URL's ticker segment wins on client pages; otherwise the signed-in user's org brand (DFIN for parent clients, MRSO for solicitors) applies. Built themes are cached per ticker so a re-render never rebuilds one.",
    file: "components/mui-styling/ThemeRegistry.tsx",
    title: "1 · Pick the ticker",
  },
  {
    detail:
      "Looks the ticker up in the approved branding table, falls back to brandConfig (secondary doubles as tertiary), and finally to the first entry. The result is exactly three colors — primary, secondary, tertiary — and nothing else about a client feeds the palette.",
    file: "utils/client-branding.ts",
    title: "2 · Resolve the three brand colors",
  },
  {
    detail:
      "Each brand color becomes a MUI palette role: main as given, light and dark as native color-mix() expressions so hover and pressed states stay live against the theme, and contrastText chosen by measuring contrast against #fff and #111 rather than assuming.",
    file: "utils/brand-theme-colors.ts",
    title: "3 · Build the light palette roles",
  },
  {
    detail: `Brand colors are approved for a white page, not a dark one. Each is lightened in fixed steps until it clears 3:1 against the ${darkThemeSurfaceColor} canvas and 4.5:1 against its own label color; a color that already passes is left alone. Only then are the palette roles built again for dark.`,
    file: "utils/brand-theme-colors.ts",
    title: "4 · Derive dark-mode accents",
  },
  {
    detail:
      "Nine chart roles in a fixed order. Registered and Beneficial take the brand colors directly. Web, Print and IVR rotate the primary hue by fixed offsets in oklch, so they stay related to the brand but never collide with the holder colors. For / Against / Abstain / Withhold are deliberately fixed — an expressive brand must not make vote results harder to tell apart.",
    file: "utils/vote-chart-colors.ts",
    title: "5 · Generate the vote-chart palette",
  },
  {
    detail:
      "The client roles are deep-merged over the design-system base (its palette, components, typography, shadows and layout), then MUI emits the whole thing as --mui-palette-* CSS variables with a class-based color-scheme selector. App code reads the variables; it never reads a resolved color.",
    file: "components/mui-styling/theme.ts",
    title: "6 · Merge over the base theme and emit CSS variables",
  },
];

export interface DerivedRole {
  readonly label: string;
  /** The expression as authored — often color-mix() or oklch(). */
  readonly value: string;
}

export interface ClientPalette {
  readonly chartRoles: readonly DerivedRole[];
  readonly darkSeeds: readonly DerivedRole[];
  readonly primaryRole: readonly DerivedRole[];
  readonly seeds: readonly DerivedRole[];
  readonly ticker: string;
}

const chartRoleNames = [
  "registered",
  "beneficial",
  "web",
  "print",
  "ivr",
  "for",
  "against",
  "abstain",
  "withhold",
] as const;

/**
 * Re-runs the whole derivation for one client.
 *
 * @param ticker - Client ticker as it appears in the branding table.
 * @returns Every intermediate value the pipeline produces, in pipeline order.
 */
export const buildClientPalette = (ticker: string): ClientPalette | null => {
  const branding = clientBranding.find((entry) => entry.ticker === ticker);

  if (branding === undefined) {
    return null;
  }

  const dark = createDarkThemeColors(branding);
  const primary = createBrandPaletteColor(branding.primaryColor, "light");
  const chart = generateChartPalette(
    branding.primaryColor,
    branding.secondaryColor,
    "light"
  );

  return {
    chartRoles: chartRoleNames.map((role, index) => ({
      label: role,
      value: chart[index] ?? "",
    })),
    darkSeeds: [
      { label: "primary", value: dark.primaryColor },
      { label: "secondary", value: dark.secondaryColor },
      { label: "tertiary", value: dark.tertiaryColor },
    ],
    primaryRole: [
      { label: "main", value: primary.main },
      { label: "light", value: primary.light },
      { label: "dark", value: primary.dark },
      { label: "contrastText", value: primary.contrastText },
    ],
    seeds: [
      { label: "primary", value: branding.primaryColor },
      { label: "secondary", value: branding.secondaryColor },
      { label: "tertiary", value: branding.tertiaryColor },
    ],
    ticker: branding.ticker,
  };
};

export const brandedTickers: readonly string[] = clientBranding.map(
  (entry) => entry.ticker
);

/** Whether a brand color needed lightening to survive the dark canvas. */
export const wasLightenedForDark = (
  original: string,
  derived: string
): boolean => original.toLowerCase() !== derived.toLowerCase();

export { darkThemeSurfaceColor } from "@/utils/brand-theme-colors";
