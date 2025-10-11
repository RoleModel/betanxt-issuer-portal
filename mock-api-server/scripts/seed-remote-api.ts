#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env.local
config({ path: '.env.local' })

const SUPABASE_URL =
  (process.env.REMOTE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) ??
  'https://vfgjzlcakdrpsbzuqklz.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ REMOTE_SUPABASE_SERVICE_ROLE_KEY is required')
  console.error('Set it in your environment or .env file')
  console.error(
    'Get it from: https://supabase.com/dashboard/project/vfgjzlcakdrpsbzuqklz/settings/api'
  )
  process.exit(1)
}

console.log('🔄 Seeding remote Supabase database via REST API...')
console.log(`   URL: ${SUPABASE_URL}`)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seedRemote() {
  try {
    // Read the local seed SQL to get data
    const localSeedPath = join(process.cwd(), '..', 'supabase', 'seed.sql')
    console.log(`📄 Reading seed file: ${localSeedPath}`)
    const seedSQL = readFileSync(localSeedPath, 'utf-8')

    console.log(`📊 Seed file size: ${(seedSQL.length / 1024).toFixed(2)} KB`)

    // Instead of parsing SQL, let's just copy data from local to remote
    console.log('🔄 Copying data from local to remote...')

    const localSupabase = createClient(
      'http://127.0.0.1:54321',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    )

    // Tables in order respecting foreign key dependencies
    // Parents must come before children for inserts
    const tables = [
      'clients',
      'account',
      'user',
      'meeting',
      'mailing',
      'phase',
      'task',
      'document',
      'proposal',
      'position',
      'position_vote',
      'notification',
      'comment',
      'tabulation_report',
      'digital_shareholder_meeting',
      'dsm_config',
      'document_history',
      'signature',
    ]

    // Step 1: Clear all tables in reverse order (children first, parents last)
    console.log('\n🗑️  Step 1: Clearing all remote tables...')
    for (const table of [...tables].reverse()) {
      console.log(`   Clearing ${table}...`)
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) {
        console.error(`   ⚠️  Failed to clear ${table}:`, deleteError.message)
      }
    }

    // Step 2: Insert data in forward order (parents first, children last)
    console.log('\n📥 Step 2: Inserting data into remote tables...')
    for (const table of tables) {
      console.log(`\n📋 Processing table: ${table}`)

      // Fetch all data from local
      const { data: localData, error: fetchError } = await localSupabase
        .from(table)
        .select('*')

      if (fetchError) {
        console.error(`⚠️  Failed to fetch from local ${table}:`, fetchError.message)
        continue
      }

      if (!localData || localData.length === 0) {
        console.log(`   ⏭️  Skipping ${table} (no data)`)
        continue
      }

      console.log(`   📊 Found ${localData.length} records`)

      // Insert in batches of 500
      const batchSize = 500
      let inserted = 0

      for (let i = 0; i < localData.length; i += batchSize) {
        const batch = localData.slice(i, i + batchSize)

        const { error: insertError } = await supabase.from(table).insert(batch)

        if (insertError) {
          console.error(
            `   ❌ Failed to insert batch ${i}-${i + batch.length}:`,
            insertError.message
          )
          // Try one by one
          for (const row of batch) {
            const { error } = await supabase.from(table).insert(row)
            if (!error) inserted++
          }
        } else {
          inserted += batch.length
          console.log(`   ✅ Inserted ${inserted}/${localData.length}`)
        }
      }

      console.log(`   ✅ Completed ${table}: ${inserted}/${localData.length} records`)
    }

    console.log('\n✅ Database seeded successfully!')

    // Verify
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    console.log(`✅ Verified: ${count} clients in remote database`)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seedRemote().catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
