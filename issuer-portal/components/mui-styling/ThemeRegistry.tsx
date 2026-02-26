'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import React, { useMemo } from 'react'

import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import { useClient } from '@/contexts/ClientContext'

import { NextAppDirEmotionCacheProvider } from './EmotionCache'
import type { createClientTheme } from './theme'
import {
  dfinThemeOptions,
  elevenThemeOptions,
  morrowSodaliThemeOptions,
  paycomThemeOptions,
  wendysThemeOptions,
  woodwardThemeOptions,
} from './theme'

const userTypeBrandTicker: Record<string, string> = {
  PARENT_CLIENT: 'DFIN',
  SOLICITOR: 'MRSO',
  CSM: 'WEN', // CSM uses default BetaNXT theme (WEN as base)
}

const multiClientUserTypes = new Set(['PARENT_CLIENT', 'SOLICITOR', 'CSM'])

const themeOptionsMap: Record<string, ReturnType<typeof createClientTheme>> = {
  WEN: wendysThemeOptions,
  PAYC: paycomThemeOptions,
  WWD: woodwardThemeOptions,
  ELVN: elevenThemeOptions,
  DFIN: dfinThemeOptions,
  MRSO: morrowSodaliThemeOptions,
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const { currentClient } = useClient()
  const { data: session } = useSession()
  const pathname = usePathname()

  const ticker = currentClient?.ticker

  const theme = useMemo(() => {
    const userType = session?.user?.type
    const isMultiClientUser = userType ? multiClientUserTypes.has(userType) : false
    // Check if the URL contains a specific client ticker
    const urlHasTicker = /^\/[A-Z]{2,5}\//.test(pathname)

    // Multi-client users on non-ticker routes (e.g. /events) use their brand theme
    if (isMultiClientUser && !urlHasTicker && userType) {
      const brandTicker = userTypeBrandTicker[userType]
      if (brandTicker) {
        const themeOptions = themeOptionsMap[brandTicker] ?? wendysThemeOptions
        return createTheme(themeOptions)
      }
    }

    // Use client ticker if available, otherwise fall back to user-type brand
    const effectiveTicker =
      ticker ?? (userType ? userTypeBrandTicker[userType] : undefined)

    if (!effectiveTicker) {
      return null
    }

    const themeOptions = themeOptionsMap[effectiveTicker] ?? wendysThemeOptions
    return createTheme(themeOptions)
  }, [ticker, session?.user?.type, pathname])

  // Wait for theme to be determined before rendering
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
