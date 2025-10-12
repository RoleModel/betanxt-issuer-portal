'use client'

import type { ReactNode } from 'react'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

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
    associations?: Record<string, string>
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
      // DSM documents have type 'digital-shareholder-meeting'
      const dsm = allDocuments.filter((doc) => {
        return doc.type === 'digital-shareholder-meeting'
      })

      // Regular documents are everything else except HOSTING_SITE
      const regular = allDocuments.filter((doc) => {
        // Exclude HOSTING_SITE documents
        if (doc.type === 'HOSTING_SITE') return false

        // Exclude DSM documents
        if (doc.type === 'digital-shareholder-meeting') return false

        // Include everything else
        return true
      })

      console.log('[DocumentContext] Total documents:', allDocuments.length)
      console.log('[DocumentContext] DSM documents:', dsm.length, dsm.map(d => ({ title: d.title, type: d.type })))
      console.log('[DocumentContext] Regular documents:', regular.length)

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
      associations?: Record<string, string>
    ) => {
      try {
        setLoading(true)
        setError(null)

        // Combine regular documents and DSM documents for lookup
        const allExistingDocs = [...documents, ...dsmDocuments]

        // Upload each file using the API endpoint
        const uploadPromises = files.map(async (file, index) => {
          // Try multiple association key formats:
          // 1. file_0, file_1, etc. (used by DigitalShareholderMeetingCard)
          // 2. filename-filesize (used by FileUploadDialog)
          const fileIndexKey = `file_${index}`
          const fileNameSizeKey = `${file.name}-${file.size}`
          const associationId =
            associations?.[fileIndexKey] || associations?.[fileNameSizeKey]
          const title = associationId || file.name.replace(/\.[^/.]+$/, '')

          // Check if a document with this title and type already exists
          const existingDoc = allExistingDocs.find(
            (doc) => doc.title === title && doc.type === documentType
          )

          const formData = new FormData()
          formData.append('file', file)
          formData.append('meetingId', meetingId)
          formData.append('title', title)

          // If we found an existing document, pass its ID to trigger replacement
          if (existingDoc?.id) {
            formData.append('documentId', existingDoc.id)
          }

          // Upload via the API route
          const response = await fetch(`/api/documents/types/${documentType}/upload`, {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error ?? `Failed to upload ${file.name}`)
          }

          const result = await response.json()
          return result
        })

        await Promise.all(uploadPromises)

        // Refresh documents after upload
        await refreshDocuments(meetingId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [documents, dsmDocuments, refreshDocuments]
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
