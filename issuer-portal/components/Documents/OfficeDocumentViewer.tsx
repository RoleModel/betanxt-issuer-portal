'use client'

import React from 'react'
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer'

import { Box } from '@mui/material'

interface OfficeDocumentViewerProps {
  url: string
  title?: string
  fileType?: string
}

const OfficeDocumentViewer: React.FC<OfficeDocumentViewerProps> = ({ url, title }) => {
  // Prepare document for viewer - react-doc-viewer auto-detects file type from URL
  const docs = [
    {
      uri: url,
      fileName: title,
    },
  ]

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
      }}
    >
      {/* Document Viewer */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'auto', minHeight: 600 }}>
        <DocViewer
          documents={docs}
          pluginRenderers={DocViewerRenderers}
          style={{
            height: '100%',
            width: '100%',
          }}
          config={{
            header: {
              disableHeader: true, // Hide the header since we have our own
              disableFileName: true,
              retainURLParams: false,
            },
          }}
        />
      </Box>
    </Box>
  )
}

export default OfficeDocumentViewer
