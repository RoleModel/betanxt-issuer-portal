import type { FileRejection } from 'react-dropzone'

export interface DSMDocumentOption {
  id: string
  title: string
}

export interface UploadFile {
  id: string
  file: File
  status: 'uploading' | 'complete' | 'error'
  progress?: number
  error?: string
  associatedDocumentId?: string // ID of the DSM document this file will update
}

export interface FileUploadProps {
  /** Maximum number of files allowed */
  maxFiles?: number
  /** Maximum file size in bytes */
  maxSize?: number
  /** Accepted file types (e.g., ['.pdf', '.doc', '.docx']) */
  acceptedFileTypes?: string[]
  /** Called when files are selected */
  onFilesSelected?: (files: File[]) => void
  /** Called when a file is removed */
  onFileRemove?: (fileId: string) => void
  /**
   * Custom upload function - replace the built-in simulation with your own logic
   * @example
   * ```typescript
   * onUpload={async (files) => {
   *   const formData = new FormData()
   *   files.forEach(file => formData.append('files', file))
   *   const response = await fetch('/api/upload', { method: 'POST', body: formData })
   *   if (!response.ok) throw new Error('Upload failed')
   * }}
   * ```
   */
  onUpload?: (files: File[]) => Promise<void>
  /** Called when file upload state changes (uploading, complete, error) */
  onFileStateChange?: (files: UploadFile[]) => void
  /** Disable the component */
  disabled?: boolean
  /** Allow multiple file selection */
  multiple?: boolean
  /** Pre-uploaded files to display */
  uploadedFiles?: UploadFile[]
  /** DSM documents available for association */
  dsmDocumentOptions?: DSMDocumentOption[]
  /** Called when file association changes */
  onFileAssociationChange?: (fileId: string, documentId: string) => void
}

export interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void
  onFileRejections?: (fileRejections: FileRejection[]) => void
  maxFiles?: number
  maxSize?: number
  acceptedFileTypes?: string[]
  disabled?: boolean
  multiple?: boolean
  isDragActive?: boolean
  linkText?: string
  hasUnsupportedFiles?: boolean
}

export interface FilePreviewProps {
  file: UploadFile
  onRemove: (fileId: string) => void
  disabled?: boolean
  dsmDocumentOptions?: DSMDocumentOption[]
  onAssociationChange?: (fileId: string, documentId: string) => void
}

export const DEFAULT_MAX_SIZE = 5 * 1024 * 1024 // 5MB
export const DEFAULT_ACCEPTED_TYPES = ['.doc', '.docx', '.pdf', '.ppt', '.csv', '.pptx']
