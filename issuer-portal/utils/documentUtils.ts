// Document utility functions
import type { DocumentStatus as APIDocumentStatus } from '@/types/api-exports'

// API document statuses (re-exported from generated schema)
export type DocumentStatus = APIDocumentStatus

// Extended status used only client-side for placeholder DSM documents that have no file yet.
export type ExtendedDocumentStatus = DocumentStatus | 'NOT_UPLOADED'

// Export an ordered array of the valid document status values for reuse (e.g. UI helpers)
export const DOCUMENT_STATUS_VALUES: DocumentStatus[] = [
  'DRAFT',
  'AWAITING_DRAFT',
  'AWAITING_REVIEW',
  'APPROVED',
  'UPLOADED',
  'IN_PROGRESS',
  'SIGNED',
  'AUTHORIZED',
  'COMPLETED',
  'SUBMITTED_AWAITING_RECORD_DATE',
]

// Include extended placeholder statuses separately so we don't leak them into persistence logic.
export const EXTENDED_DOCUMENT_STATUS_VALUES: ExtendedDocumentStatus[] = [
  ...DOCUMENT_STATUS_VALUES,
  'NOT_UPLOADED',
]

export interface Document {
  id: string
  name: string
  type: string
  status: ExtendedDocumentStatus
  size: number
  uploadedAt: string
  url?: string
}

export interface DocumentSignature {
  id: string
  documentId: string
  signerName: string
  signerEmail: string
  signedAt: string
  status: 'pending' | 'signed'
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface DocumentHistoryEntry {
  id: string
  documentId: string
  action: string
  userId: string
  userName: string
  timestamp: string
  details?: Record<string, unknown>
}

export interface DocumentWithHistory extends Document {
  history: DocumentHistoryEntry[]
}

// Format file size in bytes to human readable string
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get file extension from filename
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

// Check if file type is supported
export function isSupportedFileType(filename: string): boolean {
  const supportedTypes = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'csv',
    'txt',
  ]
  const extension = getFileExtension(filename).toLowerCase()
  return supportedTypes.includes(extension)
}

// Generate a unique document ID
export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Validate document signature position
export function validateSignaturePosition(
  position: { x: number; y: number; width: number; height: number },
  pageWidth: number,
  pageHeight: number
): boolean {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + position.width <= pageWidth &&
    position.y + position.height <= pageHeight
  )
}

// Calculate signature area in pixels
export function calculateSignatureArea(position: {
  x: number
  y: number
  width: number
  height: number
}): number {
  return position.width * position.height
}

// Upload document to Supabase storage
export async function uploadDocument(
  file: File,
  meetingId?: string,
  documentType: 'dsm' | 'regular' = 'regular'
): Promise<{ data: Document | null; error: string | null }> {
  try {
    if (!isSupportedFileType(file.name)) {
      return { data: null, error: 'File type not supported' }
    }

    // Import storage utility dynamically to avoid SSR issues
    const { uploadFileToStorage, createStorageFolder } = await import('./supabaseStorage')

    // Create folder path if meetingId is provided
    const folder = meetingId ? createStorageFolder(meetingId, documentType) : undefined

    // Upload to Supabase storage
    const uploadResult = await uploadFileToStorage(file, folder)

    if (uploadResult.error || !uploadResult.data) {
      return { data: null, error: uploadResult.error || 'Upload failed' }
    }

    const document: Document = {
      id: generateDocumentId(),
      name: file.name,
      type: getFileExtension(file.name),
      status: 'DRAFT',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      url: uploadResult.data.publicUrl || uploadResult.data.fullPath,
    }

    return { data: document, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to upload document',
    }
  }
}

// Delete document from storage
export async function deleteDocument(
  documentId: string,
  storagePath?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (storagePath) {
      // Import storage utility dynamically to avoid SSR issues
      const { deleteFileFromStorage } = await import('./supabaseStorage')

      const result = await deleteFileFromStorage(storagePath)
      if (result.error) {
        return { success: false, error: result.error }
      }
    }

    // Here you would also delete from your database
    // For now, just simulate success
    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete document',
    }
  }
}

// Get document status color for UI
export function getDocumentStatusColor(status: ExtendedDocumentStatus): string {
  switch (status) {
    case 'NOT_UPLOADED':
      return 'grey'
    case 'DRAFT':
    case 'AWAITING_DRAFT':
      return 'grey'
    case 'AWAITING_REVIEW':
      return 'warning'
    case 'APPROVED':
    case 'AUTHORIZED':
      return 'primary'
    case 'UPLOADED':
    case 'IN_PROGRESS':
      return 'info'
    case 'SIGNED':
      return 'secondary'
    case 'COMPLETED':
      return 'success'
    default:
      return 'default'
  }
}

export function getDocumentStatusLabel(status: ExtendedDocumentStatus): string {
  switch (status) {
    case 'NOT_UPLOADED':
      return 'Not Uploaded'
    case 'DRAFT':
      return 'Draft'
    case 'AWAITING_DRAFT':
      return 'Awaiting Draft'
    case 'AWAITING_REVIEW':
      return 'Awaiting Review'
    case 'APPROVED':
      return 'Approved'
    case 'UPLOADED':
      return 'Uploaded'
    case 'IN_PROGRESS':
      return 'In Progress'
    case 'SIGNED':
      return 'Signed'
    case 'AUTHORIZED':
      return 'Authorized'
    case 'COMPLETED':
      return 'Completed'
    default:
      return 'Unknown'
  }
}

export function getDocumentActionLabel(doc: {
  status?: ExtendedDocumentStatus
  url?: string
  filePath?: string
}): string {
  const hasFile = !!(doc.url || doc.filePath)
  if (doc.status === 'NOT_UPLOADED') return 'Upload'
  if (!hasFile) return 'Upload'
  if (doc.status === 'AWAITING_REVIEW') return 'Review'
  return 'View'
}

// Build a public URL for a stored document path (Supabase storage)
export function getStoragePublicUrl(filePath: string): string {
  // If already a full URL, return as-is
  if (/^https?:\/\//i.test(filePath)) return filePath

  // If it's a data URI (base64), return as-is
  if (filePath.startsWith('data:')) return filePath

  // Get the base Supabase URL from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
  // Strip leading slashes and /documents/ prefix if present
  let normalized = filePath.replace(/^\/+/, '')
  if (normalized.startsWith('documents/')) {
    normalized = normalized.substring('documents/'.length)
  }

  // Always ensure path is under the 'documents/' bucket
  const withBucket = `documents/${normalized}`

  // Build the public object URL (not the S3 proxy) so it works in browsers
  return `${supabaseUrl}/storage/v1/object/public/${withBucket}`
}

// Simple URL detector used by UI code
export function isStorageUrl(pathOrUrl: string): boolean {
  return /^https?:\/\//i.test(pathOrUrl)
}

// Fetch DSM documents for a meeting (category = 'DSM')
export async function fetchDSMDocuments(
  meetingId: string
): Promise<{ data: DocumentWithHistory[] | null; error: string | null }> {
  // Helper to map raw rows to DocumentWithHistory
  const mapRows = (rows: unknown[]): DocumentWithHistory[] =>
    rows.map((rowRaw) => {
      const row = rowRaw as Record<string, unknown>
      const rowId = String(row.id ?? `doc_${Math.random().toString(36).slice(2)}`)
      const historyRaw = row.history
      const historyArray: DocumentHistoryEntry[] = Array.isArray(historyRaw)
        ? (historyRaw as unknown[])
            .filter(
              (h): h is Record<string, unknown> => typeof h === 'object' && h !== null
            )
            .map((h) => ({
              id: String(h.id ?? `${rowId}_hist_${Math.random().toString(36).slice(2)}`),
              documentId: String(h.documentId ?? rowId ?? ''),
              action: String(h.action ?? 'UNKNOWN'),
              userId: String(h.userId ?? (h).user_id ?? ''),
              userName: String(
                h.userName ??
                  (h).user_name ??
                  (h).user ??
                  'Unknown User'
              ),
              timestamp: String(
                h.timestamp ??
                  (h).created_at ??
                  new Date().toISOString()
              ),
              details:
                typeof (h).details === 'object' &&
                (h).details !== null
                  ? ((h).details as Record<string, unknown>)
                  : undefined,
            }))
        : []
      return {
        id: rowId,
        name: String(row.title ?? 'Untitled'),
        type: String((row.type as string) ?? (row.file_type as string) ?? 'pdf'),
        status: String(row.status ?? 'DRAFT') as DocumentStatus,
        size: Number(row.file_size ?? 0),
        uploadedAt: String(
          (row.uploaded_date as string) ||
            (row.updated_at as string) ||
            (row.created_at as string) ||
            new Date().toISOString()
        ),
        url: typeof row.file_path === 'string' ? row.file_path : undefined,
        history: historyArray,
      }
    })
  try {
    // Try OpenAPI client first
    const { apiClient } = await import('../domain-models/api/client')
    // Using defined path: GET /meetings/{meetingId}/documents with query params
    const resp = await apiClient.GET('/meetings/{meetingId}/documents', {
      params: { path: { meetingId }, query: { type: 'DSM' } },
    })
    if (!resp.error && resp.data) {
      // Assume API already returns proper shape; minimally adapt
      const adapted = Array.isArray(resp.data)
        ? resp.data.map((d) => {
            const r = d as Record<string, unknown>
            return {
              id: String(r.id),
              name: String(r.title ?? r.name ?? 'Untitled'),
              type: String((r.type as string) ?? (r.fileType as string) ?? 'pdf'),
              status: String(r.status ?? 'DRAFT') as DocumentStatus,
              size: Number((r.fileSize as number) ?? (r.file_size as number) ?? 0),
              uploadedAt: String(
                (r.uploadedDate as string) ||
                  (r.uploaded_date as string) ||
                  (r.updatedAt as string) ||
                  (r.updated_at as string) ||
                  (r.createdAt as string) ||
                  (r.created_at as string) ||
                  new Date().toISOString()
              ),
              url: (r.filePath as string) || (r.file_path as string),
              history: Array.isArray(r.history)
                ? (r.history as DocumentHistoryEntry[])
                : [],
            }
          })
        : []
      return { data: adapted, error: null }
    }
  } catch {
    // Swallow to fallback
  }
  try {
    // Fallback: direct Supabase query (legacy path)
    const { supabase } = await import('./supabaseStorage')
    const { data, error } = await supabase
      .from('document')
      .select(
        'id,title,type,status,file_size,file_type,file_path,meeting_id,updated_at,created_at,uploaded_date,history'
      )
      .eq('meeting_id', meetingId)
      .like('type', '%DSM%')
      .order('updated_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    if (!data) return { data: [], error: null }
    return { data: mapRows(data as unknown[]), error: null }
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : 'Failed to fetch DSM documents',
    }
  }
}

// Fetch non-DSM (regular) documents for a meeting
export async function fetchRegularDocuments(
  meetingId: string
): Promise<{ data: DocumentWithHistory[] | null; error: string | null }> {
  const mapRows = (rows: unknown[]): DocumentWithHistory[] =>
    rows.map((rowRaw) => {
      const row = rowRaw as Record<string, unknown>
      const rowId = String(row.id ?? `doc_${Math.random().toString(36).slice(2)}`)
      const historyRaw = row.history
      const historyArray: DocumentHistoryEntry[] = Array.isArray(historyRaw)
        ? (historyRaw as unknown[])
            .filter(
              (h): h is Record<string, unknown> => typeof h === 'object' && h !== null
            )
            .map((h) => ({
              id: String(h.id ?? `${rowId}_hist_${Math.random().toString(36).slice(2)}`),
              documentId: String(h.documentId ?? rowId ?? ''),
              action: String(h.action ?? 'UNKNOWN'),
              userId: String(h.userId ?? (h).user_id ?? ''),
              userName: String(
                h.userName ??
                  (h).user_name ??
                  (h).user ??
                  'Unknown User'
              ),
              timestamp: String(
                h.timestamp ??
                  (h).created_at ??
                  new Date().toISOString()
              ),
              details:
                typeof (h).details === 'object' &&
                (h).details !== null
                  ? ((h).details as Record<string, unknown>)
                  : undefined,
            }))
        : []
      return {
        id: rowId,
        name: String(row.title ?? 'Untitled'),
        type: String((row.type as string) ?? (row.file_type as string) ?? 'pdf'),
        status: String(row.status ?? 'DRAFT') as DocumentStatus,
        size: Number(row.file_size ?? 0),
        uploadedAt: String(
          (row.uploaded_date as string) ||
            (row.updated_at as string) ||
            (row.created_at as string) ||
            new Date().toISOString()
        ),
        url: typeof row.file_path === 'string' ? row.file_path : undefined,
        history: historyArray,
      }
    })
  try {
    const { apiClient } = await import('../domain-models/api/client')
    const resp = await apiClient.GET('/meetings/{meetingId}/documents', {
      params: { path: { meetingId } },
    })
    if (!resp.error && resp.data) {
      const adapted = Array.isArray(resp.data)
        ? resp.data.map((d) => {
            const r = d as Record<string, unknown>
            return {
              id: String(r.id),
              name: String(r.title ?? r.name ?? 'Untitled'),
              type: String((r.type as string) ?? (r.fileType as string) ?? 'pdf'),
              status: String(r.status ?? 'DRAFT') as DocumentStatus,
              size: Number((r.fileSize as number) ?? (r.file_size as number) ?? 0),
              uploadedAt: String(
                (r.uploadedDate as string) ||
                  (r.uploaded_date as string) ||
                  (r.updatedAt as string) ||
                  (r.updated_at as string) ||
                  (r.createdAt as string) ||
                  (r.created_at as string) ||
                  new Date().toISOString()
              ),
              url: (r.filePath as string) || (r.file_path as string),
              history: Array.isArray(r.history)
                ? (r.history as DocumentHistoryEntry[])
                : [],
            }
          })
        : []
      return { data: adapted, error: null }
    }
  } catch {
    // Fallback to direct query
  }
  try {
    const { supabase } = await import('./supabaseStorage')
    const { data, error } = await supabase
      .from('document')
      .select(
        'id,title,type,status,file_size,file_type,file_path,meeting_id,updated_at,created_at,uploaded_date,history'
      )
      .eq('meeting_id', meetingId)
      .order('updated_at', { ascending: false })
    if (error) return { data: null, error: error.message }
    if (!data) return { data: [], error: null }
    return { data: mapRows(data as unknown[]), error: null }
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : 'Failed to fetch regular documents',
    }
  }
}

// Update document status in persistence layer
export async function updateDocumentStatus(
  documentId: string,
  status: Document['status']
): Promise<{ data: Document | null; error: string | null }> {
  try {
    // Never attempt to persist placeholder status
    const persistStatus = status === 'NOT_UPLOADED' ? 'DRAFT' : status
    // Attempt OpenAPI call first
    try {
      const { apiClient } = await import('../domain-models/api/client')
      // PUT /documents/{id}
      const resp = await apiClient.PUT('/documents/{id}', {
        params: { path: { id: documentId } },
        body: { status: persistStatus },
      })
      if (!resp.error && resp.data) {
        const d = resp.data as Record<string, unknown>
        return {
          data: {
            id: String(d.id ?? documentId),
            name: String(d.title ?? d.name ?? 'Untitled'),
            type: String((d.type as string) ?? (d.fileType as string) ?? 'pdf'),
            status: String(d.status ?? persistStatus) as DocumentStatus,
            size: Number((d.fileSize as number) ?? (d.file_size as number) ?? 0),
            uploadedAt: String(
              (d.uploadedDate as string) ||
                (d.uploaded_date as string) ||
                (d.updatedAt as string) ||
                (d.updated_at as string) ||
                (d.createdAt as string) ||
                (d.created_at as string) ||
                new Date().toISOString()
            ),
            url: (d.filePath as string) || (d.file_path as string),
          },
          error: null,
        }
      }
    } catch {
      // fall through to direct update
    }
    const { supabase } = await import('./supabaseStorage')
    const { data, error } = await supabase
      .from('document')
      .update({ status: persistStatus })
      .eq('id', documentId)
      .select(
        'id,title,type,status,file_size,file_type,file_path,updated_at,created_at,uploaded_date'
      )
      .single()
    if (error) {
      return { data: null, error: error.message }
    }

    if (!data) {
      return { data: null, error: 'Failed to update document status' }
    }

    const d = data as Record<string, unknown>
    return {
      data: {
        id: String(d.id ?? documentId),
        name: String(d.title ?? d.name ?? 'Untitled'),
        type: String((d.type as string) ?? (d.file_type as string) ?? 'pdf'),
        status: String(d.status ?? persistStatus) as DocumentStatus,
        size: Number(d.file_size ?? 0),
        uploadedAt: String(
          (d.uploaded_date as string) ||
            (d.updated_at as string) ||
            (d.created_at as string) ||
            new Date().toISOString()
        ),
        url: typeof d.file_path === 'string' ? d.file_path : undefined,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update document status',
    }
  }
}
