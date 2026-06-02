import { Body, Html, Preview } from '@react-email/components'
import React from 'react'

import { COLORS, FONTS } from '../styles'

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="en">
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: COLORS.background,
          fontFamily: FONTS.sans,
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </Body>
    </Html>
  )
}
