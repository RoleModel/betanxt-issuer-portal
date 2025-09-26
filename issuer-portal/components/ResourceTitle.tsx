'use client'

import React, { useEffect, useState } from 'react'

import { DescriptionOutlined } from '@mui/icons-material'
import { Box, CircularProgress, Link, Paper, Typography } from '@mui/material'

interface ResourceTitleProps {
  title: string
  description: string
  actionText: string
  minWidth?: string
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
  pdfUrl?: string
}

const ResourceTitle: React.FC<ResourceTitleProps> = ({
  title,
  description,
  actionText,
  minWidth,
  icon,
  href,
  onClick,
  pdfUrl,
}) => {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(false)
  // Using looser typing for dynamic PDF components
  const [Document, setDocument] = useState<React.FC<{
    file: string
    loading?: React.ReactElement
    error?: React.ReactElement
    children: React.ReactNode
  }> | null>(null)
  const [Page, setPage] = useState<React.FC<{
    pageNumber: number
    width?: number
    renderTextLayer?: boolean
    renderAnnotationLayer?: boolean
  }> | null>(null)

  // Load PDF components if pdfUrl is provided
  useEffect(() => {
    if (!pdfUrl) return

    let mounted = true
    setPdfLoading(true)
    setPdfError(false)

    const loadPdfComponents = async () => {
      try {
        const { pdfjs } = await import('react-pdf')
        pdfjs.GlobalWorkerOptions.workerSrc = '/images/pdf.worker.min.js'

        const pdfComponents = await import('react-pdf')

        if (mounted) {
          setDocument(
            pdfComponents.Document as React.FC<{
              file: string
              loading?: React.ReactElement
              error?: React.ReactElement
              children: React.ReactNode
            }>
          )
          setPage(
            pdfComponents.Page as React.FC<{
              pageNumber: number
              width?: number
              renderTextLayer?: boolean
              renderAnnotationLayer?: boolean
            }>
          )
          setPdfLoading(false)
        }
      } catch (error) {
        console.error('Failed to load PDF components:', error)
        if (mounted) {
          setPdfError(true)
          setPdfLoading(false)
        }
      }
    }

    loadPdfComponents()

    return () => {
      mounted = false
    }
  }, [pdfUrl])
  return (
    <Box
      className="resource-card"
      sx={{
        minWidth: minWidth || 'fit-content',
        flex: '1 1 0%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 1,
          cursor: 'pointer',
          backgroundColor: (theme) => theme.vars.palette.background.default,
          transition: (theme) =>
            theme.transitions.create(['transform', 'background-color']),
          '&:hover': {
            transform: 'translateY(-1px)',
            backgroundColor: (theme) => theme.vars.palette.background.paper,
          },
        }}
        onClick={href ? () => window.open(href, '_blank') : onClick}
      >
        <Box
          sx={{
            flexGrow: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              aspectRatio: '8.5 / 11',
              margin: '0 auto',
              backgroundColor: (theme) => theme.vars.palette.tableCellRow.fill,
              borderRadius: 1,
              border: '1px solid',
              borderColor: (theme) => theme.vars.palette.divider,
              overflow: 'hidden',
            }}
          >
            {pdfUrl ? (
              pdfLoading ? (
                <CircularProgress size={20} />
              ) : pdfError || !Document || !Page ? (
                <DescriptionOutlined color="inherit" fontSize="large" />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '& .react-pdf__Document': {
                      width: '100%',
                      height: '100%',
                    },
                    '& .react-pdf__Page': {
                      width: '100% !important',
                      height: '100% !important',
                    },
                    '& .react-pdf__Page__canvas': {
                      width: '100% !important',
                      height: 'auto !important',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    },
                    '& .react-pdf__Page__textContent': {
                      display: 'none !important',
                    },
                    '& .react-pdf__Page__annotations': {
                      display: 'none !important',
                    },
                  }}
                >
                  <Document
                    file={pdfUrl}
                    loading={<CircularProgress size={15} />}
                    error={<DescriptionOutlined fontSize="small" />}
                  >
                    <Page
                      pageNumber={1}
                      width={100}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </Box>
              )
            ) : (
              icon && (
                <Box
                  sx={{
                    color: (theme) => theme.vars.palette.text.primary,
                  }}
                >
                  <DescriptionOutlined color="inherit" fontSize="large" />
                </Box>
              )
            )}
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{
          px: 1,
        }}
      >
        <Typography
          noWrap
          variant="body2"
          sx={{
            maxWidth: '100%',
            fontWeight: 600,
            color: (theme) => theme.vars.palette.text.primary,
          }}
        >
          {title}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>

        <Link
          href={href}
          sx={{
            alignSelf: 'flex-start',
            minWidth: 'auto',
            minHeight: 'auto',
          }}
        >
          {actionText}
        </Link>
      </Box>
    </Box>
  )
}

export default ResourceTitle
