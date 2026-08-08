/**
 * A restrained palette for categorical charts.
 *
 * Brand colors establish identity for ownership and voting-source series.
 * Outcome colors intentionally remain semantic so a brand accent cannot make
 * an "Against" result look like a "For" result, or vice versa.
 *
 * @module theme/chartPalette
 */

import { createDarkThemeColors } from "./brandPalette.js";
import { getMostLegibleText } from "./contrast.js";
import type { BrandColors } from "./createClientTheme.js";

/** A chart fill paired with the accessible label color for that exact fill. */
export interface ClientChartColor {
  readonly contrastText: string;
  readonly main: string;
}

/**
 * The fixed semantic roles shared by every client-facing voting chart.
 *
 * Registered and Beneficial map to DTC and Non-DTC respectively. Source roles
 * are derived from brand colors; outcome roles remain stable semantic colors.
 */
export interface ClientChartPalette {
  readonly registered: ClientChartColor;
  readonly beneficial: ClientChartColor;
  readonly web: ClientChartColor;
  readonly print: ClientChartColor;
  readonly ivr: ClientChartColor;
  readonly for: ClientChartColor;
  readonly against: ClientChartColor;
  readonly abstain: ClientChartColor;
  readonly withhold: ClientChartColor;
}

type ChartBrandColors = Pick<BrandColors, "primaryColor" | "secondaryColor">;
type ChartColorScheme = "dark" | "light";

/** Creates a chart fill with its corresponding foreground color. */
const chartColor = (main: string, contrastText: string): ClientChartColor => ({
  main,
  contrastText,
});

/**
 * Generate chart colors from the two approved brand colors.
 *
 * In dark mode, client accents receive only the smallest lift required to be
 * visible on the dark canvas. Derived source colors use native OKLCH mixes so
 * they retain a coherent relationship to the approved brand colors.
 *
 * @param colors - Approved primary and secondary client brand colors.
 * @param colorScheme - The scheme where the chart is rendered.
 * @returns Named voting-chart roles with paired label foregrounds.
 */
export const createClientChartPalette = (
  { primaryColor, secondaryColor = primaryColor }: ChartBrandColors,
  colorScheme: ChartColorScheme = "light"
): ClientChartPalette => {
  const brandColors =
    colorScheme === "dark"
      ? createDarkThemeColors({
          primaryColor,
          secondaryColor,
          tertiaryColor: secondaryColor,
        })
      : { primaryColor, secondaryColor };
  const { primaryColor: resolvedPrimary, secondaryColor: resolvedSecondary } =
    brandColors;

  return {
    registered: chartColor(
      resolvedPrimary,
      getMostLegibleText(resolvedPrimary)
    ),
    beneficial: chartColor(
      resolvedSecondary,
      getMostLegibleText(resolvedSecondary)
    ),
    web:
      colorScheme === "dark"
        ? chartColor(
            `color-mix(in oklch, ${resolvedSecondary} 76%, white 24%)`,
            "#111"
          )
        : chartColor(
            `color-mix(in oklch, ${resolvedSecondary} 82%, ${resolvedPrimary} 18%)`,
            getMostLegibleText(resolvedSecondary)
          ),
    print:
      colorScheme === "dark"
        ? chartColor(
            `color-mix(in oklch, ${resolvedPrimary} 68%, white 32%)`,
            "#111"
          )
        : chartColor(
            `color-mix(in oklch, ${resolvedSecondary} 72%, white 28%)`,
            "#111"
          ),
    ivr:
      colorScheme === "dark"
        ? chartColor(
            `color-mix(in oklch, ${resolvedSecondary} 60%, ${resolvedPrimary} 20%, white 20%)`,
            "#111"
          )
        : chartColor(
            `color-mix(in oklch, ${resolvedSecondary} 72%, black 28%)`,
            "#fff"
          ),
    for: chartColor("oklch(57% 0.15 175)", "#111"),
    against: chartColor("oklch(56% 0.2 28)", "#fff"),
    abstain: chartColor("oklch(78% 0.16 85)", "#111"),
    withhold: chartColor("oklch(48% 0.11 250)", "#fff"),
  };
};
