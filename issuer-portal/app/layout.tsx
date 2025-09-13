import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Roboto, Roboto_Condensed } from 'next/font/google'
import React from 'react'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import type { } from '@mui/material/themeCssVarsAugmentation'

import ThemeRegistry from '@/components/mui-styling/ThemeRegistry'


const roboto = Roboto({
  variable: '--font-roboto',
  display: 'swap',
  subsets: ['latin'],
  preload: true,
  weight: ['300', '400', '500', '700'], // Only load needed weights
})

const robotoCondensed = Roboto_Condensed({
  variable: '--font-roboto-condensed',
  display: 'swap',
  subsets: ['latin'],
  preload: true,
  weight: ['400', '500', '700'], // Only load needed weights
})

export const viewport: Viewport = {
  themeColor: 'var(--mui-palette-primary-main)',
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
}

export const metadata: Metadata = {
  title: 'BetaNXT Issuer Portal',
  description: 'Proxy event management portal.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${robotoCondensed.variable}`}>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
