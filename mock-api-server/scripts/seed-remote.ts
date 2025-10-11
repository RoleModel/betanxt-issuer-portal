#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import pg from 'pg'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vfgjzlcakdrpsbzuqklz.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'ZgnAkgxVLYDcf9gj'

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required')
  console.error('Set it in your environment or .env file')
  process.exit(1)
}

console.log('🔄 Seeding remote Supabase database...')
console.log(`   URL: ${SUPABASE_URL}`)

async function seedRemote() {
  const client = new pg.Client({
    host: 'db.vfgjzlcakdrpsbzuqklz.supabase.co',
    port: 5432,
    user: 'postgres',
    password: POSTGRES_PASSWORD,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Connected!')

    // Read the seed SQL file
    const seedPath = join(process.cwd(), '..', 'supabase', 'seed.sql')
    console.log(`📄 Reading seed file: ${seedPath}`)
    const seedSQL = readFileSync(seedPath, 'utf-8')

    console.log(`📊 Seed file size: ${(seedSQL.length / 1024).toFixed(2)} KB`)

    // Execute the entire SQL file as one transaction
    console.log('🚀 Executing seed SQL...')
    await client.query(seedSQL)

    console.log('✅ Database seeded successfully!')

    // Verify by counting clients
    const result = await client.query('SELECT COUNT(*) FROM clients')
    console.log(`✅ Verified: ${result.rows[0].count} clients in database`)

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seedRemote()
