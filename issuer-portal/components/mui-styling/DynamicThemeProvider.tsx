'use client'

import { ThemeProvider } from '@mui/material/styles'
import React, { useEffect, useMemo } from 'react'

import { useClient } from '@/contexts/ClientContext'

import { createClientTheme } from './theme'

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
 * - MUI automatically handles CSS variables and mode switching
 */
export const DynamicThemeProvider: React.FC<DynamicThemeProviderProps> = ({ children }) => {
  const { currentClient } = useClient()

  // Create theme dynamically based on current client ticker
  // useMemo ensures theme is only recreated when ticker changes
  const theme = useMemo(() => {
    const createdTheme = createClientTheme(currentClient?.ticker)
    return createdTheme
  }, [currentClient?.ticker])

  // Manually update CSS variables when theme changes
  // This is needed because MUI's CSS variables mode doesn't auto-update when theme object changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      console.log('🔧 Manually updating CSS variables for:', currentClient?.ticker)
      const root = document.documentElement

      // Update primary color CSS variables
      root.style.setProperty('--mui-palette-primary-main', theme.palette.primary.main)
      root.style.setProperty('--mui-palette-primary-light', theme.palette.primary.light || theme.palette.primary.main)
      root.style.setProperty('--mui-palette-primary-dark', theme.palette.primary.dark || theme.palette.primary.main)
      root.style.setProperty('--mui-palette-primary-contrastText', theme.palette.primary.contrastText || '#fff')

      // Update secondary color CSS variables
      root.style.setProperty('--mui-palette-secondary-main', theme.palette.secondary.main)
      root.style.setProperty('--mui-palette-secondary-light', theme.palette.secondary.light || theme.palette.secondary.main)
      root.style.setProperty('--mui-palette-secondary-dark', theme.palette.secondary.dark || theme.palette.secondary.main)
      root.style.setProperty('--mui-palette-secondary-contrastText', theme.palette.secondary.contrastText || '#fff')

      console.log('✅ CSS variables updated')
    }
  }, [theme, currentClient?.ticker])

  // forceThemeRerender forces full re-render when theme changes (required for CSS variables mode)
  // disableTransitionOnChange prevents visual transition artifacts
  return (
    <ThemeProvider
      theme={theme}
      disableTransitionOnChange
      forceThemeRerender
    >
      {children}
    </ThemeProvider>
  )
}
