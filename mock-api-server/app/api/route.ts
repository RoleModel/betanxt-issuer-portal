import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Mock API Server',
    status: 'running',
    endpoints: '/api/*'
  })
}