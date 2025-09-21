// Document utility functions

export interface Document {
  id: string
  name: string
  type: string
  status: 'draft' | 'pending' | 'signed' | 'completed'
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
  details?: any
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
  const supportedTypes = ['pdf', 'doc', 'docx', 'txt']
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

// Mock function to upload document
export async function uploadDocument(
  file: File
): Promise<{ data: Document | null; error: string | null }> {
  try {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (!isSupportedFileType(file.name)) {
      return { data: null, error: 'File type not supported' }
    }

    const document: Document = {
      id: generateDocumentId(),
      name: file.name,
      type: getFileExtension(file.name),
      status: 'draft',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(file), // In real app, this would be from cloud storage
    }

    return { data: document, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to upload document' }
  }
}

// Mock function to delete document
export async function deleteDocument(
  documentId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: 'Failed to delete document' }
  }
}

// Get document status color for UI
export function getDocumentStatusColor(status: Document['status']): string {
  switch (status) {
    case 'draft':
      return 'grey'
    case 'pending':
      return 'warning'
    case 'signed':
      return 'info'
    case 'completed':
      return 'success'
    default:
      return 'default'
  }
}

// Get document status label
export function getDocumentStatusLabel(status: Document['status']): string {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'pending':
      return 'Pending Signature'
    case 'signed':
      return 'Signed'
    case 'completed':
      return 'Completed'
    default:
      return 'Unknown'
  }
}

// Build a public URL for a stored document path (Supabase storage)
export function getStoragePublicUrl(filePath: string): string {
  // If already a full URL, return as-is
  if (/^https?:\/\//i.test(filePath)) return filePath

  // Get the base Supabase URL from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'

  // Build the storage URL - using the s3 endpoint for Supabase storage
  return `${supabaseUrl}/storage/v1/s3/${filePath}`
}

// Simple URL detector used by UI code
export function isStorageUrl(pathOrUrl: string): boolean {
  return /^https?:\/\//i.test(pathOrUrl)
}

// Mock function to fetch DSM documents
export async function fetchDSMDocuments(
  meetingId: string
): Promise<{ data: DocumentWithHistory[] | null; error: string | null }> {
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock DSM documents
    const documents: DocumentWithHistory[] = [
      {
        id: `dsm_${meetingId}_1`,
        name: 'Definitive Proxy Statement.pdf',
        type: 'pdf',
        status: 'completed',
        size: 2048576,
        uploadedAt: new Date().toISOString(),
        history: [
          {
            id: 'hist_1',
            documentId: `dsm_${meetingId}_1`,
            action: 'uploaded',
            userId: 'user_1',
            userName: 'John Doe',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    ]

    return { data: documents, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch DSM documents' }
  }
}

// Mock function to fetch regular documents
export async function fetchRegularDocuments(
  meetingId: string
): Promise<{ data: DocumentWithHistory[] | null; error: string | null }> {
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock regular documents
    const documents: DocumentWithHistory[] = [
      {
        id: `reg_${meetingId}_1`,
        name: 'Meeting Agenda.pdf',
        type: 'pdf',
        status: 'draft',
        size: 1024512,
        uploadedAt: new Date().toISOString(),
        history: [
          {
            id: 'hist_2',
            documentId: `reg_${meetingId}_1`,
            action: 'created',
            userId: 'user_2',
            userName: 'Jane Smith',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    ]

    return { data: documents, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch regular documents' }
  }
}

// Mock function to update document status
export async function updateDocumentStatus(
  documentId: string,
  status: Document['status']
): Promise<{ data: Document | null; error: string | null }> {
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Mock updated document
    const document: Document = {
      id: documentId,
      name: 'Updated Document.pdf',
      type: 'pdf',
      status,
      size: 1024000,
      uploadedAt: new Date().toISOString(),
    }

    return { data: document, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to update document status' }
  }
}
