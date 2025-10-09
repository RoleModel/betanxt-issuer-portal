'use client'

import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'
import React, { useEffect } from 'react'

import { useClient } from '@/contexts/ClientContext'

import { getThemeForClient } from './theme'

// Type guard to check if a value is a complete palette color
function isPaletteColor(
  value: unknown,
): value is { main: string; light?: string; dark?: string; contrastText?: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'main' in value &&
    typeof (value as { main: unknown }).main === 'string'
  )
}

interface DynamicThemeProviderProps {
  children: React.ReactNode
}

/**
 * Theme provider that dynamically applies client-specific branding colors
 * based on the current client from ClientContext
 * 
 * Usage:
 * - Wrap your application with this provider instead of MUI's ThemeProvider
 * - Theme will automatically update when the current client changes
 * - Falls back to default theme (WEN branding) if no client is available
 */
export const DynamicThemeProvider: React.FC<DynamicThemeProviderProps> = ({ children }) => {
  const { currentClient } = useClient()

  // Get the pre-built theme for the current client
  const theme = getThemeForClient(currentClient?.ticker)

  console.log('🎨 DynamicThemeProvider:', {
    ticker: currentClient?.ticker,
    primaryColor: theme.palette.primary.main,
    themeName: currentClient?.ticker ?? 'WEN (default)',
  })

  // Manually update CSS variables when theme changes
  useEffect(() => {
    if (typeof document !== 'undefined' && theme.vars) {
      const root = document.documentElement

      // Update primary color variables
      root.style.setProperty('--mui-palette-primary-main', theme.palette.primary.main)
      root.style.setProperty('--mui-palette-primary-light', theme.palette.primary.light ?? theme.palette.primary.main)
      root.style.setProperty('--mui-palette-primary-dark', theme.palette.primary.dark ?? theme.palette.primary.main)
      root.style.setProperty('--mui-palette-primary-contrastText', theme.palette.primary.contrastText ?? '#fff')

      // Update secondary color variables
      root.style.setProperty('--mui-palette-secondary-main', theme.palette.secondary.main)
      root.style.setProperty('--mui-palette-secondary-light', theme.palette.secondary.light ?? theme.palette.secondary.main)
      root.style.setProperty('--mui-palette-secondary-dark', theme.palette.secondary.dark ?? theme.palette.secondary.main)
      root.style.setProperty('--mui-palette-secondary-contrastText', theme.palette.secondary.contrastText ?? '#fff')

      // Update tertiary color variables if they exist (using type guard)
      const tertiary = theme.palette.tertiary
      if (isPaletteColor(tertiary)) {
        root.style.setProperty('--mui-palette-tertiary-main', tertiary.main)
        root.style.setProperty('--mui-palette-tertiary-light', tertiary.light ?? tertiary.main)
        root.style.setProperty('--mui-palette-tertiary-dark', tertiary.dark ?? tertiary.main)
        root.style.setProperty('--mui-palette-tertiary-contrastText', tertiary.contrastText ?? '#fff')
      }

    }
  }, [theme])

  return <CssVarsProvider theme={theme}>{children}</CssVarsProvider>
}
