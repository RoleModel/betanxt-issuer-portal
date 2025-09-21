'use client'

import HandClickIcon from '@rolemodel/betanxt-design-system/components/icons/brand/HandClickIcon'
import React from 'react'

import { Box } from '@mui/material'

import EmptyState from '@/components/EmptyState'

import { useMeeting } from '@/contexts/MeetingContext'
import { friendlyDate } from '@/utils/dateUtils'

export default function MailingPage() {
  const { currentMeeting } = useMeeting()

  return (
    <Box p={2}>
      <EmptyState
        title="Mailing"
        description={`Your mailing is confirmed and will go out on ${friendlyDate(currentMeeting?.mailingDate || '')}. Check back afterward to review status updates and delivery progress.`}
        icon={HandClickIcon}
      />
    </Box>
  )
}
