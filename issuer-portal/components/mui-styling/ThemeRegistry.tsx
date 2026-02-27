'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import React, { useMemo } from 'react'

import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import { useClient } from '@/contexts/ClientContext'

import type { createClientTheme } from './theme'
import {
  dfinThemeOptions,
  elevenThemeOptions,
  morrowSodaliThemeOptions,
  paycomThemeOptions,
  wendysThemeOptions,
  woodwardThemeOptions,
} from './theme'

const TICKER_PREFIX_REGEX = /^\/([A-Z]{2,5})\//

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
  const { data: session, status } = useSession()
  const pathname = usePathname()

  const ticker = currentClient?.ticker
  const userType = session?.user?.type

  // Extract client ticker from URL to detect client context
  const urlTicker = useMemo(() => {
    const match = TICKER_PREFIX_REGEX.exec(pathname)
    return match ? match[1] : null
  }, [pathname])

  const theme = useMemo(() => {
    const isMultiClientUser = userType ? multiClientUserTypes.has(userType) : false

    if (isMultiClientUser && userType) {
      // When on a client-specific page, use that client's theme or default
      if (urlTicker) {
        return createTheme(themeOptionsMap[urlTicker] ?? wendysThemeOptions)
      }

      // Fall back to the user's brand theme on top-level pages (events, profile, etc.)
      const brandTicker = userTypeBrandTicker[userType]
      if (brandTicker) {
        return createTheme(themeOptionsMap[brandTicker] ?? wendysThemeOptions)
      }
    }

    // Use client ticker if available, otherwise fall back to user-type brand
    const effectiveTicker =
      ticker ?? (userType ? userTypeBrandTicker[userType] : undefined)

    const themeOptions = effectiveTicker
      ? (themeOptionsMap[effectiveTicker] ?? wendysThemeOptions)
      : wendysThemeOptions
    return createTheme(themeOptions)
  }, [ticker, userType, status, urlTicker])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  )
}

export const useClientTicker = () => {
  const { currentClient } = useClient()
  return currentClient?.ticker ?? 'WEN'
}

export { useTheme } from '@mui/material/styles'
