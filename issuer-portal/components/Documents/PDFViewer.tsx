'use client'

import React, { useEffect, useState } from 'react'
// Import react-pdf CSS only when component is used
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

import { Box, CircularProgress } from '@mui/material'

import './react-pdf.css'

// Type definitions for react-pdf components
interface DocumentProps {
  file: string
  className?: string
  onLoadSuccess?: (pdf: { numPages: number }) => void
  onLoadError?: (error: Error) => void
  loading?: React.ReactNode
  children: React.ReactNode
}

interface PageProps {
  pageNumber: number
  width?: number
  renderTextLayer?: boolean
  renderAnnotationLayer?: boolean
}

// Dynamic import for PDF components to avoid SSR issues
let Document: React.ComponentType<DocumentProps> | null = null
let Page: React.ComponentType<PageProps> | null = null

interface PDFViewerProps {
  file: string
  pageNumber: number
  width?: number
  className?: string
  onLoadSuccess?: (pdf: { numPages: number }) => void
  onLoadError?: (error: Error) => void
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  pageNumber,
  width = 600,
  className,
  onLoadSuccess,
  onLoadError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only load PDF.js on client side with retry logic
    const loadPDFComponents = async (retryCount = 0) => {
      try {
        // Configure PDF.js worker first
        const { pdfjs } = await import('react-pdf')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

        // Import components with a small delay to allow chunk loading
        await new Promise((resolve) => setTimeout(resolve, 100))
        const pdfComponents = await import('react-pdf')
        Document = pdfComponents.Document
        Page = pdfComponents.Page

        setIsLoaded(true)
      } catch (err) {
        console.error('Failed to load PDF components:', err)

        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
          console.log(`Retrying PDF component load in ${delay}ms...`)
          setTimeout(() => loadPDFComponents(retryCount + 1), delay)
        } else {
          setError('Failed to load PDF viewer after multiple attempts')
        }
      }
    }

    loadPDFComponents()
  }, [])

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <div>Error loading PDF: {error}</div>
      </Box>
    )
  }

  if (!isLoaded || !Document || !Page) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Document
      file={file}
      className={className}
      onLoadSuccess={onLoadSuccess}
      onLoadError={onLoadError}
      loading={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      }
    >
      <Page
        pageNumber={pageNumber}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
      />
    </Document>
  )
}

export default PDFViewer
