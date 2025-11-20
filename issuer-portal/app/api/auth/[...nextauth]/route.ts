import type { NextRequest } from 'next/server'
import { GET as authGET, POST as authPOST } from '@/auth'

export async function GET(
  request: NextRequest,
  _context: { params: Promise<{ nextauth: string[] }> }
) {
  return authGET(request as unknown as Parameters<typeof authGET>[0])
}

export async function POST(
  request: NextRequest,
  _context: { params: Promise<{ nextauth: string[] }> }
) {
  return authPOST(request as unknown as Parameters<typeof authPOST>[0])
}
