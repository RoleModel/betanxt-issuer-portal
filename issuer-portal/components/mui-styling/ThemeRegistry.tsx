'use client'

import React, { useMemo } from 'react'

import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import { useClient } from '@/contexts/ClientContext'

import { NextAppDirEmotionCacheProvider } from './EmotionCache'
import {
  elevenThemeOptions,
  paycomThemeOptions,
  wendysThemeOptions,
  woodwardThemeOptions,
} from './theme'

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const { currentClient } = useClient()

  const ticker = currentClient?.ticker

  const theme = useMemo(() => {
    // Don't create theme until we have actual client ticker
    if (!ticker) {
      return null
    }

    const themeOptionsMap = {
      WEN: wendysThemeOptions,
      PAYC: paycomThemeOptions,
      WWD: woodwardThemeOptions,
      ELVN: elevenThemeOptions,
    }

    const themeOptions =
      themeOptionsMap[ticker as keyof typeof themeOptionsMap] ?? wendysThemeOptions
    return createTheme(themeOptions)
  }, [ticker])

  // Wait for client to load before rendering to prevent wrong theme CSS injection
  if (!theme) {
    return null
  }

  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  )
}

export const useClientTicker = () => {
  const { currentClient } = useClient()
  return currentClient?.ticker ?? 'WEN'
}

export { useTheme } from '@mui/material/styles'
