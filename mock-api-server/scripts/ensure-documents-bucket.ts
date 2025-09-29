#!/usr/bin/env tsx
/**
 * Idempotent setup script to ensure the 'documents' bucket exists.
 * Usage: npx tsx scripts/ensure-documents-bucket.ts
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

async function main() {
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // List buckets
  const { data: buckets, error: listErr } = await admin.storage.listBuckets()
  if (listErr) {
    console.error('Failed to list buckets:', listErr.message)
    process.exit(1)
  }

  const exists = (buckets || []).some((b) => b.name === 'documents')
  if (exists) {
    console.warn('[ensure-documents-bucket] documents bucket already exists.')
    return
  }

  const { data: created, error: createErr } = await admin.storage.createBucket(
    'documents',
    {
      public: true,
    }
  )
  if (createErr) {
    console.error('Failed to create documents bucket:', createErr.message)
    process.exit(1)
  }

  console.warn('[ensure-documents-bucket] Created documents bucket:', created?.name)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
