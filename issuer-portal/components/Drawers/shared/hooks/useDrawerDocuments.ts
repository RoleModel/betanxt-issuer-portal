'use client'

import { useCallback, useState } from 'react'
import type { FileRejection } from 'react-dropzone'

export interface SignatureArea {
  id: string
  x: number
  y: number
  width: number
  height: number
  page?: number
  label?: string
  signed?: boolean
}

export interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'complete' | 'error'
  progress?: number
  error?: string
}

export interface PdfFormState {
  formFields: Record<string, string>
  signatures: Record<string, string>
}

export interface UseDrawerDocumentsReturn {
  // Document viewer state
  documentViewerOpen: boolean
  documentUrl: string
  documentTitle: string
  signatureAreas: SignatureArea[]
  currentDocumentId: string

  // Approval drawer state
  approvalDrawerOpen: boolean
  approvalDocumentUrl: string
  approvalTitle: string

  // File upload state
  uploadFiles: UploadFile[]
  hasUnsupportedFiles: boolean

  // PDF form state
  pdfFormState: PdfFormState

  // Document viewer handlers
  setDocumentViewerOpen: (open: boolean) => void
  setDocumentUrl: (url: string) => void
  setDocumentTitle: (title: string) => void
  setSignatureAreas: (areas: SignatureArea[]) => void
  setCurrentDocumentId: (id: string) => void
  handleDocumentViewerClose: () => void

  // Approval drawer handlers
  setApprovalDrawerOpen: (open: boolean) => void
  setApprovalDocumentUrl: (url: string) => void
  setApprovalTitle: (title: string) => void
  handleApprovalDrawerClose: () => void

  // File upload handlers
  setUploadFiles: React.Dispatch<React.SetStateAction<UploadFile[]>>
  handleFilesSelected: (files: File[]) => void
  handleFileRejections: (rejections: FileRejection[]) => void
  handleFileRemove: (fileId: string) => void
  clearUploadFiles: () => void

  // PDF form handlers
  handlePdfStateChange: (
    formFields: Record<string, string>,
    signatures: Record<string, string>
  ) => void
}

export const useDrawerDocuments = (): UseDrawerDocumentsReturn => {
  // Document viewer state
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [documentUrl, setDocumentUrl] = useState<string>('')
  const [documentTitle, setDocumentTitle] = useState<string>('')
  const [signatureAreas, setSignatureAreas] = useState<SignatureArea[]>([])
  const [currentDocumentId, setCurrentDocumentId] = useState<string>('')

  // Approval drawer state
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false)
  const [approvalDocumentUrl, setApprovalDocumentUrl] = useState<string>('')
  const [approvalTitle, setApprovalTitle] = useState<string>('')

  // File upload state
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [hasUnsupportedFiles, setHasUnsupportedFiles] = useState(false)

  // PDF form state
  const [pdfFormState, setPdfFormState] = useState<PdfFormState>({
    formFields: {},
    signatures: {},
  })

  // Document viewer handlers
  const handleDocumentViewerClose = useCallback(() => {
    setDocumentViewerOpen(false)
    setDocumentUrl('')
    setDocumentTitle('')
    setSignatureAreas([])
  }, [])

  // Approval drawer handlers
  const handleApprovalDrawerClose = useCallback(() => {
    setApprovalDrawerOpen(false)
    setApprovalDocumentUrl('')
    setApprovalTitle('')
  }, [])

  // File upload handlers
  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const uploadFileObjects = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      file,
      status: 'complete' as const,
      progress: 100,
    }))
    setUploadFiles((prev) => [...prev, ...uploadFileObjects])
    setHasUnsupportedFiles(false)
  }, [])

  const handleFileRejections = useCallback((fileRejections: FileRejection[]) => {
    const hasUnsupportedType = fileRejections.some((rejection) =>
      rejection.errors.some((error) => error.code === 'file-invalid-type')
    )
    if (hasUnsupportedType) {
      setHasUnsupportedFiles(true)
    }
  }, [])

  const handleFileRemove = useCallback((fileId: string) => {
    setUploadFiles((prev) => prev.filter((file) => file.id !== fileId))
  }, [])

  const clearUploadFiles = useCallback(() => {
    setUploadFiles([])
  }, [])

  // PDF form handlers
  const handlePdfStateChange = useCallback(
    (formFields: Record<string, string>, signatures: Record<string, string>) => {
      setPdfFormState({ formFields, signatures })
    },
    []
  )

  return {
    // Document viewer state
    documentViewerOpen,
    documentUrl,
    documentTitle,
    signatureAreas,
    currentDocumentId,

    // Approval drawer state
    approvalDrawerOpen,
    approvalDocumentUrl,
    approvalTitle,

    // File upload state
    uploadFiles,
    hasUnsupportedFiles,

    // PDF form state
    pdfFormState,

    // Document viewer handlers
    setDocumentViewerOpen,
    setDocumentUrl,
    setDocumentTitle,
    setSignatureAreas,
    setCurrentDocumentId,
    handleDocumentViewerClose,

    // Approval drawer handlers
    setApprovalDrawerOpen,
    setApprovalDocumentUrl,
    setApprovalTitle,
    handleApprovalDrawerClose,

    // File upload handlers
    setUploadFiles,
    handleFilesSelected,
    handleFileRejections,
    handleFileRemove,
    clearUploadFiles,

    // PDF form handlers
    handlePdfStateChange,
  }
}
