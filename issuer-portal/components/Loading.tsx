// Lightweight shared loading fallback component
'use client'

import React from 'react'

import { Box, LinearProgress } from '@mui/material'

// Lightweight shared loading fallback component

export default function Loading() {
  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <LinearProgress />
    </Box>
  )
}
