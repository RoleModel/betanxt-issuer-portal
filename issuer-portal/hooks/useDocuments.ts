'use client'

import { useCallback, useState } from 'react'

import {
  addComment,
  createDocument,
  downloadDocument,
  getDocumentById,
  getDocumentComments,
  updateDocument,
} from '@/domain-models/api/documents'
import type { components } from '@/domain-models/generated-schema'

type Document = components['schemas']['Document']

type Comment = components['schemas']['Comment']

export interface DocumentComment {
  id: string
  comment: string
  createdAt: string
  userId: string
}

export interface UseDocumentsResult {
  loading: boolean
  error: string | null
  createNewDocument: (meetingId: string, documentData: any) => Promise<Document | null>
  getDocument: (id: string) => Promise<Document | null>
  updateDocumentById: (id: string, updates: any) => Promise<Document | null>
  downloadDocumentById: (id: string) => Promise<any>
  getCommentsForDocument: (documentId: string) => Promise<DocumentComment[]>
  addCommentToDocument: (documentId: string, comment: string) => Promise<void>
  getTaskDocument: (taskId: string) => Promise<any>
  getDocumentsByMeeting: (meetingId: string) => Promise<Document[]>
  uploadDocument: (file: File, documentId: string) => Promise<string | null>
  addDocumentHistory: (documentId: string, eventType: string) => Promise<boolean>
}

export const useDocuments = (): UseDocumentsResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createNewDocument = useCallback(
    async (meetingId: string, documentData: any): Promise<Document | null> => {
      try {
        setLoading(true)
        setError(null)

        const result = await createDocument(meetingId, documentData)
        if (result.error) {
          throw new Error('Failed to create document')
        }

        return result.data as Document
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create document'
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const getDocument = useCallback(async (id: string): Promise<Document | null> => {
    try {
      setLoading(true)
      setError(null)

      const result = await getDocumentById(id)
      if (result.error) {
        throw new Error('Failed to get document')
      }

      return result.data as Document
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get document'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDocumentById = useCallback(
    async (id: string, updates: any): Promise<Document | null> => {
      try {
        setLoading(true)
        setError(null)

        const result = await updateDocument(id, updates)
        if (result.error) {
          throw new Error('Failed to update document')
        }

        return result.data as Document
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update document'
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const downloadDocumentById = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const result = await downloadDocument(id)
      if (result.error) {
        throw new Error('Failed to download document')
      }

      return result.data
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to download document'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getCommentsForDocument = useCallback(
    async (documentId: string): Promise<DocumentComment[]> => {
      try {
        setLoading(true)
        setError(null)

        const result = await getDocumentComments(documentId)
        if (result.error) {
          throw new Error('Failed to get document comments')
        }

        // Convert Comment[] to DocumentComment[] to handle type differences
        const comments = (result.data || []) as Comment[]
        return comments.map((comment) => ({
          id: comment.id?.toString() || '',
          comment: comment.comment || '',
          createdAt: comment.createdAt || '',
          userId: comment.userId || '',
        }))
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get document comments'
        setError(errorMessage)
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const addCommentToDocument = useCallback(
    async (documentId: string, comment: string): Promise<void> => {
      try {
        setLoading(true)
        setError(null)

        const result = await addComment(documentId, { comment })
        if (result.error) {
          throw new Error('Failed to add comment')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add comment'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const getTaskDocument = useCallback(async (taskId: string): Promise<any> => {
    try {
      setLoading(true)
      setError(null)

      // For now, return placeholder data - these operations will need proper API endpoints
      console.warn('getTaskDocument: Placeholder implementation - needs API endpoint')
      return null
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get task document'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getDocumentsByMeeting = useCallback(
    async (meetingId: string): Promise<Document[]> => {
      try {
        setLoading(true)
        setError(null)

        // For now, return placeholder data - these operations will need proper API endpoints
        console.warn(
          'getDocumentsByMeeting: Placeholder implementation - needs API endpoint'
        )
        return []
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get documents by meeting'
        setError(errorMessage)
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const uploadDocument = useCallback(
    async (file: File, documentId: string): Promise<string | null> => {
      try {
        setLoading(true)
        setError(null)

        // For now, return placeholder data - these operations will need proper API endpoints
        console.warn('uploadDocument: Placeholder implementation - needs API endpoint')
        return null
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload document'
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const addDocumentHistory = useCallback(
    async (documentId: string, eventType: string): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)

        // For now, return placeholder success - these operations will need proper API endpoints
        console.warn(
          'addDocumentHistory: Placeholder implementation - needs API endpoint',
          { documentId, eventType }
        )
        return true
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add document history'
        setError(errorMessage)
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    loading,
    error,
    createNewDocument,
    getDocument,
    updateDocumentById,
    downloadDocumentById,
    getCommentsForDocument,
    addCommentToDocument,
    getTaskDocument,
    getDocumentsByMeeting,
    uploadDocument,
    addDocumentHistory,
  }
}
