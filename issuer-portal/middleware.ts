import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import authConfig from './auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  if (bypassAuth) {
    return NextResponse.next()
  }

  const isAuthenticated = !!req.auth

  // If no session and not on login page, redirect to login
  if (!isAuthenticated && !nextUrl.pathname.includes('/login')) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl))
  }

  // If session exists and on login page, redirect to home
  if (isAuthenticated && nextUrl.pathname.includes('/login')) {
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  // Check admin routes
  if (isAuthenticated && nextUrl.pathname.startsWith('/user')) {
    const roles = Array.isArray(req.auth?.user?.roles) ? req.auth.user.roles : []
    if (!roles.includes('ADMIN')) {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Protect all routes except login, api/auth, and static files
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
