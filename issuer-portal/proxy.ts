import { NextResponse } from 'next/server'

export function proxy() {
  // Passthrough — auth redirects are handled by NextAuth's authorized callback
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts|logos|images).*)'],
}
