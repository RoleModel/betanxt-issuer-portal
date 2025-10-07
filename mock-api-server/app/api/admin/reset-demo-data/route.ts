import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
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

// Fetch seed SQL from remote source to avoid filesystem dependencies on Vercel
async function fetchSeedSQL(): Promise<string> {
  // Try multiple sources in order of preference
  const sources = [
    // 1. Environment variable pointing to hosted seed.sql (Supabase Storage, S3, etc.)
    process.env.SEED_SQL_URL,
    // 2. GitHub raw content URL (if this is a public repo)
    process.env.GITHUB_SEED_SQL_URL,
    // 3. Fallback to a minimal seed for testing
  ].filter(Boolean)

  for (const url of sources) {
    try {
      console.log(`Attempting to fetch seed SQL from: ${url}`)
      const response = await fetch(url as string)
      if (response.ok) {
        const sql = await response.text()
        console.log(`Successfully fetched seed SQL (${sql.length} bytes)`)
        return sql
      }
      console.warn(`Failed to fetch from ${url}: ${response.status}`)
    } catch (error) {
      console.warn(`Error fetching from ${url}:`, error)
    }
  }

  // Minimal fallback seed data for testing
  console.warn('Using minimal fallback seed data')
  return `
-- Clear existing data
DELETE FROM signature;
DELETE FROM "comment";
DELETE FROM notification;
DELETE FROM position_vote;
DELETE FROM "position";
DELETE FROM proposal;
DELETE FROM "document";
DELETE FROM task;
DELETE FROM phase;
DELETE FROM mailing;
DELETE FROM meeting;
DELETE FROM "user";
DELETE FROM account;
DELETE FROM clients;

-- Insert minimal test data
INSERT INTO clients(id, ticker, company_name, short_name, industry, description, website, primary_contact, primary_contact_email, is_active, branding_id, created_at) VALUES
('5b9b7551-a9a6-51df-b593-b05fe06e1d81', 'WEN', 'The Wendy''s Company', 'Wendy''s', 'Restaurants', 'Quick-service restaurant chain', 'https://www.wendys.com', 'Mike Chen', 'mike.chen@wendys.com', true, 966152, NOW());
  `
}

export async function POST(_req: NextRequest) {
  let client: Client | null = null

  try {
    // Get database connection string
    // In development: use local Supabase
    // In production: use DATABASE_URL from Vercel environment
    const databaseUrl =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL || // Vercel Postgres
      process.env.POSTGRES_URL_NON_POOLING || // Vercel Postgres non-pooling
      'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

    console.log('Connecting to database for reset...', {
      hasDATABASE_URL: !!process.env.DATABASE_URL,
      hasPOSTGRES_URL: !!process.env.POSTGRES_URL,
      hasPOSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      databaseUrlPreview: databaseUrl.substring(0, 30) + '...',
    })
    client = new Client({
      connectionString: databaseUrl,
      // Disable SSL verification for self-signed certificates in development
      ssl: databaseUrl.includes('127.0.0.1') || databaseUrl.includes('localhost')
        ? false
        : { rejectUnauthorized: false }
    })
    await client.connect()

    console.log('Starting database reset...')

    // Fetch seed SQL from remote source
    console.log('Fetching seed SQL...')
    const seedSQL = await fetchSeedSQL()

    // Execute seed data (which includes DELETE statements)
    // Note: We're NOT dropping the schema since migrations are already applied
    // in the Vercel/Supabase environment
    console.log('Clearing and re-seeding data...')
    await client.query(seedSQL)

    // Get stats from database after reset
    const [
      meetingsResult,
      phasesResult,
      tasksResult,
      signaturesResult,
      documentsResult,
      dsmConfigsResult,
    ] = await Promise.all([
      client.query('SELECT COUNT(*) FROM meeting'),
      client.query('SELECT COUNT(*) FROM phase'),
      client.query('SELECT COUNT(*) FROM task'),
      client.query('SELECT COUNT(*) FROM signature'),
      client.query('SELECT COUNT(*) FROM document'),
      client.query('SELECT COUNT(*) FROM dsm_config'),
    ])

    const stats: ResetStats = {
      meetings: parseInt(meetingsResult.rows[0]?.count ?? '0'),
      phases: parseInt(phasesResult.rows[0]?.count ?? '0'),
      tasks: parseInt(tasksResult.rows[0]?.count ?? '0'),
      signatures: parseInt(signaturesResult.rows[0]?.count ?? '0'),
      documents: parseInt(documentsResult.rows[0]?.count ?? '0'),
      dsmConfigs: parseInt(dsmConfigsResult.rows[0]?.count ?? '0'),
    }

    console.log('Database reset completed successfully', stats)

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
            message:
              'Demo data reset successfully. Redeploying application to clear caches...',
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
