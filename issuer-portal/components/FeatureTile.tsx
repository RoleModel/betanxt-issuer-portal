"use client";

import type {
  PaletteColorOptions,
  SimplePaletteColorOptions,
  SxProps,
  Theme,
} from "@mui/material";

import { Box, Card, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import React from "react";

import { featureTileThumbnailWidth } from "@/components/featureTileMetrics";
import GlossaryText from "@/components/ui/GlossaryText";

interface FeatureTileProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly description?: string | React.ReactNode;
  readonly children?: React.ReactNode;
  readonly actionText?: string;
  readonly icon?: React.ReactNode;
  readonly iconSize?: "24px" | "32px" | "48px" | "64px" | "96px";
  readonly titleVariant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  readonly bodyVariant?: "body1" | "body2" | "body3";
  readonly variant?: "default" | "primary" | "secondary" | "tertiary" | "base";
  readonly onClick?: () => void;
  readonly href?: string;
  readonly flex?: boolean;
  readonly gutterBottom?: boolean;
  readonly height?: string;
  readonly sx?: SxProps;
  readonly brandFont?: boolean;
  /**
   * Optional preview rendered to the right of the tile content. Used on the
   * Mailing tab to show a thumbnail of exactly what went out (the generated
   * Full Set / NAA PDF, or the Electronic email). The node owns its own click
   * behaviour, so the caller decides what a click opens.
   */
  readonly thumbnail?: React.ReactNode;
  /**
   * How the thumbnail slot is laid out. "overlay" (the default) absolutely
   * positions a single preview at a fixed width on the tile's right edge.
   * "flow" keeps the slot in the flex flow at its natural size, so a
   * container of several thumbnails can wrap without covering the tile's
   * title and value.
   */
  readonly thumbnailLayout?: "overlay" | "flow";
  /**
   * Draws the tile's left edge in a palette colour, to mark it out from the
   * tiles beside it without filling it.
   *
   * @remarks
   * Only the `base` variant honours this. The filled variants already carry
   * their colour across the whole surface, and an accent on a `default` tile
   * would put an edge on the app's ordinary card. It is opt-in rather than
   * automatic because most `base` tiles are one of a set of equals — the
   * product pages, the education cards — and an edge on all of them says
   * nothing.
   *
   * Prefer this to a filled variant when a tile leads a group it is still
   * being compared against: it keeps the surface, so a thumbnail on the tile
   * keeps its contrast and a glossary term in the subtitle keeps reading as
   * one.
   */
  readonly accent?: "primary" | "secondary" | "tertiary";
}

type FeatureTileVariant = NonNullable<FeatureTileProps["variant"]>;

/** Width of the accent edge, in px. */
const accentEdgeWidth = 4;

interface VariantColors {
  background: string;
  backgroundDark: string;
  color: string;
  colorDark: string;
  /**
   * The subtitle, and so the glossary markers inside it — they inherit their
   * colour and draw their underline in `currentColor`. On a tile whose surface
   * is a neutral one this is the brand colour, which is what makes the label
   * read as a term you can open. On a tile filled with that same brand colour
   * it has to invert to the contrast text instead, or the label is drawn in
   * the colour it is sitting on and disappears.
   */
  subtitle: string;
  subtitleDark: string;
}

const hasMainColor = (
  color: PaletteColorOptions
): color is SimplePaletteColorOptions => Object.hasOwn(color, "main");

/**
 * The palette colour an accent edge is drawn in.
 *
 * @remarks
 * Read from `theme.vars` rather than `theme.palette` so the edge follows the
 * CSS variable, which is what per-client theming rewrites — a tile on
 * FocalPoint's meeting draws its own purple, not the default brand's.
 */
const getAccentColor = (
  theme: Theme,
  accent: NonNullable<FeatureTileProps["accent"]>
): string | undefined => {
  switch (accent) {
    case "primary":
      return theme.vars.palette.primary.main;
    case "secondary":
      return theme.vars.palette.secondary.main;
    case "tertiary": {
      const { tertiary } = theme.palette;
      return hasMainColor(tertiary) ? tertiary.main : undefined;
    }
  }
};

const assertNever = (value: never): never => {
  throw new Error(`Unsupported FeatureTile variant: ${String(value)}`);
};

const getVariantColors = (
  theme: Theme,
  tileVariant: FeatureTileVariant
): VariantColors => {
  switch (tileVariant) {
    case "primary":
      return {
        background: theme.palette.primary.main,
        backgroundDark: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        colorDark: theme.palette.primary.contrastText,
        subtitle: theme.palette.primary.contrastText,
        subtitleDark: theme.palette.primary.contrastText,
      };
    case "secondary":
      return {
        background: theme.palette.secondary.main,
        backgroundDark: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,
        colorDark: theme.palette.secondary.contrastText,
        subtitle: theme.palette.secondary.contrastText,
        subtitleDark: theme.palette.secondary.contrastText,
      };
    case "tertiary": {
      const { tertiary } = theme.palette;
      if (!hasMainColor(tertiary)) {
        return getVariantColors(theme, "default");
      }

      const contrastText =
        tertiary.contrastText ?? theme.palette.getContrastText(tertiary.main);

      return {
        background: tertiary.main,
        backgroundDark: tertiary.main,
        color: contrastText,
        colorDark: contrastText,
        subtitle: contrastText,
        subtitleDark: contrastText,
      };
    }
    case "base":
      return {
        background: theme.vars.palette.background.default,
        backgroundDark: theme.vars.palette.background.default,
        color: theme.vars.palette.text.primary,
        colorDark: theme.vars.palette.text.primary,
        subtitle: theme.vars.palette.primary.main,
        subtitleDark: theme.vars.palette.primary.main,
      };
    case "default":
      return {
        background: theme.vars.palette.background.paper,
        backgroundDark: theme.vars.palette.background.paper,
        color: theme.vars.palette.text.primary,
        colorDark: theme.vars.palette.text.primary,
        subtitle: theme.vars.palette.primary.main,
        subtitleDark: theme.vars.palette.primary.main,
      };
  }

  return assertNever(tileVariant);
};

export const FeatureTile = ({
  title,
  subtitle,
  description,
  actionText,
  flex,
  height,
  icon,
  iconSize = "48px",
  titleVariant = "h1",
  bodyVariant = "body1",
  variant = "default",
  gutterBottom = true,
  onClick,
  href,
  sx,
  brandFont = false,
  thumbnail,
  thumbnailLayout = "overlay",
  accent,
  children,
}: FeatureTileProps) => {
  const theme = useTheme();
  const variantColors = getVariantColors(theme, variant);
  const isInteractive = href !== undefined || onClick !== undefined;
  const accentColor =
    accent === undefined || variant !== "base"
      ? undefined
      : getAccentColor(theme, accent);

  const CardContent = (
    <Card
      className="feature-tile"
      variant="outlined"
      sx={[
        {
          display: "flex",
          position: "relative",
          flex: (flex ?? false) ? "1 0 0%" : "0 0 auto",
          flexDirection: "column",
          ...(height != null ? { height } : {}),
          background: variantColors.background,
          backgroundColor: variantColors.background,
          color: variantColors.color,
          // Thickens the outlined card's existing left rule rather than adding
          // a border, so the edge sits flush inside the same rounded corner
          // instead of overhanging it.
          ...(accentColor === undefined
            ? {}
            : {
                borderLeftWidth: accentEdgeWidth,
                borderLeftStyle: "solid",
                borderLeftColor: accentColor,
              }),
          pt: 2,
          cursor: isInteractive ? "pointer" : "default",
          transition:
            "transform 0.2s ease-in-out, background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          ...(isInteractive
            ? {
                "&:hover": {
                  transform: "translateY(-2px)",
                },
              }
            : {}),
        },
        (muiTheme) =>
          muiTheme.applyStyles("dark", {
            background: variantColors.backgroundDark,
            backgroundColor: variantColors.backgroundDark,
            color: variantColors.colorDark,
          }),
        ...(sx === undefined ? [] : Array.isArray(sx) ? sx : [sx]),
      ]}
      onClick={
        onClick !== undefined && href === undefined ? onClick : undefined
      }
    >
      <Box
        className="feature-tile-content"
        sx={{
          display: "flex",
          // A single preview stays beside the title at every width. Only the
          // flow slot, which may hold several previews, drops beneath it on a
          // narrow tile — there is no room to line them up next to the title.
          flexDirection:
            thumbnailLayout === "flow" ? { xs: "column", sm: "row" } : "row",
          alignItems: "stretch",
          flexGrow: 1,
          minWidth: 0,
          pb: thumbnail != null ? 2 : 0,
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            p: 2,
            pt: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 0.25,
            zIndex: 0,
          }}
        >
          {icon != null && (
            <Box
              sx={[
                {
                  mb: 1,
                  height: iconSize,
                  width: iconSize,
                  fontSize: iconSize,
                  color: variantColors.color,
                  "& .MuiSvgIcon-root": {
                    height: iconSize,
                    width: iconSize,
                  },
                  '& .MuiSvgIcon-root path[stroke-width="2"]:not([stroke])': {
                    stroke: variantColors.color,
                  },
                },
                (muiTheme) =>
                  muiTheme.applyStyles("dark", {
                    color: variantColors.colorDark,
                    '& .MuiSvgIcon-root path[stroke-width="2"]:not([stroke])': {
                      stroke: variantColors.colorDark,
                    },
                  }),
              ]}
            >
              {icon}
            </Box>
          )}

          <Typography
            component="h2"
            variant={titleVariant}
            gutterBottom={gutterBottom}
            sx={[
              {
                fontFamily: brandFont
                  ? "var(--font-tungsten)"
                  : "var(--font-roboto-condensed)",
                fontWeight: 500,
                color: variantColors.color,
              },
              (muiTheme) =>
                muiTheme.applyStyles("dark", {
                  color: variantColors.colorDark,
                }),
            ]}
          >
            <GlossaryText>{title}</GlossaryText>
          </Typography>
          {subtitle != null && (
            <Typography
              variant={bodyVariant}
              sx={[
                { color: variantColors.subtitle, fontWeight: 600 },
                (muiTheme) =>
                  muiTheme.applyStyles("dark", {
                    color: variantColors.subtitleDark,
                  }),
              ]}
            >
              <GlossaryText>{subtitle}</GlossaryText>
            </Typography>
          )}
          <Box
            sx={[
              (muiTheme) => ({
                color: variantColors.color,
                ...muiTheme.typography.body3,
              }),
              (muiTheme) =>
                muiTheme.applyStyles("dark", {
                  color: variantColors.colorDark,
                }),
            ]}
          >
            {description}
          </Box>
          {actionText != null || href != null ? (
            <Typography
              variant="body3"
              sx={[
                {
                  textDecoration: "underline",
                  color: variantColors.color,
                },
                (muiTheme) =>
                  muiTheme.applyStyles("dark", {
                    color: variantColors.colorDark,
                  }),
              ]}
            >
              {actionText}
            </Typography>
          ) : null}
        </Box>
        {thumbnail != null && (
          <Box
            className="feature-tile-thumbnail-container"
            sx={
              thumbnailLayout === "overlay"
                ? {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    // A lone preview holds the tile's right edge at every
                    // width — even a phone-width tile has room for it beside
                    // the count, so it never needs to stack.
                    flex: "1 0 200px",
                    pr: 2,
                    position: "absolute",
                    right: 20,
                    top: 20,
                    "& > .MuiBox-root": {
                      width: featureTileThumbnailWidth,
                      // Keep the preview positioned: this rule outranks its
                      // own `position`, and a static preview would let
                      // anything it places absolutely — a fallback icon, say —
                      // escape its frame and land on the card.
                      position: "absolute",
                      right: 0,
                      top: 0,
                    },
                  }
                : {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: { xs: "flex-start", sm: "flex-end" },
                    // The flow slot's previews are absolute from sm up, which
                    // makes the wrap and gap inert there; below sm they are in
                    // normal flow and wrap onto as many rows as they need.
                    flexWrap: "wrap",
                    gap: 1,
                    flex: { xs: "0 0 auto", sm: "1 1 auto" },
                    minWidth: 0,
                    pl: { xs: 2, sm: 0 },
                    pr: 2,
                    pt: 2,
                  }
            }
          >
            {thumbnail}
          </Box>
        )}
      </Box>
      {children}
    </Card>
  );

  // If href is provided, wrap the entire card with Link for better accessibility
  if (href != null) {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {CardContent}
      </Link>
    );
  }

  return CardContent;
};

// Export types for external use
export type { FeatureTileProps };

// Also export as default for backward compatibility
export default FeatureTile;
