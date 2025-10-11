'use client'

import mammoth from 'mammoth'
import React, { useEffect, useState } from 'react'

import { Box, CircularProgress } from '@mui/material'

interface OfficeDocumentViewerProps {
  url: string
  title?: string
  fileType?: string
}

const OfficeDocumentViewer: React.FC<OfficeDocumentViewerProps> = ({
  url,
  title: _title,
  fileType,
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string>('')

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch the DOCX file
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()

        // Convert DOCX to HTML using mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer })
        setHtmlContent(result.value)

        if (result.messages.length > 0 && process.env.NODE_ENV === 'development') {
          console.log('Mammoth conversion messages:', result.messages)
        }

        setLoading(false)
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading DOCX:', err)
        }
        setError(err instanceof Error ? err.message : 'Failed to load document')
        setLoading(false)
      }
    }

    if (fileType?.toLowerCase() === 'docx' || fileType?.toLowerCase() === 'doc') {
      void loadDocument()
    } else {
      setError('Unsupported file type. Only DOCX files are supported.')
      setLoading(false)
    }
  }, [url, fileType])

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Spinner overlay until document is loaded */}
      {loading && (
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
            backgroundColor: 'var(--mui-palette-common-white)',
            borderRadius: '4px',
            zIndex: 1,
            minHeight: 400,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={400}
          sx={{
            backgroundColor: 'var(--mui-palette-background-paper)',
            borderRadius: '4px',
            p: 2,
          }}
        >
          <div>Failed to load document: {error}</div>
        </Box>
      )}

      {/* Document Content with fade-in */}
      <Box
        sx={{
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
          backgroundColor: 'var(--mui-palette-background-paper)',
          borderRadius: '4px',
          minHeight: 400,
          width: '100%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {htmlContent && (
          <Box
            sx={{
              p: 3,
              width: '100%',
              fontSize: '14px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              '& img': {
                maxWidth: '100%',
                height: 'auto',
              },
              '& table': {
                borderCollapse: 'collapse',
                width: '100%',
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                fontSize: '13px',
              },
              '& td, & th': {
                border: '1px solid',
                borderColor: 'divider',
                p: 1.5,
                textAlign: 'left',
              },
              '& th': {
                backgroundColor: 'action.hover',
                fontWeight: 600,
              },
              '& p': {
                mb: 1,
                lineHeight: 1.6,
                fontSize: '14px',
                wordBreak: 'break-word',
              },
              '& h1': {
                fontSize: '1.75rem',
                fontWeight: 700,
                mt: 3,
                mb: 2,
                color: 'text.primary',
              },
              '& h2': {
                fontSize: '1.5rem',
                fontWeight: 700,
                mt: 2.5,
                mb: 1.5,
                color: 'text.primary',
              },
              '& h3': {
                fontSize: '1.25rem',
                fontWeight: 600,
                mt: 2,
                mb: 1.5,
                color: 'text.primary',
              },
              '& h4, & h5, & h6': {
                fontSize: '1.1rem',
                fontWeight: 600,
                mt: 2,
                mb: 1,
                color: 'text.primary',
              },
              '& ul, & ol': {
                pl: 3,
                mb: 1.5,
                '& li': {
                  mb: 0.5,
                  lineHeight: 1.6,
                },
              },
              '& strong, & b': { fontWeight: 700 },
              '& em, & i': { fontStyle: 'italic' },
              '& u': { textDecoration: 'underline' },
              lineHeight: 1.6,
              color: 'text.primary',
              overflowWrap: 'break-word',
              wordWrap: 'break-word',
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </Box>
    </Box>
  )
}

export default OfficeDocumentViewer
