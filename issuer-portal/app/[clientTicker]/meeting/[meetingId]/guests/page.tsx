'use client'

import React from 'react'

import { Box } from '@mui/material'

import EmptyState from '@/components/EmptyState'

import { useMeeting } from '@/contexts/MeetingContext'

export default function GuestsPage() {
  const { currentMeeting } = useMeeting()

  return (
    <Box p={2}>
      <EmptyState
        title="Guests/Registrants"
        description={`Guest list for ${currentMeeting?.title} coming soon`}
      />
    </Box>
  )
}
