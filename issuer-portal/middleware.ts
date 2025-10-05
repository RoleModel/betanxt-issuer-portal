import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextAuthConfig } from 'next-auth'

// Minimal NextAuth config for Edge Runtime middleware
const authConfig = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-please-change-in-production',
  providers: [],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  if (bypassAuth) {
    return NextResponse.next()
  }

  const token = req.auth

  // If no session and not on login page, redirect to login
  if (!token && !nextUrl.pathname.includes('/login')) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl))
  }

  // If session exists and on login page, redirect to home
  if (token && nextUrl.pathname.includes('/login')) {
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  // Check admin routes
  if (token && nextUrl.pathname.startsWith('/user')) {
    const roles = Array.isArray((token as any).user?.roles) ? (token as any).user.roles : []
    if (!roles.includes('ADMIN')) {
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
