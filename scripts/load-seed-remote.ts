#!/usr/bin/env ts-node
/**
 * Load seed data to remote Supabase database
 * Reads supabase/seed.sql and executes it in chunks
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const CHUNK_SIZE = 1000 // lines per chunk

async function loadSeedData() {
  console.log('📦 Loading seed data to remote Supabase...')
  
  const seedPath = join(process.cwd(), 'supabase', 'seed.sql')
  const seedContent = readFileSync(seedPath, 'utf-8')
  
  // Split by semicolons to get individual statements
  const statements = seedContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`Found ${statements.length} SQL statements`)
  
  // Group statements into chunks
  const chunks: string[][] = []
  for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
    chunks.push(statements.slice(i, i + CHUNK_SIZE))
  }
  
  console.log(`Processing ${chunks.length} chunks...`)
  
  // Note: This script shows the approach
  // You'll need to execute via Supabase CLI or psql
  console.log('\nTo load this data, run:')
  console.log('  supabase db push --include-seed')
  console.log('\nOr use psql directly:')
  console.log('  psql "YOUR_CONNECTION_STRING" -f supabase/seed.sql')
}

loadSeedData().catch(console.error)
