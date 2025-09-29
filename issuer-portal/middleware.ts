import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { auth } from '@/authentication/auth-config'

export default auth(async function middleware(request: NextRequest) {
  const { nextUrl } = request
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  if (bypassAuth) {
    return NextResponse.next()
  }

  // @ts-expect-error - NextAuth v5 adds auth to request
  const session = request.auth

  // If no session and not on login page, redirect to login
  if (!session && !nextUrl.pathname.includes('/login')) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl))
  }

  // If session exists and on login page, redirect to home
  if (session && nextUrl.pathname.includes('/login')) {
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  // Check admin routes
  if (session && nextUrl.pathname.startsWith('/user')) {
    if (!session.user?.roles?.includes('ADMIN')) {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
  }

  return NextResponse.next()
})

// Configure which routes require authentication
export const config = {
  matcher: [
    // Protect all routes except login, api/auth, and static files
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
