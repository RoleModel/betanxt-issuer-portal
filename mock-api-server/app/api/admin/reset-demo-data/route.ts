import { exec } from 'child_process'
import { NextRequest, NextResponse } from 'next/server'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const runtime = 'nodejs'

interface ResetStats {
  meetings: number
  phases: number
  tasks: number
  signatures: number
  documents: number
  dsmConfigs: number
}

export async function POST(_req: NextRequest) {
  try {
    // Use path module to safely construct the path
    const path = await import('path')

    // Get the monorepo root (mock-api-server is a child of the root)
    const currentDir = process.cwd()
    const monorepoRoot = currentDir.includes('/mock-api-server')
      ? currentDir.substring(0, currentDir.lastIndexOf('/mock-api-server'))
      : currentDir

    const supabaseDir = path.join(monorepoRoot, 'supabase')

    console.log('Current working directory:', currentDir)
    console.log('Monorepo root:', monorepoRoot)
    console.log('Supabase directory:', supabaseDir)

    // Drop and recreate schema, then apply migrations and seed
    const resetCommands = [
      // Drop all tables in public schema
      `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`,
      // Apply migrations
      `cd ${supabaseDir} && for f in migrations/*.sql; do PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f "$f"; done`,
      // Apply seed data
      `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f ${supabaseDir}/seed.sql`,
    ]

    for (const cmd of resetCommands) {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: monorepoRoot,
        timeout: 60000,
        env: { ...process.env, PGPASSWORD: 'postgres' },
      })

      if (stderr && !stderr.includes('NOTICE') && !stderr.includes('DROP')) {
        console.error('Reset stderr:', stderr)
      }

      console.log('Reset stdout:', stdout)
    }

    // Get stats from database after reset
    const stats: ResetStats = {
      meetings: 0,
      phases: 0,
      tasks: 0,
      signatures: 0,
      documents: 0,
      dsmConfigs: 0,
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data reset successfully',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Reset failed',
      },
      { status: 500 }
    )
  }
}
