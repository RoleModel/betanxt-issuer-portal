import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'

/**
 * Serves the seed.sql file for database resets
 * This endpoint is used by the reset-demo-data route to fetch seed data
 *
 * Note: This works on Vercel because the seed.sql file is included in the deployment
 */
export async function GET() {
  try {
    // In Vercel, files are available at /var/task/
    // In development, they're in the project root
    const seedPath = process.env.VERCEL
      ? join(process.cwd(), '..', 'supabase', 'seed.sql')
      : join(process.cwd(), '..', 'supabase', 'seed.sql')

    const seedContent = await readFile(seedPath, 'utf-8')

    return new NextResponse(seedContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Failed to read seed.sql:', error)
    return NextResponse.json(
      {
        error: 'Failed to read seed.sql file',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
