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

import GlossaryText from "@/components/ui/GlossaryText";

interface FeatureTileProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly description?: string | React.ReactNode;
  /**
   * Rendered as a second item of the tile's content row, beside the column
   * holding the icon, title, subtitle and description.
   *
   * @remarks
   * The tile styles none of it. It is a bare flex item, so a child sizes,
   * positions and insets itself — the tile's card is the positioned ancestor,
   * so a child is free to go absolute against it — and decides for itself
   * whether it stays beside the text column or takes a line of its own by
   * asking for a full basis. Anything the tile imposed here would be a guess
   * about content it does not own, and the guess used to be wrong: a rule
   * reaching into the child to fix its width meant the same preview was
   * measured in three places at once.
   */
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

const assertNever = (value: never): never => {
  throw new Error(`Unsupported FeatureTile value: ${String(value)}`);
};

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

  return assertNever(accent);
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
          flexDirection: "row",
          alignItems: "stretch",
          // Wraps so a child that asks for a full basis takes a line of its
          // own beneath the text column. Whether it does is the child's call —
          // the tile only leaves the option open. With no children there is a
          // single item on the row and nothing to wrap.
          flexWrap: "wrap",
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            // flexGrow: 1,
            minWidth: 0,
            p: 2,
            pt: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 0.25,
            zIndex: 4,
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
                display: "inline",
              },
              (muiTheme) =>
                muiTheme.applyStyles("dark", {
                  color: variantColors.colorDark,
                  backgroundColor: variantColors.backgroundDark,
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
        {children}
      </Box>
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
