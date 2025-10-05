import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { nextUrl } = request
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  if (bypassAuth) {
    return NextResponse.next()
  }

  let token = null

  try {
    // Get session token using JWT
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'development-secret-please-change-in-production',
      secureCookie: process.env.NODE_ENV === 'production',
    })
  } catch (error) {
    console.error('Error getting token:', error)
    // On error, redirect to login for safety
    if (!nextUrl.pathname.includes('/login')) {
      const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl))
    }
  }

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
    const roles = Array.isArray(token.roles) ? token.roles : []
    if (!roles.includes('ADMIN')) {
      return NextResponse.redirect(new URL('/', nextUrl))
    }
  }

  return NextResponse.next()
}

// Configure which routes require authentication
export const config = {
  matcher: [
    // Protect all routes except login, api/auth, and static files
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
