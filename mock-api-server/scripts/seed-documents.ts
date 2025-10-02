#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Unified document seeding script
 * Uploads PDF documents from data directories to Supabase storage and links them to database records
 *
 * Usage:
 *   npm run seed:documents              # Upload all documents
 *   npm run seed:documents -- --link    # Link existing storage files to database
 *   npm run seed:documents -- --clean   # Clean all documents before uploading
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import type { Stats } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Client configuration
const clientMapping = {
  enliven: {
    ticker: 'ELVN',
    meetingId: 'elvn-annual-meeting-2025',
    meetingDate: '2025-06-24',
  },
  paycom: {
    ticker: 'PAYC',
    meetingId: 'payc-annual-meeting-2025',
    meetingDate: '2025-05-05',
  },
  wendys: {
    ticker: 'WEN',
    meetingId: 'wen-annual-meeting-2025',
    meetingDate: '2025-05-21',
  },
  woodward: {
    ticker: 'WWD',
    meetingId: 'wwd-annual-meeting-2025',
    meetingDate: '2025-01-29',
  },
}

type DocumentCategory =
  | 'general'
  | 'dsm'
  | 'proxy-materials'
  | 'meeting-materials'
  | 'post-meeting'
  | 'internal'

type DocumentTypeMapping = {
  type: string
  displayCategory: DocumentCategory
  title?: string
  status?: string
}

// Document type mappings based on filename patterns
const documentMappings: Record<string, DocumentTypeMapping> = {
  // Proxy materials - all APPROVED
  proxy_statement: {
    type: 'Proxy Statement',
    displayCategory: 'proxy-materials',
    status: 'APPROVED',
  },
  annual_report: {
    type: 'Annual Report',
    displayCategory: 'proxy-materials',
    status: 'APPROVED',
  },
  _naa_proof: {
    type: 'Notice and Access',
    displayCategory: 'proxy-materials',
    title: 'Notice of Annual Meeting',
    status: 'APPROVED',
  },
  _vif_proof: {
    type: 'VIF',
    displayCategory: 'proxy-materials',
    title: 'Voter Information Form',
    status: 'APPROVED',
  },
  _proxycard_proof: {
    type: 'Proxy Card',
    displayCategory: 'proxy-materials',
    status: 'APPROVED',
  },

  // Meeting materials - all APPROVED
  Agenda: {
    type: 'Meeting Agenda',
    displayCategory: 'meeting-materials',
    status: 'APPROVED',
  },
  Script: {
    type: 'Meeting Script',
    displayCategory: 'meeting-materials',
    status: 'APPROVED',
  },
  Oath: {
    type: 'Inspector Oath',
    displayCategory: 'meeting-materials',
    status: 'APPROVED',
  },

  // DSM documents - all APPROVED
  Presentation: {
    type: 'Shareholder Presentation',
    displayCategory: 'dsm',
    status: 'APPROVED',
  },
  'Intro Slide': { type: 'Intro Slide', displayCategory: 'dsm', status: 'APPROVED' },
  'Annual Meeting': {
    type: 'Shareholder Presentation',
    displayCategory: 'dsm',
    status: 'APPROVED',
  },
  Guest: { type: 'Guest List', displayCategory: 'dsm', status: 'APPROVED' },
  QA: { type: 'Q&A Document', displayCategory: 'dsm', status: 'APPROVED' },
  'Q&A': { type: 'Q&A Document', displayCategory: 'dsm', status: 'APPROVED' },
  Procedures: { type: 'Meeting Procedures', displayCategory: 'dsm', status: 'APPROVED' },
  'Attendance Report': {
    type: 'Attendance Report',
    displayCategory: 'dsm',
    status: 'APPROVED',
  },
  'Final Attendance Report': {
    type: 'Attendance Report',
    displayCategory: 'dsm',
    status: 'APPROVED',
  },

  // Post-meeting documents - all APPROVED
  Minutes: {
    type: 'Meeting Minutes',
    displayCategory: 'post-meeting',
    status: 'APPROVED',
  },
  Archive: {
    type: 'Meeting Recording',
    displayCategory: 'post-meeting',
    status: 'APPROVED',
  },

  // Internal documents - all APPROVED
  'Data.docx': { type: 'Company Data', displayCategory: 'internal', status: 'APPROVED' },
  'Registered Account': {
    type: 'Account Registry',
    displayCategory: 'internal',
    status: 'APPROVED',
  },
}

function determineDocumentType(filename: string): DocumentTypeMapping | null {
  // Check each pattern against the filename
  for (const [pattern, mapping] of Object.entries(documentMappings)) {
    if (filename.toLowerCase().includes(pattern.toLowerCase())) {
      return mapping
    }
  }

  // Default to general category if no match
  return {
    type: 'General Document',
    displayCategory: 'general',
    status: 'APPROVED',
  }
}

function getCleanTitle(filename: string, docType: DocumentTypeMapping): string {
  // Use custom title if provided
  if (docType.title) return docType.title

  // Clean up the filename
  const cleanName = filename
    .replace(/\.(pdf|docx?|xlsx?|pptx?|mp4|m4a)$/i, '') // Remove extension
    .replace(/^\d+[\s._-]+/, '') // Remove leading numbers
    .replace(/[._-]/g, ' ') // Replace delimiters with spaces
    .trim()

  return cleanName || docType.type
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    mp4: 'video/mp4',
    m4a: 'audio/mp4',
  }
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
}

async function cleanDocuments() {
  console.log('🧹 Cleaning existing documents...\n')

  // Delete all documents from database
  const { error: deleteError } = await supabase
    .from('document')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (dummy condition)

  if (deleteError && !deleteError.message.includes('no rows')) {
    console.error('Failed to clean documents:', deleteError)
    return false
  }

  // List and delete all files from storage
  const { data: files } = await supabase.storage
    .from('documents')
    .list('', { limit: 1000 })

  if (files && files.length > 0) {
    const paths = files.map((f) => f.name)
    const { error: storageError } = await supabase.storage.from('documents').remove(paths)

    if (storageError) {
      console.error('Failed to clean storage:', storageError)
      return false
    }
  }

  console.log('✅ Cleaned all existing documents\n')
  return true
}

async function uploadDocument(
  clientKey: string,
  filename: string,
  filePath: string,
  fileStats: Stats
): Promise<boolean> {
  const client = clientMapping[clientKey as keyof typeof clientMapping]
  if (!client) {
    console.log(`⚠️  Unknown client: ${clientKey}`)
    return false
  }

  const docType = determineDocumentType(filename)
  if (!docType) {
    console.log(`⚠️  No mapping for: ${filename}`)
    return false
  }

  try {
    // Skip non-document files
    const ext = filename.split('.').pop() || ''
    const supportedExts = [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'mp4',
      'm4a',
    ]
    if (!supportedExts.includes(ext.toLowerCase())) {
      console.log(`   Skipping unsupported file type: ${filename}`)
      return false
    }

    const fileBuffer = readFileSync(filePath)
    const timestamp = Date.now()
    const storagePath = `${client.meetingId}/${docType.type.toLowerCase().replace(/\s+/g, '-')}/${timestamp}_${filename}`

    console.log(`📤 Uploading: ${filename}`)
    console.log(`   Client: ${client.ticker}`)
    console.log(`   Type: ${docType.type}`)
    console.log(`   Category: ${docType.displayCategory}`)
    console.log(`   Storage Path: ${storagePath}`)

    // Upload to storage
    console.log(`   Uploading ${(fileStats.size / 1024 / 1024).toFixed(2)}MB file...`)
    const { data: storageData, error: storageError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: getMimeType(ext),
        upsert: true, // Allow overwriting
      })

    if (storageError) {
      console.error(`❌ Storage error for ${filename}: ${storageError.message}`)
      console.error(`   Full error:`, storageError)
      return false
    }

    console.log(`   ✓ Uploaded to storage: ${storageData?.path || storagePath}`)

    // Get public URL
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath)

    // Create database record with generated ID
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Calculate document dates relative to meeting date
    const meetingDate = new Date(client.meetingDate)
    const daysBeforeMeeting = Math.floor(Math.random() * 30) + 10 // 10-40 days before meeting
    const docDate = new Date(meetingDate)
    docDate.setDate(docDate.getDate() - daysBeforeMeeting)

    const { data: docData, error: docError } = await supabase
      .from('document')
      .insert({
        id: docId,
        meeting_id: client.meetingId,
        title: getCleanTitle(filename, docType),
        type: docType.type,
        display_category: docType.displayCategory,
        file_path: urlData.publicUrl,
        file_type: ext.toUpperCase(),
        file_size: fileStats.size,
        status: docType.status || 'APPROVED',
        created_at: docDate.toISOString(),
        updated_at: docDate.toISOString(),
      })
      .select()
      .single()

    if (docError) {
      console.error(`❌ Database error: ${docError.message}`)
      return false
    }

    console.log(`✅ Uploaded: ${docData.title}`)
    return true
  } catch (error) {
    console.error(`❌ Error uploading ${filename}:`, error)
    return false
  }
}

async function uploadClientDocuments(clientKey: string): Promise<number> {
  const dataDir = join(process.cwd(), '..', 'data', clientKey)

  // Check if directory exists
  if (!existsSync(dataDir)) {
    console.log(`⚠️  Directory not found: ${dataDir}`)
    return 0
  }

  console.log(`\n📁 Processing ${clientKey.toUpperCase()}...`)

  let uploadCount = 0
  try {
    const files = readdirSync(dataDir)
    console.log(`   Found ${files.length} files in ${clientKey} directory`)

    for (const file of files) {
      // Skip hidden files, CSV files, and directories
      if (file.startsWith('.') || file.endsWith('.csv')) {
        console.log(`   Skipping: ${file}`)
        continue
      }

      const filePath = join(dataDir, file)
      const fileStats = statSync(filePath)

      if (fileStats.isFile()) {
        const success = await uploadDocument(clientKey, file, filePath, fileStats)
        if (success) uploadCount++
      }
    }
  } catch (error) {
    console.error(`❌ Error processing ${clientKey}:`, error)
  }

  console.log(`   Uploaded ${uploadCount} files for ${clientKey}`)
  return uploadCount
}

async function linkExistingDocuments() {
  console.log('🔗 Linking existing storage files to database...\n')

  // Get all files from storage
  const { data: files, error } = await supabase.storage
    .from('documents')
    .list('', { limit: 1000 })

  if (error) {
    console.error('Failed to list storage files:', error)
    return
  }

  console.log(`Found ${files?.length || 0} files in storage`)

  let linkedCount = 0
  for (const file of files || []) {
    const pathParts = file.name.split('/')
    if (pathParts.length < 3) continue

    const meetingId = pathParts[0]
    const docTypeFolder = pathParts[1]
    const filename = pathParts[2]

    const docType = determineDocumentType(filename) || {
      type: docTypeFolder
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      displayCategory: 'general' as DocumentCategory,
      status: 'APPROVED',
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(file.name)

    const { error: upsertError } = await supabase.from('document').upsert({
      meeting_id: meetingId,
      title: getCleanTitle(filename, docType),
      type: docType.type,
      display_category: docType.displayCategory,
      file_path: urlData.publicUrl,
      file_type: (filename.split('.').pop() || 'pdf').toUpperCase(),
      status: docType.status || 'APPROVED',
      updated_at: new Date().toISOString(),
    })

    if (!upsertError) {
      linkedCount++
      console.log(`✅ Linked: ${filename}`)
    } else {
      console.error(`❌ Failed to link ${filename}:`, upsertError.message)
    }
  }

  console.log(`\n✨ Linked ${linkedCount} documents`)
}

async function main() {
  const args = process.argv.slice(2)
  const shouldClean = args.includes('--clean')
  const shouldLink = args.includes('--link')

  console.log('🚀 Document Seeding Tool\n')
  console.log(`   Supabase URL: ${supabaseUrl}`)
  console.log(
    `   Mode: ${shouldLink ? 'Link existing' : shouldClean ? 'Clean & upload' : 'Upload only'}\n`
  )

  // Link existing files if requested
  if (shouldLink) {
    await linkExistingDocuments()
    return
  }

  // Clean if requested
  if (shouldClean) {
    const cleaned = await cleanDocuments()
    if (!cleaned) {
      console.error('❌ Failed to clean documents, aborting...')
      return
    }
  }

  // Upload documents from data directories
  let totalUploaded = 0
  for (const clientKey of Object.keys(clientMapping)) {
    const count = await uploadClientDocuments(clientKey)
    totalUploaded += count
  }

  // Only process documents from /data directories

  console.log(`\n✨ Upload complete! Total documents: ${totalUploaded}`)

  // Show summary
  const { count } = await supabase
    .from('document')
    .select('*', { count: 'exact', head: true })

  console.log(`\n📊 Database Summary:`)
  console.log(`   Total documents: ${count}`)
}

// Run the script
main().catch(console.error)
