'use client'

import dynamic from 'next/dynamic'
import React from 'react'

import { DescriptionOutlined } from '@mui/icons-material'
import { Box, CircularProgress, Paper, Typography } from '@mui/material'

interface ResourceTitleProps {
  title: string
  description: string
  actionText: string
  minWidth?: string
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
  fileUrl?: string
}

let workerInitialized = false

const PDFPreview = dynamic(
  () =>
    import('react-pdf').then((mod) => {
      if (typeof window !== 'undefined' && !workerInitialized) {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = '/images/pdf.worker.min.js'
        workerInitialized = true
      }

      const PDFPreviewComponent = ({ fileUrl }: { fileUrl: string }) => {
        const [error, setError] = React.useState(false)

        if (error) {
          return <DescriptionOutlined color="inherit" fontSize="large" />
        }

        return (
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
            <mod.Document
              file={fileUrl}
              loading={<CircularProgress size={15} />}
              error={<DescriptionOutlined fontSize="small" />}
              onLoadError={() => setError(true)}
            >
              <mod.Page
                pageNumber={1}
                width={100}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </mod.Document>
          </Box>
        )
      }

      return { default: PDFPreviewComponent }
    }),
  {
    loading: () => <CircularProgress size={20} />,
    ssr: false,
  }
)

const ResourceTitle: React.FC<ResourceTitleProps> = ({
  title,
  description,
  actionText,
  minWidth,
  icon,
  href,
  onClick,
  fileUrl,
}) => {
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
            {fileUrl ? (
              <PDFPreview fileUrl={fileUrl} />
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
          variant="body3"
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

        <Box
          component="a"
          href={href || '#'}
          target={href ? '_blank' : undefined}
          rel={href ? 'noopener noreferrer' : undefined}
          onClick={(e) => {
            if (!href) {
              e.preventDefault()
            }
          }}
          sx={(theme) => ({
            ...theme.typography.body3,
            alignSelf: 'flex-start',
            minWidth: 'auto',
            minHeight: 'auto',
            color: 'link',
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          })}
        >
          {actionText}
        </Box>
      </Box>
    </Box>
  )
}

export default ResourceTitle
