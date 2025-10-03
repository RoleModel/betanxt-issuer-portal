'use client'

import { useCallback, useState } from 'react'

import buildApiClient from '@/domain-models/apiClient'
import { documentRepository } from '@/domain-models/documentRepository'
import type { components } from '@/domain-models/generated-schema'

import type { components as apiComponents } from '@/types/api'
import type {
  CreateCommentRequest,
  CreateDocumentRequest,
  Document,
  UpdateDocumentRequest,
} from '@/types/api-exports'
import { asArray, asRecord, asString } from '@/utils/typeUtils'

// Type alias for DocumentHistory from components
type DocumentHistory = apiComponents['schemas']['DocumentHistory']

// Valid event types from the OpenAPI schema
const VALID_EVENT_TYPES = [
  'CREATED',
  'UPLOADED',
  'VIEWED',
  'DOWNLOADED',
  'SIGNED',
  'APPROVED',
  'REJECTED',
  'COMMENTED',
  'UPDATED',
] as const

// Type guard function to check if a string is a valid DocumentHistory event type
function isDocumentHistoryEventType(
  value: string
): value is NonNullable<DocumentHistory['eventType']> {
  return VALID_EVENT_TYPES.includes(value as (typeof VALID_EVENT_TYPES)[number])
}

export interface DocumentComment {
  id: string
  comment: string
  user: string
  first_name: string
  last_name: string
  created_at: string
  users: {
    avatar: string | null
  } | null
}

export interface DocumentHistoryEvent {
  id: string
  event_type: NonNullable<DocumentHistory['eventType']>
  user: string
  timestamp: string
  metadata?: Record<string, unknown>
}

type DocumentHistoryEventType = NonNullable<DocumentHistory['eventType']>

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
  addCommentToDocument: (
    documentId: string,
    comment: string,
    userInfo?: { firstName?: string; lastName?: string; userId?: string }
  ) => Promise<void>
  getTaskDocument: (taskId: string) => Promise<unknown>
  getDocumentsByMeeting: (meetingId: string) => Promise<Document[]>
  uploadDocument: (
    file: File,
    documentId: string,
    meetingId?: string,
    documentTitle?: string,
    taskId?: string
  ) => Promise<string | null>
  uploadDocumentVersion: (
    meetingId: string,
    documentType: string,
    file: File,
    versionNotes?: string
  ) => Promise<Document | null>
  addDocumentHistory: (
    documentId: string,
    eventType: DocumentHistoryEventType
  ) => Promise<boolean>
  getDocumentHistory: (documentId: string) => Promise<DocumentHistoryEvent[]>
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
        const { data, error } = result
        if (error) {
          throw new Error('Failed to create document')
        }

        return data || null
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
      const { data, error } = result
      if (error) {
        throw new Error('Failed to get document')
      }

      return data || null
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
        const { data, error } = result
        if (error) {
          throw new Error('Failed to update document')
        }

        return data || null
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
      const { data, error } = result
      if (error) {
        throw new Error('Failed to download document')
      }

      return data || null
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
        const { data, error } = result
        if (error) {
          throw new Error('Failed to get document comments')
        }

        // Return comments as-is since backend now returns CommentWithUser format
        return (data || []) as unknown as DocumentComment[]
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
    async (
      documentId: string,
      comment: string,
      userInfo?: { firstName?: string; lastName?: string; userId?: string }
    ): Promise<void> => {
      try {
        setLoading(true)
        setError(null)

        const apiClient = await buildApiClient()
        const result = await apiClient.POST('/documents/{id}/comments', {
          params: { path: { id: documentId } },
          body: {
            comment,
            firstName: userInfo?.firstName,
            lastName: userInfo?.lastName,
            userId: userInfo?.userId,
          } as CreateCommentRequest,
        })

        const { error: addError } = result
        if (addError) {
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
        return await documentRepository.listByMeeting(meetingId)
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
    async (
      _file: File,
      _documentId: string,
      _meetingId?: string,
      _documentTitle?: string,
      _taskId?: string
    ): Promise<string | null> => {
      try {
        setLoading(true)
        setError(null)

        // Check if documentId is actually a filename (from MeetingDocuments)
        const isFilename =
          _documentId.includes('.') &&
          !_documentId.includes('/') &&
          !_documentId.includes('-form-') &&
          !_documentId.includes('temp-')

        // Check if documentId is a known document type (from placeholder replacement)
        const knownDocumentTypes = [
          'draft-proxy-statement',
          'proxy-statement',
          'proxy-card',
          'notice-access-form',
          'notice-and-access',
          'broadridge-form',
          'plan-file-request',
          'transfer-agent-request',
          '10-k',
          'annual-report',
        ]
        const isKnownDocumentType = knownDocumentTypes.includes(_documentId)

        // Check if this is a signed form with a timestamped ID
        const isSignedFormId =
          _documentId.includes('broadridge-form-') ||
          _documentId.includes('plan-file-request-') ||
          _documentId.includes('transfer-agent-request-')

        // Check if this is a signed document
        const isSignedDocument =
          _documentTitle?.includes('(Signed)') ||
          _documentId.includes('-signed-') ||
          _file.name.includes('signed_')

        // For new documents from MeetingDocuments, use the new upload API route
        if (
          (isFilename || isKnownDocumentType || isSignedFormId || isSignedDocument) &&
          _meetingId
        ) {
          const formData = new FormData()
          formData.append('file', _file)
          formData.append('meetingId', _meetingId)
          if (_taskId) {
            formData.append('taskId', _taskId)
          }
          if (_documentTitle) {
            formData.append('title', _documentTitle)
          }

          // Determine document type
          let documentType = 'general'

          if (isKnownDocumentType) {
            // Use the provided document type directly
            documentType = _documentId
          } else if (isSignedFormId) {
            // Extract base document type from timestamped signed form IDs
            if (_documentId.includes('broadridge-form-')) {
              documentType = 'broadridge-form'
            } else if (_documentId.includes('plan-file-request-')) {
              documentType = 'plan-file-request'
            } else if (_documentId.includes('transfer-agent-request-')) {
              documentType = 'transfer-agent-request'
            }
          } else {
            // Determine document type from filename
            const fileName = _file.name.toLowerCase()

            if (fileName.includes('proxy') && fileName.includes('statement')) {
              documentType = 'proxy-statement'
            } else if (fileName.includes('proxy') && fileName.includes('card')) {
              documentType = 'proxy-card'
            } else if (fileName.includes('notice') || fileName.includes('access')) {
              documentType = 'notice-and-access'
            } else if (fileName.includes('broadridge')) {
              documentType = 'broadridge-form'
            } else if (fileName.includes('plan') && fileName.includes('file')) {
              documentType = 'plan-file-request'
            } else if (fileName.includes('transfer') && fileName.includes('agent')) {
              documentType = 'transfer-agent-request'
            }
          }

          // Upload via the new API route
          const response = await fetch(`/api/documents/types/${documentType}/upload`, {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Upload failed: ${errorText}`)
          }

          const result = await response.json()
          // Response is the Document object with id, not ApiResponse wrapper
          return result?.id || result?.storagePath || null
        }

        // Convert file to base64 for legacy document updates
        const reader = new FileReader()
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(_file)
        })

        const apiClient = await buildApiClient()

        // Check if this is a temporary document ID (for generated forms)
        const isTemporaryId =
          _documentId.includes('broadridge-form-') ||
          _documentId.includes('plan-file-request-') ||
          _documentId.includes('transfer-agent-request-') ||
          _documentId === 'temp-doc-id' ||
          _documentId.startsWith('doc-') ||
          _documentId.startsWith('temp-')

        // Decide target status: certain special forms remain SIGNED; otherwise default to AWAITING_REVIEW
        const isExplicitSignedForm =
          _documentId.includes('broadridge') ||
          _documentId.includes('plan-file-request') ||
          _documentId.includes('transfer-agent-request') ||
          (_documentTitle ? _documentTitle.includes('(Signed)') : false)
        const desiredStatus = (
          isExplicitSignedForm ? 'SIGNED' : 'AWAITING_REVIEW'
        ) as components['schemas']['Document']['status']

        // Use the meeting ID passed in, or extract from URL
        let meetingId = _meetingId

        if (!meetingId) {
          // Try to extract from the page URL (e.g., /TICKER/meeting/ID)
          const tickerPathMatch = window.location.pathname.match(
            /\/[^/]+\/meeting\/([^/]+)/
          )
          if (tickerPathMatch) {
            meetingId = tickerPathMatch[1]
          }
        }

        // Fallback to a default if no meeting ID found
        if (!meetingId) {
          console.warn('No meeting ID provided or found in URL, using default')
          meetingId = 'default-meeting'
        }

        // Determine document type from ID or use provided title
        let docType = 'signed-form'
        let title = _documentTitle || 'Signed Document'

        // Override with specific form types if detected
        if (_documentId.includes('broadridge')) {
          docType = 'broadridge-form'
          title = 'Broadridge Corporate Issuer Profile Form (Signed)'
        } else if (_documentId.includes('plan-file-request')) {
          docType = 'plan-file-request'
          title = 'Plan File Request Form (Signed)'
        } else if (_documentId.includes('transfer-agent-request')) {
          docType = 'transfer-agent-request'
          title = 'Transfer Agent Request Form (Signed)'
        } else if (_documentTitle) {
          // Detect form type from title as well
          const lowerTitle = _documentTitle.toLowerCase()
          if (lowerTitle.includes('broadridge') || lowerTitle.includes('ics')) {
            docType = 'broadridge-form'
            title = 'Broadridge Corporate Issuer Profile Form (Signed)'
          } else if (lowerTitle.includes('plan file request')) {
            docType = 'plan-file-request'
            title = 'Plan File Request Form (Signed)'
          } else if (lowerTitle.includes('transfer agent')) {
            docType = 'transfer-agent-request'
            title = 'Transfer Agent Request Form (Signed)'
          } else {
            // Use provided title and append (Signed) if not already present
            title = _documentTitle.includes('(Signed)')
              ? _documentTitle
              : `${_documentTitle} (Signed)`
          }
        }

        if (isTemporaryId) {
          // For temporary documents, create a new document record
          const result = await apiClient.POST('/meetings/{meetingId}/documents', {
            params: { path: { meetingId } },
            body: {
              title,
              type: docType,
              file: base64Data,
              taskId: _taskId,
            } as components['schemas']['CreateDocumentRequest'],
          })

          const { data, error } = result
          if (error || !data) {
            console.error('Document creation error:', error || 'No data returned')
            throw new Error('Failed to create signed document')
          }

          const createdDoc = data as Document
          // If desiredStatus differs from default, update status in a follow-up call
          if (createdDoc.id && desiredStatus) {
            await apiClient.PUT('/documents/{id}', {
              params: { path: { id: createdDoc.id } },
              body: {
                status: desiredStatus,
              } as components['schemas']['UpdateDocumentRequest'],
            })
          }

          // Return the new document ID
          return createdDoc.id || _documentId
        } else {
          // For existing documents, create a new document (version history)
          // Documents are immutable - each upload creates a new document
          const result = await apiClient.POST('/meetings/{meetingId}/documents', {
            params: { path: { meetingId } },
            body: {
              title,
              type: docType,
              file: base64Data,
              taskId: _taskId,
            } as components['schemas']['CreateDocumentRequest'],
          })

          const { data, error } = result
          if (error || !data) {
            console.error('Document creation error:', error || 'No data returned')
            throw new Error('Failed to create signed document')
          }

          const createdDoc = data as Document
          // If desiredStatus differs from default, update status in a follow-up call
          if (createdDoc.id && desiredStatus) {
            await apiClient.PUT('/documents/{id}', {
              params: { path: { id: createdDoc.id } },
              body: {
                status: desiredStatus,
              } as components['schemas']['UpdateDocumentRequest'],
            })
          }

          // Return the new document ID
          return createdDoc.id || _documentId
        }
      } catch (err) {
        console.error('uploadDocument error:', err)
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

  const uploadDocumentVersion = useCallback(
    async (
      meetingId: string,
      documentType: string,
      file: File,
      versionNotes?: string
    ): Promise<Document | null> => {
      try {
        setLoading(true)
        setError(null)
        return await documentRepository.uploadVersion({
          meetingId,
          documentType,
          file,
          versionNotes,
        })
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload document version'
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

        // Convert file to base64 data URI
        const reader = new FileReader()
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const apiClient = await buildApiClient()
        const createBody = {
          title: placeholderTitle,
          type: 'dsm-document',
          filePath: base64Data,
          status: 'UPLOADED',
        } as unknown as components['schemas']['CreateDocumentRequest']

        const result = await apiClient.POST('/meetings/{meetingId}/documents', {
          params: { path: { meetingId } },
          body: createBody,
        })
        const { data, error } = result
        if (error) {
          throw new Error('Failed to create document record')
        }

        return (data as Document) || null
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
    async (documentId: string, eventType: DocumentHistoryEventType): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)

        const apiClient = await buildApiClient()
        const result = await apiClient.POST('/documents/{id}/events', {
          params: { path: { id: documentId } },
          body: {
            eventType,
            metadata: {},
          },
        })

        const { error: histError } = result
        if (histError) {
          throw new Error('Failed to add document history')
        }

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

  const getDocumentHistory = useCallback(
    async (documentId: string): Promise<DocumentHistoryEvent[]> => {
      try {
        setLoading(true)
        setError(null)

        const apiClient = await buildApiClient()
        const result = await apiClient.GET('/documents/{id}/events', {
          params: { path: { id: documentId } },
        })

        const { data: histData, error: histError } = result
        if (histError) {
          throw new Error('Failed to get document history')
        }

        // Transform the response to match our interface with runtime guards
        const raw = asArray(histData)
        return raw
          .map((value) => asRecord(value))
          .filter((record): record is Record<string, unknown> => Boolean(record))
          .map((eventObj) => {
            const id = asString(eventObj.id) ?? crypto.randomUUID()

            const eventTypeCandidate =
              asString(eventObj.eventType) ?? asString(eventObj.event_type)
            const normalizedEventType =
              eventTypeCandidate && isDocumentHistoryEventType(eventTypeCandidate)
                ? eventTypeCandidate
                : 'UPDATED'

            const userValue = asString(eventObj.userName) ?? asString(eventObj.user_name)
            const user = userValue ?? 'Unknown User'

            const timestampValue =
              asString(eventObj.createdAt) ?? asString(eventObj.created_at)
            const timestamp = timestampValue ?? new Date().toISOString()

            const metadataRecord = asRecord(eventObj.metadata)

            return {
              id,
              event_type: normalizedEventType,
              user,
              timestamp,
              metadata: metadataRecord || undefined,
            }
          })
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get document history'
        setError(errorMessage)
        return []
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
    uploadDocumentVersion,
    addDocumentHistory,
    getDocumentHistory,
    uploadDSMDocument,
  }
}
