// Re-export Database type from supabase folder
export type { Database } from '../../supabase/database.types'

// Mock supabase client for components that need it
export const supabase = {
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        data: [],
        error: null,
      }),
    }),
    insert: () => ({
      data: null,
      error: null,
    }),
    update: () => ({
      eq: () => ({
        data: null,
        error: null,
      }),
    }),
    delete: () => ({
      eq: () => ({
        data: null,
        error: null,
      }),
    }),
  }),
}

// Mock helper functions that components expect
export async function addDocumentHistory(
  documentId: string,
  action: string,
  userId: string,
  details?: any
): Promise<{ data: any; error: any }> {
  // This would typically add a record to the document_history table
  // For now, just return success
  return { data: { id: Date.now(), documentId, action, userId, details }, error: null }
}

export async function updateDocumentStatus(
  documentId: string,
  status: string
): Promise<{ data: any; error: any }> {
  // This would typically update the document status
  return { data: { id: documentId, status }, error: null }
}

export async function getDocumentSignatures(
  documentId: string
): Promise<{ data: any[]; error: any }> {
  // This would typically fetch signatures for a document
  return { data: [], error: null }
}