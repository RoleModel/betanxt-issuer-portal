import { NextResponse } from 'next/server'

/**
 * Handle CORS for API routes
 * This function creates an OPTIONS handler for API routes
 */
export function handleCors() {
  const response = new NextResponse(null, { status: 200 })
  const origin = '*' // Allow all origins in development

  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version'
  )
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

/**
 * Add CORS headers to a NextResponse
 */
export function withCors(response: NextResponse, origin = '*') {
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}
