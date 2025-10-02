import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { SessionProvider } from 'next-auth/react'
import { Roboto, Roboto_Condensed } from 'next/font/google'
import localFont from 'next/font/local'
import React from 'react'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import type { } from '@mui/material/themeCssVarsAugmentation'
import { GlobalStyles } from '@mui/material'

import '@/components/Documents/react-pdf.css'

import ThemeRegistry from '@/components/mui-styling/ThemeRegistry'

import { ClientProvider } from '@/contexts/ClientContext'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
  preload: true,
})

const robotoCondensed = Roboto_Condensed({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-condensed',
  preload: true,
})

const Tungsten = localFont({
  src: [
    { path: '../public/fonts/Tungsten.woff2', weight: '400' },
    { path: '../public/fonts/Tungsten-Medium.woff2', weight: '500' },

  ],
  variable: '--font-tungsten',
  display: 'swap',
  preload: true,
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${robotoCondensed.variable} ${Tungsten.variable}`}
    >
      <GlobalStyles
        styles={{
          'html, body': {
            height: '100%',
          },
        }}
      />
      <body>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider>
          <SessionProvider>
            <ClientProvider>
              <ThemeRegistry>
                {children}
              </ThemeRegistry>
            </ClientProvider>
          </SessionProvider>
        </AppRouterCacheProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
