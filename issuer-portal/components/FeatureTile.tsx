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
}

type FeatureTileVariant = NonNullable<FeatureTileProps["variant"]>;

interface VariantColors {
  background: string;
  backgroundDark: string;
  color: string;
  colorDark: string;
}

const hasMainColor = (
  color: PaletteColorOptions
): color is SimplePaletteColorOptions => Object.hasOwn(color, "main");

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
      };
    case "secondary":
      return {
        background: theme.palette.secondary.main,
        backgroundDark: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,
        colorDark: theme.palette.secondary.contrastText,
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
      };
    }
    case "base":
      return {
        background: theme.vars.palette.background.default,
        backgroundDark: theme.vars.palette.background.default,
        color: theme.vars.palette.text.primary,
        colorDark: theme.vars.palette.text.primary,
      };
    case "default":
      return {
        background: theme.vars.palette.background.paper,
        backgroundDark: theme.vars.palette.background.paper,
        color: theme.vars.palette.text.primary,
        colorDark: theme.vars.palette.text.primary,
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
  children,
}: FeatureTileProps) => {
  const theme = useTheme();
  const variantColors = getVariantColors(theme, variant);
  const isInteractive = href !== undefined || onClick !== undefined;

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
        sx={{
          display: "flex",
          flexDirection: "row",
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
              sx={(muiTheme) => ({
                color: muiTheme.vars.palette.primary.main,
                fontWeight: 600,
              })}
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
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              flex: "1 0 200px",
              pr: 2,
              position: "relative",
              "& > .MuiBox-root": {
                width: 140,
                position: "absolute",
                right: 20,
                top: 0,
              },
            }}
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
