'use client'

import baseTheme from '@rolemodel/betanxt-design-system/themes/baseTheme'
import betanxtTheme from '@rolemodel/betanxt-design-system/themes/betanxtTheme'
import { useTheme } from '@mui/material/styles';
import Link from 'next/link'
import React from 'react'

import type { PaletteColor, SxProps } from '@mui/material'
import { Box, Card, Typography } from '@mui/material'



interface FeatureTileProps {
  title: string
  subtitle?: string
  description?: string | React.ReactNode
  children?: React.ReactNode
  actionText?: string
  icon?: React.ReactNode
  iconSize?: '24px' | '32px' | '48px' | '64px' | '96px'
  titleVariant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary' | 'base'
  onClick?: () => void
  href?: string
  flex?: boolean
  height?: string
  sx?: SxProps
  fileUrl?: string
  brandFont?: boolean
}

export function FeatureTile({
  title,
  subtitle,
  description,
  actionText,
  flex,
  height,
  icon,
  iconSize = '48px',
  titleVariant = 'h1',
  variant = 'default',
  onClick,
  href,
  brandFont = false,
  children,
}: FeatureTileProps) {
  // Get colors from betanxt theme
  const theme = useTheme();
  const getVariantColors = (variant: string) => {
    switch (variant) {
      case 'primary':
        return {
          background: theme.palette.primary.main,
          backgroundDark: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          colorDark: theme.palette.primary.contrastText,
        }
      case 'secondary':
        return {
          background: theme.palette.secondary.main,
          backgroundDark: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
          colorDark: theme.palette.secondary.contrastText,
        }
      case 'tertiary': {
        const tertiary = betanxtTheme.palette.tertiary as PaletteColor
        return {
          background: tertiary.main,
          backgroundDark: tertiary.main,
          color: tertiary.contrastText,
          colorDark: tertiary.contrastText,
        }
      }
      case 'base':
        return {
          background: theme.vars.palette.background.default,
          backgroundDark: theme.vars.palette.background.default,
          color: theme.vars.palette.text.primary,
          colorDark: theme.vars.palette.text.primary,
        }
      default:
        return {
          background: theme.vars.palette.background.paper,
          backgroundDark: theme.vars.palette.background.paper,
          color: theme.vars.palette.text.primary,
          colorDark: theme.vars.palette.text.primary,
        }
    }
  }

  const variantColors = getVariantColors(variant)

  const CardContent = (
    <Card
      className="feature-tile"
      variant="outlined"
      sx={[
        {
          display: 'flex',
          position: 'relative',
          flex: flex ? '1 0 0%' : '0 0 auto',
          flexDirection: 'column',
          height: height ?? undefined,
          background: variantColors.background,
          backgroundColor: variantColors.background,
          color: variantColors.color,
          pt: 2,
          cursor: href || onClick ? 'pointer' : 'default',
          transition:
            'transform 0.2s ease-in-out, background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover':
            href || onClick
              ? {
                transform: 'translateY(-2px)',
              }
              : undefined,
        },
        (theme) =>
          theme.applyStyles('dark', {
            background: variantColors.backgroundDark,
            backgroundColor: variantColors.backgroundDark,
            color: variantColors.colorDark,
          }),
      ]}
      onClick={onClick && !href ? onClick : undefined}
    >
      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          pt: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 0.25,
        }}
      >
        {icon && (
          <Box
            sx={[
              {
                mb: 1,
                height: iconSize,
                width: iconSize,
                fontSize: iconSize,
                color: variantColors.color,
                '& .MuiSvgIcon-root': {
                  height: iconSize,
                  width: iconSize,
                },
                '& .MuiSvgIcon-root path[stroke-width="2"]:not([stroke])': {
                  stroke: variantColors.color,
                },
              },
              (theme) =>
                theme.applyStyles('dark', {
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
          gutterBottom
          sx={[
            {
              fontFamily: brandFont
                ? 'var(--font-tungsten)'
                : 'var(--font-roboto-condensed)',
              fontWeight: 500,
              color: variantColors.color,
            },
            (theme) =>
              theme.applyStyles('dark', {
                color: variantColors.colorDark,
              }),
          ]}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            sx={(theme) => ({
              color: theme.vars.palette.primary.main,
              fontWeight: 600,
            })}
          >
            {subtitle}
          </Typography>
        )}
        <Box
          sx={[
            (theme) => ({
              color: variantColors.color,
              ...theme.typography.body3,
            }),
            (theme) =>
              theme.applyStyles('dark', {
                color: variantColors.colorDark,
              }),
          ]}
        >
          {description}
        </Box>
        {actionText || href ? (
          <Typography
            variant="body3"
            sx={[
              {
                textDecoration: 'underline',
                color: variantColors.color,
              },
              (theme) =>
                theme.applyStyles('dark', {
                  color: variantColors.colorDark,
                }),
            ]}
          >
            {actionText}
          </Typography>
        ) : null}
      </Box>
      {children}
    </Card>
  )

  // If href is provided, wrap the entire card with Link for better accessibility
  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        {CardContent}
      </Link>
    )
  }

  return CardContent
}

// Export types for external use
export type { FeatureTileProps }

// Also export as default for backward compatibility
export default FeatureTile
