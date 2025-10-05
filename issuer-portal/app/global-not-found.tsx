'use client'

import type { Metadata } from 'next'
import { Roboto, Roboto_Condensed } from 'next/font/google'
import Link from 'next/link'
import React from 'react'

import { Container, Link as MuiLink, Typography } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import type { } from '@mui/material/themeCssVarsAugmentation'
import Layout from '@/components/Layout/Layout'
import BetaNXTThemeProvider from '@/components/mui-styling/ThemeRegistry'

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
})

const robotoCondensed = Roboto_Condensed({
  variable: '--font-roboto-condensed',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
}

export default function RootLayout() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${robotoCondensed.variable}`}>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider>
          <BetaNXTThemeProvider>
            <Layout>
              <Container
                maxWidth="md"
                sx={{
                  p: 3,
                  position: 'relative',
                  height: '80vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="pageTitle"
                  data-error="404"
                  sx={{
                    fontSize: '76px',
                    '&:before': {
                      color: (theme) => `rgba(${theme.vars.palette.primary.mainChannel} / 0.2)`,
                      content: 'attr(data-error)',
                      fontSize: '40vw',
                      fontWeight: 700,
                      textAlign: 'center',
                      left: '50%',
                      position: 'absolute',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '100%',
                      zIndex: 0,
                    },
                  }}
                >
                  404
                </Typography>
                <Typography variant="pageTitle">Sorry, we can&apos;t find that page.</Typography>
                <MuiLink component={Link} href="/" sx={{ zIndex: 1 }}>
                  Return Home
                </MuiLink>
              </Container>
            </Layout>
          </BetaNXTThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
