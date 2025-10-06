import { readFile, readdir } from 'fs/promises'
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import path from 'path'
import { Client } from 'pg'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds for reset operations

interface ResetStats {
  meetings: number
  phases: number
  tasks: number
  signatures: number
  documents: number
  dsmConfigs: number
}

export async function POST(_req: NextRequest) {
  let client: Client | null = null

  try {
    // Get database connection string
    // In development: use local connection
    // In production: use DATABASE_URL from Vercel
    const databaseUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

    console.log('Connecting to database...')
    client = new Client({ connectionString: databaseUrl })
    await client.connect()

    // Get the monorepo root (mock-api-server is a child of the root)
    const currentDir = process.cwd()
    const monorepoRoot = currentDir.includes('/mock-api-server')
      ? currentDir.substring(0, currentDir.lastIndexOf('/mock-api-server'))
      : currentDir

    const supabaseDir = path.join(monorepoRoot, 'supabase')

    console.log('Starting database reset...')

    // Step 1: Drop all tables in public schema
    console.log('Dropping public schema...')
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')

    // Step 2: Apply migrations in order
    console.log('Applying migrations...')
    const migrationsDir = path.join(supabaseDir, 'migrations')
    const migrationFiles = await readdir(migrationsDir)
    const sqlMigrations = migrationFiles.filter((f) => f.endsWith('.sql')).sort()

    for (const migrationFile of sqlMigrations) {
      console.log(`Applying migration: ${migrationFile}`)
      const migrationPath = path.join(migrationsDir, migrationFile)
      const migrationSql = await readFile(migrationPath, 'utf-8')

      await client.query(migrationSql)
    }

    // Step 3: Apply seed data
    console.log('Applying seed data...')
    const seedPath = path.join(supabaseDir, 'seed.sql')
    const seedSql = await readFile(seedPath, 'utf-8')

    await client.query(seedSql)

    // Get stats from database after reset
    const stats: ResetStats = {
      meetings: 0,
      phases: 0,
      tasks: 0,
      signatures: 0,
      documents: 0,
      dsmConfigs: 0,
    }

    console.log('Database reset completed successfully')

    // Trigger Vercel redeploy if deploy hook is configured
    if (process.env.VERCEL_DEPLOY_HOOK_URL) {
      console.log('Triggering Vercel redeploy...')
      try {
        const deployResponse = await fetch(process.env.VERCEL_DEPLOY_HOOK_URL, {
          method: 'POST',
        })

        if (deployResponse.ok) {
          console.log('Vercel redeploy triggered successfully')
          return NextResponse.json({
            success: true,
            message: 'Demo data reset successfully. Redeploying application...',
            stats,
            timestamp: new Date().toISOString(),
            redeployTriggered: true,
          })
        } else {
          console.warn('Failed to trigger redeploy:', await deployResponse.text())
        }
      } catch (deployError) {
        console.error('Deploy hook error:', deployError)
        // Don't fail the reset if deploy hook fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data reset successfully',
      stats,
      timestamp: new Date().toISOString(),
      redeployTriggered: false,
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
  } finally {
    if (client) {
      await client.end()
    }
  }
}
