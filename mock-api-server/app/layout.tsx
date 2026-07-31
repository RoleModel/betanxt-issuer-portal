import type { JSX, ReactNode } from "react";

// This is a minimal layout file required by Next.js 13+ app directory
// It's not used since this is an API-only server
export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
