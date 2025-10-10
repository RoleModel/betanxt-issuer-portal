'use client'

import Link from 'next/link'
import React from 'react'

import type { SxProps } from '@mui/material';
import { Box, Card, Typography } from '@mui/material'
import type { Theme } from '@mui/material/styles'

interface FeatureTileProps {
  title: string
  subtitle?: string
  description?: string | React.ReactNode
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
  sx,
  brandFont = false,
}: FeatureTileProps) {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return {
          background: (theme: Theme) => theme.vars.palette.primary.main,
          color: (theme: Theme) =>
            `${theme.vars.palette.primary.contrastText} !important`,
        }
      case 'secondary':
        return {
          background: (theme: Theme) => theme.vars.palette.secondary.main,
          color: (theme: Theme) => theme.vars.palette.secondary.contrastText,
        }
      case 'tertiary':
        return {
          background: (theme: Theme) => {
            const palette = theme.vars.palette as Record<string, unknown>
            const tertiary = palette.tertiary as { main?: string } | undefined
            return tertiary?.main ?? theme.vars.palette.primary.main
          },
          color: (theme: Theme) => {
            const palette = theme.vars.palette as Record<string, unknown>
            const tertiary = palette.tertiary as { contrastText?: string } | undefined
            return tertiary?.contrastText ?? theme.vars.palette.primary.contrastText
          },
        }
      case 'base':
        return {
          background: (theme: Theme) => theme.vars.palette.background.default,
          color: (theme: Theme) => theme.vars.palette.text.primary,
        }
      default:
        return {
          background: (theme: Theme) => theme.vars.palette.tableCellRow.fill,
          color: (theme: Theme) => theme.vars.palette.text.primary,
        }
    }
  }

  const variantStyles = getVariantStyles(variant)

  const CardContent = (
    <Card
      className="feature-tile"
      variant="outlined"
      sx={{
        ...sx,
        display: 'flex',
        flex: flex ? '1 0 0%' : '0 0 auto',
        flexDirection: 'column',
        height: height ?? undefined,
        background: variantStyles.background,
        border: `1px solid`,
        borderColor: (theme: Theme) => theme.vars.palette.divider,
        borderRadius: 1,
        pt: 2,
        cursor: href || onClick ? 'pointer' : 'default',
        transition: (theme) =>
          theme.transitions.create(['transform', 'background-color', 'box-shadow']),
        '&:hover':
          href ?? onClick
            ? {
              transform: 'translateY(-2px)',
            }
            : undefined,
      }}
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
            sx={{
              mb: 1,
              height: iconSize,
              width: iconSize,
              fontSize: iconSize,
              color: variantStyles.color,
              '& .MuiSvgIcon-root': {
                height: iconSize,
                width: iconSize,
              },
              '& .MuiSvgIcon-root path[stroke-width="2"]:not([stroke])': {
                stroke: variantStyles.color,
              },
            }}
          >
            {icon}
          </Box>
        )}

        <Typography
          component="h2"
          variant={titleVariant}
          gutterBottom
          sx={{
            fontFamily: brandFont
              ? 'var(--font-tungsten)'
              : 'var(--font-roboto-condensed)',
            fontWeight: 500,
            color: variantStyles.color,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{
              color: 'secondary.main',
              fontWeight: 600,
            }}
          >
            {subtitle}
          </Typography>
        )}
        <Box
          sx={(theme) => ({
            color: variantStyles.color,
            ...theme.typography.body3,
          })}
        >
          {description}
        </Box>
        {actionText || href ? (
          <Typography
            variant="body3"
            sx={{ textDecoration: 'underline', color: variantStyles.color }}
          >
            {actionText}
          </Typography>
        ) : null}
      </Box>
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
