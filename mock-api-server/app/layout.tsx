import type { ReactNode, JSX } from 'react'

// This is a minimal layout file required by Next.js 13+ app directory
// It's not used since this is an API-only server
export default function RootLayout({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}