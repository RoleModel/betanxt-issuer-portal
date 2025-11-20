'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

import { Box, Container } from '@mui/material'

import SecureFileTransferTable from '@/components/Meeting/SecureFileTransferTable'

export default function SecureFileTransferPage() {
  const pathname = usePathname()
  const clientTicker = pathname.split('/')[1]
  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, flexGrow: 1, flex: 1 }}>
      <Container maxWidth="xl">
        <SecureFileTransferTable clientTicker={clientTicker} />
      </Container>
    </Box>
  )
}
