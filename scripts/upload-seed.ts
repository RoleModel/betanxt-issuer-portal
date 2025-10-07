#!/usr/bin/env ts-node
/**
 * Upload backup.sql to Supabase Storage
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = 'https://vfgjzlcakdrpsbzuqklz.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set')
  console.error('Get the service role key from: https://supabase.com/dashboard/project/vfgjzlcakdrpsbzuqklz/settings/api')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function uploadBackup() {
  console.log('📦 Uploading backup.sql to Supabase Storage...')

  const backupPath = join(process.cwd(), 'supabase', 'backup.sql')
  const backupContent = readFileSync(backupPath, 'utf-8')
  const backupBuffer = Buffer.from(backupContent, 'utf-8')

  console.log(`Backup file size: ${(backupBuffer.length / 1024 / 1024).toFixed(2)} MB`)

  // Upload to documents bucket (now configured to accept text/plain)
  const { data, error } = await supabase.storage
    .from('documents')
    .upload('backup.sql', backupBuffer, {
      contentType: 'text/plain',
      upsert: true,
    })

  if (error) {
    console.error('Upload error:', error)
    process.exit(1)
  }

  console.log('✅ Upload successful:', data)

  // Get public URL
  const { data: urlData } = supabase.storage.from('documents').getPublicUrl('backup.sql')

  console.log('\n📍 Backup URL:', urlData.publicUrl)
  console.log('\nSet this in Vercel environment variables:')
  console.log(`  SEED_SQL_URL=${urlData.publicUrl}`)

  console.log('\n💡 This URL is permanent and won\'t be affected by branch changes')
}

uploadBackup().catch(console.error)
