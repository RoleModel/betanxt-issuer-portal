import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
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

async function executeWithRetry(
  client: Client,
  query: string,
  maxRetries = 3
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.query(query)
      return
    } catch (error) {
      if (i === maxRetries - 1) throw error
      console.log(`Retry ${i + 1}/${maxRetries} after error:`, error)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
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
        query_timeout: 300000, // 5 minutes
      })

      console.log('Connecting to database...')
      await client.connect()
      console.log('Database connection established')

      // Step 1: Truncate all data tables (preserve schema)
      // Note: TRUNCATE CASCADE is atomic and will rollback automatically on error
      console.log('Truncating data tables...')
      await executeWithRetry(
        client,
        `
        TRUNCATE TABLE
          signature,
          document_history,
          comment,
          mailing,
          position_vote,
          position,
          proposal,
          task,
          document,
          digital_shareholder_meeting,
          dsm_config,
          phase,
          meeting,
          account,
          clients,
          notification,
          tabulation_report,
          "user"
        RESTART IDENTITY CASCADE;
      `
      )
      console.log('Data tables truncated')

      // Step 2: Fetch seed data from Supabase storage
      console.log('Fetching seed data from Supabase storage...')
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfgjzlcakdrpsbzuqklz.supabase.co'
      const seedUrl = `${supabaseUrl}/storage/v1/object/public/documents/backup.sql`

      console.log('Fetching from:', seedUrl)
      const seedResponse = await fetch(seedUrl)

      if (!seedResponse.ok) {
        throw new Error(
          `Failed to fetch seed data: ${seedResponse.status} ${seedResponse.statusText}`
        )
      }

      const seedSql = await seedResponse.text()
      console.log(`Seed SQL size: ${(seedSql.length / 1024 / 1024).toFixed(2)} MB`)

      // Step 3: Execute seed SQL
      // The seed.sql file contains a transaction (BEGIN...COMMIT) so it's atomic
      console.log('Applying seed data...')
      await executeWithRetry(client, seedSql)
      console.log('Seed data applied')

      // Step 4: Grant permissions
      console.log('Granting permissions...')
      await client.query(
        'GRANT ALL ON SCHEMA public TO anon, authenticated, service_role'
      )
      await client.query(
        'GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role'
      )
      await client.query(
        'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role'
      )
      console.log('Permissions granted')

      // Step 5: Get stats from database
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
        details: error instanceof Error ? error.stack : undefined,
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
