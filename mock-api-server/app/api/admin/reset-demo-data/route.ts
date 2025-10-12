import { readFile, readdir } from 'fs/promises'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import path from 'path'
import { Client } from 'pg'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for reset operations

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
    // Get database connection string from environment
    const databaseUrl =
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

    console.log('Starting database reset...')
    console.log('Using database:', databaseUrl.replace(/:[^:@]+@/, ':****@'))

    const isLocalhost =
      databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')

    // Configure SSL for remote connections
    const originalTlsReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED
    if (!isLocalhost) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }

    try {
      client = new Client({
        connectionString: databaseUrl,
        ssl: !isLocalhost ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 30000,
      })

      console.log('Connecting to database...')
      await client.connect()
      console.log('Database connection established')

      // Step 1: Drop and recreate public schema
      console.log('Dropping public schema...')
      await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;')
      console.log('Public schema recreated')

      // Step 2: Apply migrations from bundled data directory
      console.log('Applying migrations...')
      const dataDir = path.join(process.cwd(), 'data')
      const migrationsDir = path.join(dataDir, 'migrations')

      const migrationFiles = await readdir(migrationsDir)
      const sqlMigrations = migrationFiles.filter((f) => f.endsWith('.sql')).sort()

      for (const migrationFile of sqlMigrations) {
        console.log(`  Applying migration: ${migrationFile}`)
        const migrationPath = path.join(migrationsDir, migrationFile)
        const migrationSql = await readFile(migrationPath, 'utf-8')
        await client.query(migrationSql)
      }

      console.log(`Applied ${sqlMigrations.length} migrations`)

      // Step 3: Apply seed data from bundled data directory
      console.log('Applying seed data...')
      const seedPath = path.join(dataDir, 'seed.sql')
      const seedSql = await readFile(seedPath, 'utf-8')

      // Execute seed SQL
      await client.query(seedSql)
      console.log('Seed data applied')

      // Get stats from database
      const meetingsResult = await client.query('SELECT COUNT(*) FROM meeting')
      const phasesResult = await client.query('SELECT COUNT(*) FROM phase')
      const tasksResult = await client.query('SELECT COUNT(*) FROM task')
      const documentsResult = await client.query('SELECT COUNT(*) FROM document')

      const stats: ResetStats = {
        meetings: parseInt(meetingsResult.rows[0].count),
        phases: parseInt(phasesResult.rows[0].count),
        tasks: parseInt(tasksResult.rows[0].count),
        signatures: 0,
        documents: parseInt(documentsResult.rows[0].count),
        dsmConfigs: 0,
      }

      console.log('Database reset completed successfully:', stats)

      return NextResponse.json({
        success: true,
        message: 'Demo data reset successfully',
        stats,
        timestamp: new Date().toISOString(),
      })
    } finally {
      // Restore original TLS setting
      if (!isLocalhost) {
        if (originalTlsReject !== undefined) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsReject
        } else {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
        }
      }
    }
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
      try {
        await client.end()
      } catch (endError) {
        console.error('Error closing connection:', endError)
      }
    }
  }
}
