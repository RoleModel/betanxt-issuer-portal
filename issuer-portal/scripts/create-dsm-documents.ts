import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const meetingIds = [
  'elvn-annual-meeting-2025',
  'payc-annual-meeting-2025',
  'wen-annual-meeting-2025',
  'wwd-annual-meeting-2025',
]

async function createDSMDocuments() {
  console.log('📄 Creating DSM document records...\n')

  for (const meetingId of meetingIds) {
    console.log(`\n📁 Processing ${meetingId}...`)

    // List all directories for this meeting
    const { data: typeDirs, error: typeDirError } = await supabase.storage
      .from('documents')
      .list(meetingId, { limit: 1000 })

    if (typeDirError) {
      console.error(`❌ Error listing directories for ${meetingId}:`, typeDirError)
      continue
    }

    // Filter to only directories (no file extension)
    const directories = typeDirs?.filter((item) => !item.name.includes('.')) || []

    for (const dir of directories) {
      const dirPath = `${meetingId}/${dir.name}`

      // List files in this directory
      const { data: files, error: fileError } = await supabase.storage
        .from('documents')
        .list(dirPath, { limit: 1000 })

      if (fileError) {
        console.error(`❌ Error listing files in ${dirPath}:`, fileError)
        continue
      }

      // Process each file
      const actualFiles = files?.filter((item) => item.name.includes('.')) || []

      for (const file of actualFiles) {
        const fullPath = `${dirPath}/${file.name}`

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fullPath)

        // Determine document type and category based on directory name
        const docType = getDocumentType(dir.name, file.name)
        const displayCategory = getDisplayCategory(dir.name, file.name)

        // Extract clean title from filename
        const title = file.name
          .replace(/^\d+_/, '') // Remove timestamp prefix
          .replace(/\.(pdf|docx?|xlsx?|pptx?|mp4|m4a)$/i, '') // Remove extension
          .replace(/_/g, ' ') // Replace underscores with spaces
          .trim()

        // Check if document already exists
        const { data: existingDoc } = await supabase
          .from('document')
          .select('id')
          .eq('meeting_id', meetingId)
          .eq('file_path', urlData.publicUrl)
          .single()

        if (existingDoc) {
          console.log(`✓ Already exists: ${title}`)
          continue
        }

        // Create new document record with generated ID
        const newDoc = {
          id: uuidv4(),
          meeting_id: meetingId,
          title: title,
          type: docType,
          file_path: urlData.publicUrl,
          file_type: file.name.split('.').pop()?.toLowerCase() || 'pdf',
          file_size: file.metadata?.size ?? 0,
          status: displayCategory === 'post-meeting' ? 'COMPLETED' : 'UPLOADED',
          display_category: displayCategory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error: insertError } = await supabase.from('document').insert(newDoc)

        if (insertError) {
          console.error(`❌ Failed to create ${title}: ${insertError.message}`)
        } else {
          console.log(`✅ Created: ${title} (${displayCategory})`)
        }
      }
    }
  }

  // Final count
  const { data: dsmCount } = await supabase
    .from('document')
    .select('meeting_id, type, display_category')
    .in('display_category', ['dsm', 'meeting-materials', 'post-meeting'])
    .like('meeting_id', '%2025%')

  console.log(`\n✨ DSM document creation complete!`)
  console.log(`   Total DSM documents: ${dsmCount?.length ?? 0}`)

  // Group by meeting for summary
  const byMeeting: Record<string, number> = {}
  dsmCount?.forEach((doc) => {
    byMeeting[doc.meeting_id] = (byMeeting[doc.meeting_id] ?? 0) + 1
  })

  console.log('\n📊 Documents by meeting:')
  Object.entries(byMeeting).forEach(([meeting, count]) => {
    console.log(`   ${meeting}: ${count} documents`)
  })
}

function getDocumentType(dirName: string, fileName: string): string {
  // Map directory names to document types
  const typeMapping: Record<string, string> = {
    'shareholder-presentation': 'Shareholder Presentation',
    'intro-slide': 'Intro Slide',
    'meeting-agenda': 'Meeting Agenda',
    'meeting-script': 'Meeting Script',
    'meeting-procedures': 'Meeting Procedures',
    'meeting-minutes': 'Meeting Minutes',
    'meeting-recording': 'Meeting Recording',
    'attendance-report': 'Attendance Report',
    'q&a-document': 'Q&A Document',
    'q-a-document': 'Q&A Document',
    'company-data': 'Company Data',
    'account-registry': 'Account Registry',
    'inspector-oath': 'Inspector Oath',
    'guest-list': 'Guest List',
    'proxy-card': 'Proxy Card',
    'notice-and-access': 'Notice and Access',
    vif: 'Voting Instruction Form',
  }

  if (typeMapping[dirName]) {
    return typeMapping[dirName]
  }

  // Infer from filename if directory doesn't match
  const lowerFile = fileName.toLowerCase()
  if (lowerFile.includes('presentation')) return 'Shareholder Presentation'
  if (lowerFile.includes('slide')) return 'Intro Slide'
  if (lowerFile.includes('agenda')) return 'Meeting Agenda'
  if (lowerFile.includes('script')) return 'Meeting Script'
  if (lowerFile.includes('procedure')) return 'Meeting Procedures'
  if (lowerFile.includes('minutes')) return 'Meeting Minutes'
  if (lowerFile.includes('recording') || lowerFile.includes('archive'))
    return 'Meeting Recording'
  if (lowerFile.includes('attendance')) return 'Attendance Report'
  if (lowerFile.includes('q&a') || lowerFile.includes('qa')) return 'Q&A Document'
  if (lowerFile.includes('oath')) return 'Inspector Oath'
  if (lowerFile.includes('guest')) return 'Guest List'

  // Default to title case of directory name
  return dirName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getDisplayCategory(dirName: string, fileName: string): string {
  const lowerDir = dirName.toLowerCase()
  const lowerFile = fileName.toLowerCase()

  // DSM documents
  if (
    lowerDir.includes('presentation') ||
    lowerDir.includes('slide') ||
    lowerFile.includes('presentation') ||
    lowerFile.includes('slide') ||
    lowerFile.includes('shareholder')
  ) {
    return 'dsm'
  }

  // Post-meeting documents
  if (
    lowerDir.includes('minutes') ||
    lowerDir.includes('recording') ||
    lowerDir.includes('attendance') ||
    lowerDir.includes('archive') ||
    lowerFile.includes('minutes') ||
    lowerFile.includes('recording') ||
    lowerFile.includes('archive') ||
    lowerFile.includes('attendance')
  ) {
    return 'post-meeting'
  }

  // Meeting materials
  if (
    lowerDir.includes('agenda') ||
    lowerDir.includes('script') ||
    lowerDir.includes('procedure') ||
    lowerDir.includes('oath') ||
    lowerDir.includes('guest') ||
    lowerDir.includes('q&a') ||
    lowerDir.includes('q-a') ||
    lowerFile.includes('q&a') ||
    lowerFile.includes('qa')
  ) {
    return 'meeting-materials'
  }

  // Proxy materials
  if (
    lowerDir.includes('proxy') ||
    lowerDir.includes('notice') ||
    lowerDir.includes('vif') ||
    lowerDir.includes('voting')
  ) {
    return 'proxy-materials'
  }

  // Internal documents
  if (
    lowerDir.includes('data') ||
    lowerDir.includes('registry') ||
    lowerDir.includes('account')
  ) {
    return 'internal'
  }

  return 'general'
}

createDSMDocuments().catch(console.error)
