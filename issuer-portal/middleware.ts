import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  // Check if auth bypass is enabled
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  if (bypassAuth) {
    return NextResponse.next()
  }

  // Simple client-side routing - let NextAuth handle authentication
  // This avoids Edge Runtime compatibility issues

  // Allow all requests to pass through for now
  // Authentication will be handled by NextAuth SessionProvider on the client side
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Temporarily disabled to avoid Edge Runtime issues
    // Re-enable when Edge Runtime compatibility is resolved
    // '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
