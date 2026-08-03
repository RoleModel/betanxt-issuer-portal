import { getContrastRatio } from "@mui/material/styles";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { brandConfigs } from "@/utils/brandConfig";
import {
  createBrandPaletteColor,
  createDarkThemeColors,
  darkThemeSurfaceColor,
  getMostLegibleText,
} from "@/utils/brand-theme-colors";
import { clientBranding } from "@/utils/client-branding";
import { generateChartPalette } from "@/utils/vote-chart-colors";

const minimumControlFillContrast = 3;
const minimumControlTextContrast = 4.5;
const minimumChartFillContrast = 3;
const minimumSourceTextContrast = 4.5;
const colorVariants = ["main", "light", "dark"] as const;
const configuredBrands = [
  ...Object.values(brandConfigs).map((brand) => ({
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    tertiaryColor: brand.secondaryColor,
    ticker: brand.ticker ?? brand.companyName,
  })),
  ...clientBranding,
];

interface SourceChartFill {
  readonly color: string;
  readonly contrastText: string;
  readonly id: string;
  readonly surfaceColor: string;
}

/** Resolves CSS `color-mix()` values through the browser before contrast checks. */
const resolveChartFillColors = async (
  page: Page,
  fills: readonly { readonly color: string; readonly id: string }[]
): Promise<
  readonly {
    readonly color: string;
    readonly id: string;
    readonly isSupported: boolean;
  }[]
> =>
  await page.evaluate((entries) => {
    const canvas = document.createElement("canvas");
    canvas.height = 1;
    canvas.width = 1;
    const context = canvas.getContext("2d");

    if (context === null) {
      throw new Error("Canvas 2D context unavailable");
    }

    return entries.map((entry) => {
      const isSupported = CSS.supports("color", entry.color);

      if (!isSupported) {
        return {
          color: "",
          id: entry.id,
          isSupported,
        };
      }

      context.clearRect(0, 0, 1, 1);
      context.fillStyle = entry.color;
      context.fillRect(0, 0, 1, 1);
      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

      return {
        color: `rgb(${red}, ${green}, ${blue})`,
        id: entry.id,
        isSupported,
      };
    });
  }, fills);

test("derives accessible dark controls and chart fills for every client", async ({
  page,
}) => {
  for (const brand of configuredBrands) {
    const darkBrand = createDarkThemeColors(brand);

    for (const [role, color] of Object.entries(darkBrand)) {
      expect(
        getContrastRatio(color, darkThemeSurfaceColor),
        `${brand.ticker} ${role} must be visible on the dark canvas`
      ).toBeGreaterThanOrEqual(minimumControlFillContrast);
      expect(
        getContrastRatio(color, getMostLegibleText(color)),
        `${brand.ticker} ${role} must retain readable text`
      ).toBeGreaterThanOrEqual(minimumControlTextContrast);
    }
  }

  const chartFills = configuredBrands.flatMap((brand) => {
    const darkBrand = createDarkThemeColors(brand);

    return generateChartPalette(
      darkBrand.primaryColor,
      darkBrand.secondaryColor,
      "dark"
    )
      .slice(0, 5)
      .map((color, index) => ({ color, id: `${brand.ticker}-${index}` }));
  });
  const darkControlFills = configuredBrands.flatMap((brand) => {
    const darkBrand = createDarkThemeColors(brand);

    return Object.entries(darkBrand).flatMap(([role, color]) => {
      const paletteColor = createBrandPaletteColor(color, "dark");

      return colorVariants.map((variant) => ({
        color: paletteColor[variant],
        id: `${brand.ticker}-${role}-${variant}`,
      }));
    });
  });
  const resolvedFills = await resolveChartFillColors(page, [
    ...chartFills,
    ...darkControlFills,
  ]);

  for (const fill of resolvedFills) {
    expect(fill.isSupported, `${fill.id} must be a valid CSS color`).toBe(true);
    expect(
      getContrastRatio(fill.color, darkThemeSurfaceColor),
      `${fill.id} must be visible on the dark canvas`
    ).toBeGreaterThanOrEqual(minimumChartFillContrast);
  }

  const sourceChartFills = configuredBrands.flatMap<SourceChartFill>(
    (brand) => {
      const darkBrand = createDarkThemeColors(brand);

      return [
        ...generateChartPalette(
          brand.primaryColor,
          brand.secondaryColor,
          "light"
        )
          .slice(2, 5)
          .map((color, index) => ({
            color,
            contrastText: "#fff",
            id: `${brand.ticker}-light-source-${index}`,
            surfaceColor: "#fff",
          })),
        ...generateChartPalette(
          darkBrand.primaryColor,
          darkBrand.secondaryColor,
          "dark"
        )
          .slice(2, 5)
          .map((color, index) => ({
            color,
            contrastText: "#111",
            id: `${brand.ticker}-dark-source-${index}`,
            surfaceColor: darkThemeSurfaceColor,
          })),
      ];
    }
  );
  const resolvedSourceFills = await resolveChartFillColors(
    page,
    sourceChartFills
  );

  for (const [index, fill] of resolvedSourceFills.entries()) {
    const sourceFill = sourceChartFills[index];

    expect(fill.isSupported, `${fill.id} must be a valid CSS color`).toBe(true);
    expect(
      getContrastRatio(fill.color, sourceFill.surfaceColor),
      `${fill.id} must be visible on its chart canvas`
    ).toBeGreaterThanOrEqual(minimumChartFillContrast);
    expect(
      getContrastRatio(fill.color, sourceFill.contrastText),
      `${fill.id} must retain readable in-bar text`
    ).toBeGreaterThanOrEqual(minimumSourceTextContrast);
  }
});
