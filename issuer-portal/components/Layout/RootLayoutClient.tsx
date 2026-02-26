'use client'

import { usePathname } from 'next/navigation'
import type { PropsWithChildren } from 'react'

import Layout from './Layout'

export default function RootLayoutClient({ children }: PropsWithChildren) {
  const pathname = usePathname()

  // Don't show navbar on login page
  const showNavBar = !pathname.startsWith('/login')

  return <Layout navBar={showNavBar}>{children}</Layout>
}
