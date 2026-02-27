'use client'

import { useSession } from 'next-auth/react'
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

  const ticker = currentClient?.ticker
  const userType = session?.user?.type

  const theme = useMemo(() => {
    const isMultiClientUser = userType ? multiClientUserTypes.has(userType) : false

    // Multi-client users (PARENT_CLIENT/SOLICITOR/CSM) always use their brand theme,
    // even when viewing a specific client's meeting page
    if (isMultiClientUser && userType) {
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
  }, [ticker, userType, status])

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
