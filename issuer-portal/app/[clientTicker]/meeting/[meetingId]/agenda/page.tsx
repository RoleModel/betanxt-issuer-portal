'use client'

import React from 'react'

import { Box } from '@mui/material'

import EmptyState from '@/components/EmptyState'

export default function AgendaPage() {
  return (
    <Box p={2}>
      <EmptyState title="Agenda" description={`Agenda coming soon`} />
    </Box>
  )
}
