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

  const ticker = currentClient?.ticker ?? 'WEN'

  const theme = useMemo(() => {
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

  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme} key={ticker}>
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
