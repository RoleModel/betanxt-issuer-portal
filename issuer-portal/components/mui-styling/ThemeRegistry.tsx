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
  const [initialLoad, setInitialLoad] = React.useState(true)

  // Wait for client to load on initial render to prevent duplicate CSS variable injection
  React.useEffect(() => {
    if (currentClient !== null || !initialLoad) {
      setInitialLoad(false)
    }
  }, [currentClient, initialLoad])

  const ticker = currentClient?.ticker ?? 'WEN'

  const theme = useMemo(() => {
    // Don't create theme until client is loaded
    if (initialLoad && currentClient === null) {
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
  }, [ticker, initialLoad, currentClient])

  // Show skeleton while theme loads to improve FCP - don't block rendering
  if (!theme) {
    return (
      <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
        <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
          {children}
        </div>
      </NextAppDirEmotionCacheProvider>
    )
  }

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
