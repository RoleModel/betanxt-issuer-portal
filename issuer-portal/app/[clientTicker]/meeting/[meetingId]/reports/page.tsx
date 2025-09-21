'use client'

import React from 'react'

import { Box } from '@mui/material'

import EmptyState from '@/components/EmptyState'

export default function ReportsPage() {
  return (
    <Box p={2}>
      <EmptyState title="Reports" description={`Reports for coming soon`} />
    </Box>
  )
}
