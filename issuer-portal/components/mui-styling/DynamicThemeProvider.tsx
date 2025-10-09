'use client'

import { ThemeProvider } from '@mui/material/styles'
import React, { useMemo } from 'react'

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
  const theme = useMemo(() => createClientTheme(currentClient?.ticker), [currentClient?.ticker])

  // Force ThemeProvider to remount when ticker changes by using key
  // This ensures CSS variables are properly reinitialized
  return (
    <ThemeProvider key={currentClient?.ticker ?? 'default'} theme={theme}>
      {children}
    </ThemeProvider>
  )
}
