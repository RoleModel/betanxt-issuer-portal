'use client'

import { Box, Button, Typography } from '@mui/material'
import { useTheme as useMuiTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'

import { useClient } from '@/contexts/ClientContext'
import { useClientTicker } from '@/contexts/ThemeContext'
import { createClientTheme } from '@/components/mui-styling/theme'

/**
 * Debug component to verify theme switching is working
 * Shows current client info and theme colors
 */
export const ThemeDebugger = () => {
  const { currentClient, availableClients, switchClient } = useClient()
  const themeName = useClientTicker()
  const muiTheme = useMuiTheme()

  // State to handle hydration
  const [isClient, setIsClient] = useState(false)
  const [cssVarPrimary, setCssVarPrimary] = useState('Loading...')

  // Handle hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update CSS variable when client-side
  useEffect(() => {
    if (isClient) {
      const cssVar = getComputedStyle(document.documentElement)
        .getPropertyValue('--mui-palette-primary-main')
        .trim() || 'Not set'
      setCssVarPrimary(cssVar)
    }
  }, [isClient, themeName, muiTheme])

  // Log theme changes and CSS variables
  useEffect(() => {
    if (isClient) {
      console.log('🎨 ThemeDebugger - Theme state:', {
        currentClient: currentClient?.ticker,
        themeName,
        muiThemePrimary: muiTheme.palette.primary.main,
        cssVariablePrimary: cssVarPrimary,
      })
    }
  }, [isClient, currentClient, themeName, muiTheme.palette.primary.main, cssVarPrimary])

  // Test theme function directly
  const testTheme = (ticker: string) => {
    const theme = createClientTheme(ticker)
    console.log(`🧪 Direct theme test for ${ticker}:`, theme.palette.primary.main)
  }

  return (
    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, m: 2, backgroundColor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>
        🔧 Theme Debug Info
      </Typography>

      <Typography variant="body2" gutterBottom>
        <strong>Current Client:</strong> {currentClient?.ticker} ({currentClient?.company_name})
      </Typography>

      <Typography variant="body2" gutterBottom>
        <strong>Active Theme Name:</strong> {themeName}
      </Typography>

      <Typography variant="body2" gutterBottom>
        <strong>MUI Theme Primary:</strong> {muiTheme.palette.primary.main}
      </Typography>

      <Typography variant="body2" gutterBottom>
        <strong>CSS Variable Primary:</strong> {cssVarPrimary}
      </Typography>

      <Typography variant="body2" gutterBottom>
        <strong>Available Clients:</strong> {availableClients.map(c => c.ticker).join(', ')}
      </Typography>

      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ width: '100%', mb: 1 }}>
          <strong>Switch Clients (switches both client and theme):</strong>
        </Typography>
        {availableClients.map((client) => (
          <Button
            key={client.id}
            variant={client.ticker === themeName ? 'contained' : 'outlined'}
            size="small"
            onClick={() => {
              console.log('🔄 Switching client to:', client.ticker)
              switchClient(client)
            }}
          >
            {client.ticker}
          </Button>
        ))}
      </Box>

      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ width: '100%', mb: 1 }}>
          <strong>Test Theme Functions:</strong>
        </Typography>
        {['WEN', 'PAYC', 'WWD', 'ELVN'].map((ticker) => (
          <Button
            key={ticker}
            variant="outlined"
            size="small"
            onClick={() => testTheme(ticker)}
          >
            Test {ticker}
          </Button>
        ))}
      </Box>

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Typography variant="body2" sx={{ width: '100%', mb: 1 }}>
          <strong>Color Swatches:</strong>
        </Typography>
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'primary.main',
            border: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'primary.contrastText'
          }}
        >
          P
        </Box>
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'secondary.main',
            border: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'secondary.contrastText'
          }}
        >
          S
        </Box>
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: (muiTheme.palette as any).tertiary?.main ?? 'grey.500',
            border: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: (muiTheme.palette as any).tertiary?.contrastText ?? 'white'
          }}
        >
          T
        </Box>
      </Box>
    </Box>
  )
}
