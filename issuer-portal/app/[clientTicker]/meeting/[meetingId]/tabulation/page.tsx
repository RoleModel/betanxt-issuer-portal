'use client'

import AnalyticsChartIcon from '@rolemodel/betanxt-design-system/components/icons/brand/AnalyticsChartIcon'
import React from 'react'

import { Box } from '@mui/material'

import EmptyState from '@/components/EmptyState'

import { useMeeting } from '@/contexts/MeetingContext'

export default function TabulationPage() {
  const { currentMeeting } = useMeeting()

  return (
    <Box p={2}>
      <EmptyState
        title="Tabulation"
        description={`Tabulation will start on [Start Date] and continue until ${currentMeeting?.meetingDate}. After that, this page will display the updated results.`}
        icon={AnalyticsChartIcon}
      />
    </Box>
  )
}
