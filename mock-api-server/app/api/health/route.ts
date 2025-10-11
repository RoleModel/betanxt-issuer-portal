import { NextResponse } from 'next/server'

// Next.js API routes should be async even if they don't use await
// eslint-disable-next-line @typescript-eslint/require-await
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'OK' })
}
