'use client'

import dynamic from 'next/dynamic'
import React, { useEffect, useRef, useState } from 'react'
// Import CSS for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

import { Box, CircularProgress } from '@mui/material'

import '@/components/Documents/react-pdf.css'

// Dynamically import react-pdf components with SSR disabled
const Document = dynamic(() => import('react-pdf').then((mod) => mod.Document), {
  ssr: false,
  loading: () => null, // Remove loading spinner from dynamic import
})

const Page = dynamic(() => import('react-pdf').then((mod) => mod.Page), { ssr: false })

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
  width = 400,
  className,
  onLoadSuccess,
  onLoadError,
}) => {
  const [isWorkerReady, setIsWorkerReady] = useState(false)
  const [isPdfLoaded, setIsPdfLoaded] = useState(false)
  const [actualWidth, setActualWidth] = useState<number | null>(null)
  const hasInitialized = useRef(false)

  // Safety check: only process PDF files or data URIs
  const isPdfFile =
    file?.toLowerCase().endsWith('.pdf') ||
    file?.includes('/test-pdf') ||
    file?.startsWith('data:application/pdf')

  // Store the width immediately when it changes
  useEffect(() => {
    setActualWidth(width)
  }, [width])

  // Call onLoadError if provided for non-PDF files
  useEffect(() => {
    if (!isPdfFile && onLoadError) {
      onLoadError(new Error(`PDFViewer: File is not a PDF (${file})`))
    }
  }, [isPdfFile, file, onLoadError])

  useEffect(() => {
    // Initialize PDF.js worker only once
    if (typeof window !== 'undefined' && !hasInitialized.current) {
      hasInitialized.current = true
      import('react-pdf')
        .then(({ pdfjs }) => {
          // Prefer official build path (non-legacy). Fallback set below if needed.
          pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
          setIsWorkerReady(true)
        })
        .catch(() => {
          // Try fallback worker URL silently
          import('react-pdf').then(({ pdfjs }) => {
            pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
            setIsWorkerReady(true)
          })
        })
    }
  }, [])

  // Reset loaded state when file changes
  useEffect(() => {
    setIsPdfLoaded(false)
  }, [file])

  if (!isPdfFile) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <div>Cannot display non-PDF file in PDF viewer</div>
      </Box>
    )
  }

  const handleLoadSuccess = (pdf: { numPages: number }) => {
    setIsPdfLoaded(true)
    if (onLoadSuccess) {
      onLoadSuccess(pdf)
    }
  }

  const handleLoadError = (error: Error) => {
    setIsPdfLoaded(false)
    if (onLoadError) {
      onLoadError(error)
    }
  }

  // Validate file prop
  const isValidFile = file && typeof file === 'string' && file.trim() !== ''

  if (!isValidFile) {
    return (
      <Box
        sx={{
          width: width,
          minHeight: width * 1.294,
          backgroundColor: 'var(--mui-palette-background-paper)',
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
        }}
      >
        <div>No PDF file specified</div>
      </Box>
    )
  }

  // Wait for worker and width to be ready
  if (!isWorkerReady || actualWidth === null) {
    // Use default width if actualWidth is not yet available
    const defaultWidth = width
    return (
      <Box
        sx={{
          position: 'relative',
          width: defaultWidth,
          minHeight: defaultWidth * 1.294,
          maxHeight: '90vh',
          backgroundColor: 'var(--mui-palette-background-paper)',
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Spinner overlay until PDF is loaded */}
      {!isPdfLoaded && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--mui-palette-background-paper)',
            borderRadius: '4px',
            zIndex: 1,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ opacity: isPdfLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
        <Document
          file={file}
          className={className}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={null}
          error={
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight={400}
              sx={{ opacity: isPdfLoaded ? 1 : 0, transition: 'opacity 3s ease-in-out' }}
            >
              <div>Failed to load PDF document</div>
            </Box>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={actualWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            error={
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={400}
              >
                <div>Failed to render page {pageNumber}</div>
              </Box>
            }
          />
        </Document>
      </Box>
    </Box>
  )
}

export default PDFViewer
