import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Configure which routes require authentication
export const config = {
  matcher: [
    // Protect all routes except login, api/auth, and static files
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
