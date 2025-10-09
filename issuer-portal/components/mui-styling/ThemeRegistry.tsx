'use client'

import * as React from 'react'

import CssBaseline from '@mui/material/CssBaseline'

import { DynamicThemeProvider } from './DynamicThemeProvider'
import { NextAppDirEmotionCacheProvider } from './EmotionCache'

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <DynamicThemeProvider>
        <CssBaseline enableColorScheme />
        {children}
      </DynamicThemeProvider>
    </NextAppDirEmotionCacheProvider>
  )
}
