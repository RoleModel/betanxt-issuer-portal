'use client'

import { useCallback, useState } from 'react'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'
import { supabase } from '../../supabase/clients'

type Document = components['schemas']['Document']
type Comment = components['schemas']['Comment']
type CreateDocumentRequest = components['schemas']['CreateDocumentRequest']
type UpdateDocumentRequest = components['schemas']['UpdateDocumentRequest']
type CreateCommentRequest = components['schemas']['CreateCommentRequest']

export interface DocumentComment {
  id: string
  comment: string
  createdAt: string
  userId: string
}

export interface UseDocumentsResult {
  loading: boolean
  error: string | null
  createNewDocument: (
    meetingId: string,
    documentData: CreateDocumentRequest
  ) => Promise<Document | null>
  getDocument: (id: string) => Promise<Document | null>
  updateDocumentById: (
    id: string,
    updates: UpdateDocumentRequest
  ) => Promise<Document | null>
  downloadDocumentById: (id: string) => Promise<string | null>
  getCommentsForDocument: (documentId: string) => Promise<DocumentComment[]>
  addCommentToDocument: (documentId: string, comment: string) => Promise<void>
  getTaskDocument: (taskId: string) => Promise<unknown>
  getDocumentsByMeeting: (meetingId: string) => Promise<Document[]>
  uploadDocument: (file: File, documentId: string) => Promise<string | null>
  addDocumentHistory: (documentId: string, eventType: string) => Promise<boolean>
  uploadDSMDocument: (
    meetingId: string,
    placeholderTitle: string,
    file: File
  ) => Promise<Document | null>
}

export const useDocuments = (): UseDocumentsResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createNewDocument = useCallback(
    async (
      meetingId: string,
      documentData: CreateDocumentRequest
    ): Promise<Document | null> => {
      try {
        setLoading(true)
        setError(null)

        const apiClient = await buildApiClient()
        const result = await apiClient.POST('/meetings/{meetingId}/documents', {
          params: { path: { meetingId } },
          body: documentData,
        })
        if (result.error) {
          throw new Error('Failed to create document')
        }

        return result.data || null
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

      const apiClient = await buildApiClient()
      const result = await apiClient.GET('/documents/{id}', {
        params: { path: { id } },
      })
      if (result.error) {
        throw new Error('Failed to get document')
      }

      return result.data || null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get document'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDocumentById = useCallback(
    async (id: string, updates: UpdateDocumentRequest): Promise<Document | null> => {
      try {
        setLoading(true)
        setError(null)

        const apiClient = await buildApiClient()
        const result = await apiClient.PUT('/documents/{id}', {
          params: { path: { id } },
          body: updates,
        })
        if (result.error) {
          throw new Error('Failed to update document')
        }

        return result.data || null
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

      const apiClient = await buildApiClient()
      const result = await apiClient.GET('/documents/{id}/download', {
        params: { path: { id } },
      })
      if (result.error) {
        throw new Error('Failed to download document')
      }

      return result.data || null
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

        const apiClient = await buildApiClient()
        const result = await apiClient.GET('/documents/{id}/comments', {
          params: { path: { id: documentId } },
        })
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

        const apiClient = await buildApiClient()
        const result = await apiClient.POST('/documents/{id}/comments', {
          params: { path: { id: documentId } },
          body: { comment } as CreateCommentRequest,
        })
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

  const getTaskDocument = useCallback(async (_taskId: string): Promise<unknown> => {
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
    async (_meetingId: string): Promise<Document[]> => {
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
    async (_file: File, _documentId: string): Promise<string | null> => {
      try {
        setLoading(true)
        setError(null)

        const key = `uploads/${Date.now()}_${_file.name}`
        const { data, error } = await supabase.storage
          .from('supporting')
          .upload(key, _file, {
            upsert: true,
            contentType: _file.type || 'application/octet-stream',
          })
        if (error || !data) {
          throw new Error(error?.message || 'Failed to upload file')
        }

        return data.path || null
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

  const uploadDSMDocument = useCallback(
    async (
      meetingId: string,
      placeholderTitle: string,
      file: File
    ): Promise<Document | null> => {
      try {
        setLoading(true)
        setError(null)

        const key = `supporting/${meetingId}/${Date.now()}_${file.name}`
        const { data: upData, error: upErr } = await supabase.storage
          .from('supporting')
          .upload(key, file, {
            upsert: true,
            contentType: file.type || 'application/octet-stream',
          })
        if (upErr || !upData) {
          throw new Error(upErr?.message || 'Failed to upload file')
        }

        const apiClient = await buildApiClient()
        const createBody = {
          title: placeholderTitle,
          type: 'dsm-document',
          filePath: upData.path,
          status: 'UPLOADED',
        } as unknown as components['schemas']['CreateDocumentRequest']

        const result = await apiClient.POST('/meetings/{meetingId}/documents', {
          params: { path: { meetingId } },
          body: createBody,
        })
        if (result.error) {
          throw new Error('Failed to create document record')
        }

        return (result.data as Document) || null
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload document'
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
    uploadDSMDocument,
  }
}
