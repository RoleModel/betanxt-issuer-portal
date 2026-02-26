'use client'

import dynamic from 'next/dynamic'

import { Box, CircularProgress } from '@mui/material'

// Dynamically import the PDF viewer component with SSR disabled
const PDFPreview = dynamic(() => import('@/components/PDFPreview'), {
  ssr: false,
  loading: () => (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress />
      <Box>Loading PDF preview...</Box>
    </Box>
  ),
})

export default function PDFPreviewPage() {
  return <PDFPreview />
}
