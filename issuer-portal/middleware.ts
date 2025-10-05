import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Temporary: Disable middleware until Edge Runtime issues are resolved
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
