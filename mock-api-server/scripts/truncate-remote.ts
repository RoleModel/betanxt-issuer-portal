#!/usr/bin/env tsx
import { config } from 'dotenv'
import { Client } from 'pg'

// Load environment variables from .env.local
config({ path: '.env.local' })

const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'ZgnAkgxVLYDcf9gj'

async function truncateRemote() {
  const client = new Client({
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.vfgjzlcakdrpsbzuqklz',
    password: POSTGRES_PASSWORD,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    console.log('🔌 Connecting to remote database...')
    await client.connect()
    console.log('✅ Connected!')

    console.log('\n🗑️  Truncating all tables...')

    // Check if tables exist before truncating
    const checkTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `

    const { rows: existingTables } = await client.query(checkTablesQuery)

    if (existingTables.length === 0) {
      console.log('ℹ️  No tables found - database is already empty')
      return
    }

    console.log(`Found ${existingTables.length} tables to truncate`)

    // Truncate all tables in correct order with CASCADE
    // Tables are already verified to exist above
    const truncateQuery = `
      TRUNCATE TABLE
        signature,
        document_history,
        dsm_config,
        digital_shareholder_meeting,
        tabulation_report,
        comment,
        notification,
        position_vote,
        position,
        proposal,
        document,
        task,
        phase,
        mailing,
        meeting,
        "user",
        account,
        clients
      CASCADE;
    `

    await client.query(truncateQuery)
    console.log('✅ All tables truncated successfully!')
  } catch (error) {
    console.error('❌ Truncate failed:', error)
    process.exit(1)
  } finally {
    try {
      await client.end()
    } catch (endError) {
      // Ignore connection termination errors - expected after TRUNCATE CASCADE
      if (endError && typeof endError === 'object' && 'code' in endError) {
        const code = (endError as { code?: string }).code
        if (code !== '57P01' && code !== 'ECONNRESET') {
          console.error('⚠️  Warning: Error closing connection:', endError)
        }
      }
    }
  }
}

// Handle connection termination errors from Supabase pooler
const handleConnectionError = (error: unknown): boolean => {
  const errorStr = String(error)
  if (
    errorStr.includes('db_termination') ||
    errorStr.includes('shutdown') ||
    errorStr.includes('ECONNRESET') ||
    errorStr.includes('57P01')
  ) {
    // Expected - Supabase pooler terminates connections
    return true
  }
  return false
}

process.on('uncaughtException', (error) => {
  if (handleConnectionError(error)) {
    process.exit(0)
  }
  console.error('Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  if (handleConnectionError(error)) {
    process.exit(0)
  }
  console.error('Unhandled rejection:', error)
  process.exit(1)
})

truncateRemote().catch((error) => {
  // Don't fail for connection termination errors - they're expected after TRUNCATE
  const errorStr = String(error)
  if (
    errorStr.includes('db_termination') ||
    errorStr.includes('shutdown') ||
    errorStr.includes('ECONNRESET') ||
    errorStr.includes('57P01')
  ) {
    console.log('ℹ️  Database connection terminated (expected after TRUNCATE)')
    process.exit(0)
  }
  console.error('Truncate failed:', error)
  process.exit(1)
})
