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

    // Truncate all tables in correct order with CASCADE
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
