'use client'

import React from 'react'

import { Box, Container } from '@mui/material'

interface ProductLayoutProps {
  leftColumnContent: React.ReactElement
  rightColumnContent: React.ReactElement
  documentViewer?: React.ReactElement
}

export default function ProductLayout({
  leftColumnContent,
  rightColumnContent,
  documentViewer,
}: ProductLayoutProps) {
  return (
    <Container
      component="main"
      maxWidth="xl"
      sx={{
        my: {
          xs: 1,
          sm: 3,
        },
        px: {
          xs: 1,
          sm: 10,
        },
        display: {
          xs: 'flex',
          md: 'grid',
        },
        gridTemplateColumns: {
          xs: '1fr',
          md: '1fr 0.4fr',
        },
        flexGrow1: 1,
        flexDirection: {
          xs: 'column-reverse',
        },
        gap: 3,
      }}
    >
      <Box
        sx={{
          xs: {
            order: 2,
          },
          md: {
            order: 1,
          },
        }}
      >
        {leftColumnContent}
      </Box>
      <Box
        sx={{
          mt: 6,
          order: {
            xs: 1,
            md: 2,
          },
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: (theme) => theme.spacing(2),
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {rightColumnContent}
        </Box>
      </Box>
      {documentViewer && documentViewer}
    </Container>
  )
}
