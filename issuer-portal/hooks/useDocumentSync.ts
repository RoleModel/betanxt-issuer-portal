'use client'

import { useEffect, useState, useCallback } from 'react'

import { getBrowserSupabase } from '@/lib/browserSupabase'
import type { components } from '@/domain-models/generated-schema'

type Document = components['schemas']['Document']

interface UseDocumentSyncOptions {
  meetingId: string
  onDocumentAdded?: (document: Document) => void
  onDocumentUpdated?: (document: Document) => void
  onDocumentDeleted?: (documentId: string) => void
}

interface DatabaseDocument {
  id: string
  meeting_id: string | null
  task_id: string | null
  title: string | null
  description: string | null
  type: string | null
  file_path: string | null
  file_type: string | null
  file_size: number | null
  status: string | null
  upload_date: string | null
  uploaded_date: string | null
  signed_date: string | null
  authorized_date: string | null
  completed_date: string | null
  in_progress_date: string | null
  deadline: string | null
  history: unknown
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_by_first_name: string | null
  created_by_last_name: string | null
  updated_by: string | null
  updated_by_first_name: string | null
  updated_by_last_name: string | null
  created_at: string | null
  updated_at: string | null
  display_category: string | null
}

interface RealtimePayload {
  new?: DatabaseDocument
  old?: { id: string }
}

interface RealtimeChannel {
  on: (
    event: string,
    config: { event: string; schema: string; table: string; filter: string },
    callback: (payload: RealtimePayload) => void
  ) => RealtimeChannel
  subscribe: () => void
}

export function useDocumentSync({
  meetingId,
  onDocumentAdded,
  onDocumentUpdated,
  onDocumentDeleted,
}: UseDocumentSyncOptions) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getBrowserSupabase()

  // Fetch initial documents
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_URL}/meetings/${meetingId}/documents`)

      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const data = await response.json()
      setDocuments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }, [meetingId])

  // Transform database row to API format
  const transformDocument = (dbDoc: DatabaseDocument): Document => {
    return {
      id: dbDoc.id,
      meetingId: dbDoc.meeting_id || '',
      taskId: dbDoc.task_id ?? undefined,
      title: dbDoc.title || '',
      description: dbDoc.description ?? undefined,
      type: dbDoc.type || '',
      filePath: dbDoc.file_path || '',
      fileType: dbDoc.file_type || '',
      fileSize: dbDoc.file_size || 0,
      status: (dbDoc.status as Document['status']) || 'DRAFT',
      uploadDate: dbDoc.upload_date ?? undefined,
      uploadedDate: dbDoc.uploaded_date ?? undefined,
      signedDate: dbDoc.signed_date ?? undefined,
      authorizedDate: dbDoc.authorized_date ?? undefined,
      completedDate: dbDoc.completed_date ?? undefined,
      inProgressDate: dbDoc.in_progress_date ?? undefined,
      deadline: dbDoc.deadline ?? undefined,
      history: dbDoc.history as Record<string, unknown> | undefined,
      approvedBy: dbDoc.approved_by ?? undefined,
      approvedAt: dbDoc.approved_at ?? undefined,
      createdBy: dbDoc.created_by ?? undefined,
      createdByFirstName: dbDoc.created_by_first_name ?? undefined,
      createdByLastName: dbDoc.created_by_last_name ?? undefined,
      updatedBy: dbDoc.updated_by ?? undefined,
      updatedByFirstName: dbDoc.updated_by_first_name ?? undefined,
      updatedByLastName: dbDoc.updated_by_last_name ?? undefined,
      createdAt: dbDoc.created_at ?? undefined,
      updatedAt: dbDoc.updated_at ?? undefined,
      displayCategory: dbDoc.display_category as Document['displayCategory'],
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    fetchDocuments()

    // Subscribe to document changes - cast to RealtimeChannel for proper typing
    const channel = supabase.channel(`documents:${meetingId}`) as unknown as RealtimeChannel

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'document',
        filter: `meeting_id=eq.${meetingId}`,
      }, (payload: RealtimePayload) => {
        if (payload.new) {
          const newDocument = transformDocument(payload.new)
          setDocuments((prev) => [...prev, newDocument])
          onDocumentAdded?.(newDocument)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'document',
        filter: `meeting_id=eq.${meetingId}`,
      }, (payload: RealtimePayload) => {
        if (payload.new) {
          const updatedDocument = transformDocument(payload.new)
          setDocuments((prev) =>
            prev.map((doc) => (doc.id === updatedDocument.id ? updatedDocument : doc))
          )
          onDocumentUpdated?.(updatedDocument)
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'document',
        filter: `meeting_id=eq.${meetingId}`,
      }, (payload: RealtimePayload) => {
        if (payload.old?.id) {
          setDocuments((prev) => prev.filter((doc) => doc.id !== payload.old?.id))
          onDocumentDeleted?.(payload.old.id)
        }
      })
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel as unknown as ReturnType<typeof supabase.channel>)
    }
  }, [meetingId, supabase, onDocumentAdded, onDocumentUpdated, onDocumentDeleted, fetchDocuments])

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Optimistic update for uploads
  const addOptimisticDocument = useCallback((document: Partial<Document>) => {
    const optimisticDoc: Document = {
      id: `temp-${Date.now()}`,
      meetingId: meetingId,
      title: document.title || 'Uploading...',
      type: document.type || 'UNKNOWN',
      filePath: '',
      fileType: '',
      fileSize: 0,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...document,
    } as Document

    setDocuments((prev) => [...prev, optimisticDoc])
    return optimisticDoc.id
  }, [meetingId])

  const removeOptimisticDocument = useCallback((tempId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== tempId))
  }, [])

  return {
    documents,
    isLoading,
    error,
    refresh,
    addOptimisticDocument,
    removeOptimisticDocument,
  }
}
