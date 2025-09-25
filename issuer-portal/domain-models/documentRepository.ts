import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { getBrowserSupabase } from '@/lib/browserSupabase'

export type Document = components['schemas']['Document']

export interface UploadVersionParams {
  meetingId: string
  documentType: string
  file: File
  versionNotes?: string
}

export interface DocumentRepository {
  listByMeeting(meetingId: string): Promise<Document[]>
  get(id: string): Promise<Document | null>
  uploadVersion(params: UploadVersionParams): Promise<Document | null>
}

class DefaultDocumentRepository implements DocumentRepository {
  async listByMeeting(meetingId: string): Promise<Document[]> {
    // Prefer API (if implemented in mock-api-server) else fallback to direct table query
    try {
      const api = await buildApiClient()
      const result = await api.GET('/meetings/{meetingId}/documents', {
        params: { path: { meetingId } },
      })
      if (!result.error && result.data) {
        return result.data as unknown as Document[]
      }
    } catch (e) {
      // swallow and fallback
      console.warn('listByMeeting API fallback', e)
    }

    const supabase = getBrowserSupabase()
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('meeting_id', meetingId)
    if (error) {
      console.error('Supabase documents query failed', error)
      return []
    }
    return (data || []).map((doc: any) => this.mapRow(doc))
  }

  async get(id: string): Promise<Document | null> {
    try {
      const api = await buildApiClient()
      const res = await api.GET('/documents/{id}', { params: { path: { id } } })
      if (!res.error && res.data) return res.data as unknown as Document
    } catch (e) {
      console.warn('get API fallback', e)
    }
    const supabase = getBrowserSupabase()
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null
    return this.mapRow(data)
  }

  async uploadVersion(params: UploadVersionParams): Promise<Document | null> {
    const { meetingId, documentType, file, versionNotes } = params
    // Use new Next.js route first (server path under /api)
    try {
      const form = new FormData()
      form.append('meetingId', meetingId)
      form.append('file', file)
      if (versionNotes) form.append('versionNotes', versionNotes)
      const resp = await fetch(
        `/api/documents/types/${encodeURIComponent(documentType)}/upload`,
        {
          method: 'POST',
          body: form,
        }
      )
      if (resp.ok) {
        const data = await resp.json()
        return data as Document
      }
      console.warn('Upload route returned non-OK, falling back', resp.status)
    } catch (err) {
      console.warn('Upload route error, falling back to direct storage', err)
    }

    // Fallback: direct storage then create document via API (minimal parity with existing DSM flow)
    const key = `fallback/${meetingId}/${Date.now()}_${file.name}`
    const supabase = getBrowserSupabase()
    const { data: upData, error: upErr } = await supabase.storage
      .from('documents')
      .upload(key, file, {
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      })
    if (upErr || !upData) {
      console.error('Direct storage fallback failed', upErr)
      return null
    }
    try {
      const api = await buildApiClient()
      const createBody = {
        title: file.name,
        type: documentType,
        filePath: upData.path,
        status: 'UPLOADED',
      } as unknown as components['schemas']['CreateDocumentRequest']
      const res = await api.POST('/meetings/{meetingId}/documents', {
        params: { path: { meetingId } },
        body: createBody,
      })
      if (!res.error && res.data) return res.data as unknown as Document
    } catch (e) {
      console.error('Fallback create document failed', e)
    }
    return null
  }

  private mapRow(row: any): Document {
    return {
      id: row.id,
      meetingId: row.meeting_id,
      taskId: row.task_id,
      title: row.title,
      description: row.description,
      type: row.type,
      filePath: row.file_path,
      fileType: row.file_type,
      fileSize: row.file_size,
      status: row.status,
      uploadDate: row.upload_date,
      uploadedDate: row.uploaded_date,
      signedDate: row.signed_date,
      authorizedDate: row.authorized_date,
      completedDate: row.completed_date,
      inProgressDate: row.in_progress_date,
      deadline: row.deadline,
      history: row.history,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      meeting: undefined,
      comments: undefined,
      signatures: undefined,
    } as Document
  }
}

export const documentRepository: DocumentRepository = new DefaultDocumentRepository()
