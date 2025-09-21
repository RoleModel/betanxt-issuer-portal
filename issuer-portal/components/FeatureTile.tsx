'use client'

import NextLink from 'next/link'
import React from 'react'

import { Box, Card, Link, Typography } from '@mui/material'
import type { Theme } from '@mui/material/styles'

interface FeatureTileProps {
  title: string
  description: string | React.ReactNode
  actionText: string
  icon: React.ReactNode
  titleVariant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  variant?: 'default' | 'primary' | 'secondary' | 'info' | 'base'
  onClick?: () => void
  href?: string
}

export function FeatureTile({
  title,
  description,
  actionText,
  icon,
  titleVariant = 'h1',
  variant = 'default',
  onClick,
  href,
}: FeatureTileProps) {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: (theme: Theme) => theme.vars.palette.primary.main,
          color: (theme: Theme) =>
            `${theme.vars.palette.primary.contrastText} !important`,
          hoverBackgroundColor: (theme: Theme) => theme.vars.palette.primary.dark,
        }
      case 'secondary':
        return {
          backgroundColor: (theme: Theme) => theme.vars.palette.secondary.main,
          color: (theme: Theme) =>
            `${theme.vars.palette.secondary.contrastText} !important`,
          hoverBackgroundColor: (theme: Theme) => theme.vars.palette.secondary.dark,
          hoverColor: (theme: Theme) => theme.vars.palette.secondary.light,
        }
      case 'info':
        return {
          backgroundColor: (theme: Theme) => theme.vars.palette.info.main,
          color: (theme: Theme) => `${theme.vars.palette.info.contrastText} !important`,
          hoverBackgroundColor: (theme: Theme) => theme.vars.palette.info.dark,
          hoverColor: (theme: Theme) => theme.vars.palette.info.light,
        }
      case 'base':
        return {
          backgroundColor: (theme: Theme) => theme.vars.palette.background.default,
          color: (theme: Theme) => `${theme.vars.palette.text.primary} !important`,
          hoverBackgroundColor: (theme: Theme) => theme.vars.palette.background.paper,
          hoverColor: (theme: Theme) => theme.vars.palette.primary.main,
        }
      default:
        return {
          backgroundColor: (theme: Theme) => theme.vars.palette.tableCellRow.fill,
          color: (theme: Theme) => `${theme.vars.palette.text.primary} !important`,
          hoverBackgroundColor: (theme: Theme) => theme.vars.palette.background.default,
        }
    }
  }

  const variantStyles = getVariantStyles(variant)

  return (
    <Card
      className="feature-tile"
      elevation={0}
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: variantStyles.backgroundColor,
        borderRadius: 1,
        pt: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: (theme) =>
          theme.transitions.create(['transform', 'background-color']),
        '&:hover':
          href || onClick
            ? {
                transform: 'translateY(-2px)',
                backgroundColor: variantStyles.hoverBackgroundColor,
                color: variantStyles.hoverColor,
              }
            : {},
      }}
      onClick={href && !onClick ? undefined : onClick}
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
        <Box
          sx={{
            mb: 0.25,
            color: variantStyles.color,
            '& .MuiSvgIcon-root path:not([stroke])': {
              stroke: variantStyles.color,
            },
          }}
        >
          {icon}
        </Box>

        <Typography
          component="h2"
          variant={titleVariant}
          gutterBottom
          sx={{
            fontFamily: 'var(--font-roboto-condensed)',
            fontWeight: 500,
            color: variantStyles.color,
          }}
        >
          {title}
        </Typography>

        <Box
          sx={(theme) => ({
            color: variantStyles.color,
            ...theme.typography.body3,
          })}
        >
          {description}
        </Box>

        {href ? (
          <Link
            component={NextLink}
            href={href}
            sx={{
              alignSelf: 'flex-start',
              color: variantStyles.color,
              textDecoration: 'underline',
              textDecorationColor: variantStyles.color,
            }}
            onClick={(e) => {
              if (onClick) {
                e.stopPropagation()
              }
            }}
          >
            {actionText}
          </Link>
        ) : (
          <Link
            sx={{
              alignSelf: 'flex-start',
              color: variantStyles.color,
              textDecoration: 'underline',
              textDecorationColor: variantStyles.color,
              cursor: onClick ? 'pointer' : 'default',
            }}
          >
            {actionText}
          </Link>
        )}
      </Box>
    </Card>
  )
}

// Export types for external use
export type { FeatureTileProps }

// Also export as default for backward compatibility
export default FeatureTile
