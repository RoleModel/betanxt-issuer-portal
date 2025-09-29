'use client'

import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

import buildApiClient from '@/domain-models/apiClient'
import { components } from '@/domain-models/generated-schema'

type Document = components['schemas']['Document']

interface DocumentContextType {
  documents: Document[]
  dsmDocuments: Document[]
  loading: boolean
  error: string | null
  refreshDocuments: (meetingId: string) => Promise<void>
  uploadDocument: (
    meetingId: string,
    files: File[],
    documentType: string,
    associations?: { [fileId: string]: string }
  ) => Promise<void>
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

interface DocumentProviderProps {
  children: ReactNode
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [dsmDocuments, setDsmDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshDocuments = useCallback(async (meetingId: string) => {
    if (!meetingId) return

    try {
      setLoading(true)
      setError(null)

      const apiClient = await buildApiClient()
      const { data, error: apiError } = await apiClient.GET(
        '/meetings/{meetingId}/documents',
        {
          params: { path: { meetingId } },
        }
      )

      if (apiError || !data) {
        setError('Failed to fetch documents')
        return
      }

      const allDocuments = data as Document[]

      // Separate DSM documents from regular documents
      const dsm = allDocuments.filter((doc) => {
        // Include documents marked as DSM category
        if (doc.displayCategory === 'dsm' || doc.type === 'dsm-document') return true

        // For 2025 meetings, also include presentation/slide documents
        if (meetingId.includes('2025')) {
          const docType = (doc.type || '').toLowerCase()
          const title = (doc.title || '').toLowerCase()
          return (
            docType.includes('presentation') ||
            docType.includes('slide') ||
            title.includes('presentation') ||
            title.includes('slide') ||
            docType.includes('shareholder presentation') ||
            docType.includes('intro slide')
          )
        }
        return false
      })

      // Regular documents are everything that's NOT a DSM document or HOSTING_SITE
      const regular = allDocuments.filter((doc) => {
        // Exclude HOSTING_SITE documents
        if (doc.type === 'HOSTING_SITE') return false

        // Exclude DSM documents
        if (doc.displayCategory === 'dsm' || doc.type === 'dsm-document') return false

        // For 2025 meetings, also exclude presentation/slide documents
        if (meetingId.includes('2025')) {
          const docType = (doc.type || '').toLowerCase()
          const title = (doc.title || '').toLowerCase()
          if (
            docType.includes('presentation') ||
            docType.includes('slide') ||
            title.includes('presentation') ||
            title.includes('slide')
          ) {
            return false
          }
        }

        // Include everything else
        return true
      })

      setDocuments(regular)
      setDsmDocuments(dsm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadDocument = useCallback(
    async (
      meetingId: string,
      files: File[],
      documentType: string,
      associations?: { [fileId: string]: string }
    ) => {
      try {
        setLoading(true)
        setError(null)

        // Import storage utility dynamically to avoid SSR issues
        const { uploadDocument: uploadToStorage } = await import('@/utils/documentUtils')

        // Upload each file to Supabase storage
        const uploadPromises = files.map(async (file, index) => {
          const isDsmType = documentType === 'dsm-document'
          const result = await uploadToStorage(
            file,
            meetingId,
            isDsmType ? 'dsm' : 'regular'
          )

          if (result.error) {
            throw new Error(`Failed to upload ${file.name}: ${result.error}`)
          }

          // Store document metadata including associations
          const documentMetadata = {
            ...result.data,
            originalName: file.name,
            uploadType: documentType,
            associations: associations ? associations[`file_${index}`] : undefined,
            meetingId,
          }

          return documentMetadata
        })

        const uploadResults = await Promise.all(uploadPromises)

        // Create mock documents in the state for immediate UI feedback
        const mockDocuments = uploadResults.map((result, index) => {
          const fileId = `file_${index}`
          const associationId = associations?.[fileId]

          return {
            id: result?.id || `mock-${Date.now()}-${index}`,
            title: result?.originalName || files[index].name,
            description: associationId || undefined, // Store association in description for now
            type: documentType,
            status: 'INCOMPLETE' as Document['status'],
            filePath: result?.url,
            fileSize: files[index].size,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          } as Document
        })

        // Add mock documents to state immediately
        if (documentType === 'dsm-document') {
          setDsmDocuments((prev) => [...prev, ...mockDocuments])
        } else {
          setDocuments((prev) => [...prev, ...mockDocuments])
        }

        // Refresh documents after upload
        await refreshDocuments(meetingId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [refreshDocuments]
  )

  const value: DocumentContextType = useMemo(
    () => ({
      documents,
      dsmDocuments,
      loading,
      error,
      refreshDocuments,
      uploadDocument,
    }),
    [documents, dsmDocuments, loading, error, refreshDocuments, uploadDocument]
  )

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>
}

export const useDocuments = (): DocumentContextType => {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider')
  }
  return context
}
