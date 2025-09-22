import { SessionProvider } from 'next-auth/react'
import React from 'react'

import { ClientProvider } from '@/contexts/ClientContext'

export default function ClientTickerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ClientProvider>
        {children}
      </ClientProvider>
    </SessionProvider>
  )
}
