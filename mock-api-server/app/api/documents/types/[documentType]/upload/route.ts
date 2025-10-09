// AUTO-GENERATED FROM OPENAPI SPEC - DO NOT EDIT MANUALLY
// Generated on 2025-09-30T00:31:43.168Z
// Source: openapi-schema/openapi.yaml
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { createDocument } from '@/domain-models/api/documents'

import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'

interface RouteParams {
  documentType: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const documentType = resolvedParams.documentType

    // Parse multipart form data
    const formData = await request.formData()
    const meetingId = formData.get('meetingId') as string
    const file = formData.get('file') as File
    const versionNotes = formData.get('versionNotes') as string | null
    const taskId = formData.get('taskId') as string | null
    const documentTitle = formData.get('title') as string | null

    if (!meetingId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: meetingId and file are required' },
        { status: 400 }
      )
    }

    // Check file size (25MB limit)
    const MAX_FILE_SIZE = 25 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB' },
        { status: 413 }
      )
    }

    // Upload file to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique file path: documents/{meetingId}/{documentType}/{timestamp}_{rand}.{ext}
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 11)
    const fileExt = file.name.split('.').pop() ?? 'pdf'
    const storagePath = `${meetingId}/${documentType}/${timestamp}_${randomId}.${fileExt}`

    // Upload to Supabase Storage (using service role client to bypass RLS)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Use provided title if available, otherwise create from filename or document type
    const title =
      documentTitle ??
      file.name.replace(/\.[^/.]+$/, '') ??
      documentType.replace(/-/g, ' ')

    // Create document record with storage path
    const { data, error } = await createDocument(meetingId, {
      title,
      type: documentType,
      file: uploadData.path, // Store the storage path, not base64
      description: versionNotes || undefined,
      taskId: taskId || undefined,
    } as components['schemas']['CreateDocumentRequest'])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Document created but no data returned' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[Upload Route Error]:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : 'Unknown error',
        operationId: 'uploadDocumentVersion',
      },
      { status: 500 }
    )
  }
}
