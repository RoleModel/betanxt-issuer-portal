import crypto from 'crypto'
import { NextRequest } from 'next/server'

import { DOCUMENTS_BUCKET, getServerSupabase } from '@/lib/serverSupabase'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/caching'

export const runtime = 'nodejs'

// Max file size (adjust as needed). OpenAPI lists 413 for too large.
const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25MB

function jsonError(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Signature aligned with generated route validator expectations (params as Promise wrapper)
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ documentType: string }> }
) {
  try {
    const { documentType } = await context.params
    if (!documentType) return jsonError('Missing documentType path param', 400)

    // Expect multipart/form-data
    const formData = await req.formData()
    const meetingId = formData.get('meetingId')?.toString()
    const versionNotes = formData.get('versionNotes')?.toString() || undefined
    const file = formData.get('file') as File | null

    if (!meetingId) return jsonError('meetingId is required', 400)
    if (!file) return jsonError('file is required', 400)

    if (file.size > MAX_FILE_BYTES) return jsonError('File too large', 413)

    // Generate deterministic-ish unique path
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
    const rand = crypto.randomBytes(6).toString('hex')
    const timestamp = Date.now()
    const storagePath = `${meetingId}/${documentType}/${timestamp}_${rand}.${ext}`

    const supabase = getServerSupabase()

    // Read file into Node Buffer for server-side upload (ensures we can later enforce private bucket policies)
    const arrayBuf = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuf)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(storagePath, buffer, {
        cacheControl: '3600',
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError || !uploadData) {
      return jsonError(`Upload failed: ${uploadError?.message || 'unknown error'}`, 500)
    }

    // Get public URL (bucket currently public in dev). Later we may switch to signed URLs.
    const { data: publicUrlData } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(uploadData.path)

    // LEGACY SINGLE TABLE PERSISTENCE (no new tables):
    // If client supplies documentId treat as update; else create new row in existing 'document' table.
    const existingDocumentId = formData.get('documentId')?.toString() || null
    const nowIso = new Date().toISOString()

    // Build history entry (append into JSON array in 'history' column)
    const historyEntry = {
      id: crypto.randomUUID(),
      action: existingDocumentId ? 'UPDATED_FILE' : 'CREATED_FILE',
      user: 'system', // TODO: replace with authenticated user identity
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      timestamp: nowIso,
      notes: versionNotes || null,
    }

    let id = existingDocumentId

    if (!existingDocumentId) {
      id = crypto.randomUUID()
      const { error: insertError } = await supabase.from('document').insert({
        id,
        meeting_id: meetingId,
        title: file.name,
        type: documentType,
        file_path: uploadData.path,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        status: 'UPLOADED',
        uploaded_date: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
        history: [historyEntry],
      })
      if (insertError) {
        return jsonError(`Persist document failed: ${insertError.message}`, 500)
      }
    } else {
      // Fetch existing history to append
      const { data: existingData, error: fetchErr } = await supabase
        .from('document')
        .select('history')
        .eq('id', existingDocumentId)
        .single()
      if (fetchErr) return jsonError(`Load document failed: ${fetchErr.message}`, 500)
      const existingHistory = Array.isArray(existingData?.history)
        ? existingData.history
        : []
      const newHistory = [...existingHistory, historyEntry]
      const { error: updateError } = await supabase
        .from('document')
        .update({
          file_path: uploadData.path,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          status: 'UPLOADED',
          uploaded_date: nowIso,
          updated_at: nowIso,
          history: newHistory,
        })
        .eq('id', existingDocumentId)
      if (updateError) {
        return jsonError(`Update document failed: ${updateError.message}`, 500)
      }
    }

    const responsePayload = {
      id,
      meetingId,
      type: documentType,
      status: 'UPLOADED',
      name: file.name,
      size: file.size,
      uploadedAt: nowIso,
      storagePath: uploadData.path,
      url: publicUrlData.publicUrl,
      versionNotes,
      _meta: {
        provisional: false,
        note: existingDocumentId
          ? 'Document updated in single legacy table.'
          : 'Document created in single legacy table.',
      },
    }

    // Invalidate cached document lists for this meeting (ISR tag approach)
    try {
      revalidateTag(CACHE_TAGS.DOCUMENTS_BY_MEETING(meetingId))
    } catch (e) {
      console.warn('Failed to revalidate documents tag', e)
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Upload route error', err)
    return jsonError('Unhandled server error', 500)
  }
}
