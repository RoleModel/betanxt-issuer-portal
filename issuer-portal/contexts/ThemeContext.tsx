'use client'

import { ThemeProvider } from '@mui/material/styles'
import React, { useMemo } from 'react'

import { useClient } from './ClientContext'
import { getThemeForClient } from '@/components/mui-styling/theme'

interface ThemeProviderProps {
  children: React.ReactNode
}

/**
 * Simple theme provider that follows the current client from ClientContext.
 * No separate theme state - theme automatically switches when client changes.
 */
export const ClientThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { currentClient } = useClient()

  // Select theme based on current client ticker
  const theme = useMemo(() => {
    const ticker = currentClient?.ticker ?? 'WEN'
    return getThemeForClient(ticker)
  }, [currentClient?.ticker])

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  )
}

/**
 * Hook to get the current client ticker (for backward compatibility)
 */
export const useClientTicker = () => {
  const { currentClient } = useClient()
  return currentClient?.ticker ?? 'WEN'
}

// Re-export MUI's useTheme for components that need theme values
export { useTheme } from '@mui/material/styles'
