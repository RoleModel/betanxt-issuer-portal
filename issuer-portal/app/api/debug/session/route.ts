import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  const session = await auth()

  return NextResponse.json({
    session,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
  })
}
