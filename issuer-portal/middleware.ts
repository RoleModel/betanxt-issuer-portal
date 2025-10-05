import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Temporarily disable auth to verify deployment works
  // TODO: Re-enable authentication after confirming Edge Runtime compatibility
  return NextResponse.next()
}

// Configure which routes require authentication
export const config = {
  matcher: [
    // Protect all routes except login, api/auth, and static files
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
