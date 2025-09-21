'use client'

import { Box, Typography } from '@mui/material'

import MeetingSection from '@/components/Meeting/MeetingSection'

import { useMeeting } from '@/contexts/MeetingContext'

// This handles the Meeting Dashboard route explicitly
export default function MeetingDashboardPage() {
  const { currentMeeting, getMeetingById, error } = useMeeting()

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    )
  }

  return (
    <MeetingSection
      meeting={getMeetingById(currentMeeting?.id || '')}
      meetingId={currentMeeting?.id}
    />
  )
}
