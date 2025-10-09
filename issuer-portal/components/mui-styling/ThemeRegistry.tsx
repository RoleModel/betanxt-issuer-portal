'use client'

import * as React from 'react'

import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';


import { DynamicThemeProvider } from './DynamicThemeProvider'
import { NextAppDirEmotionCacheProvider } from './EmotionCache'

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <DynamicThemeProvider>
        <ScopedCssBaseline enableColorScheme />
        {children}
      </DynamicThemeProvider>
    </NextAppDirEmotionCacheProvider>
  )
}
