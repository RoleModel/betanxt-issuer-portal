'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

import { Box, Container, Typography } from '@mui/material'

import { useMeeting } from '@/contexts/MeetingContext'

// Dynamically load heavy phase layouts & tracker to reduce initial JS
const Phase1Layout = dynamic(() => import('@/components/Meeting/Phase1Layout'))
const Phase2Layout = dynamic(() => import('@/components/Meeting/Phase2Layout'))
const Phase3Layout = dynamic(() => import('@/components/Meeting/Phase3Layout'))
const Phase4Layout = dynamic(() => import('@/components/Meeting/Phase4Layout'))
const Phase5Layout = dynamic(() => import('@/components/Meeting/Phase5Layout'))
const Phase6Layout = dynamic(() => import('@/components/Meeting/Phase6Layout'))
const Phase7Layout = dynamic(() => import('@/components/Meeting/Phase7Layout'))
const Phase8Layout = dynamic(() => import('@/components/Meeting/Phase8Layout'))
const TabulationTracker = dynamic(() => import('@/components/Meeting/TabulationTracker'))

export default function PhasePage() {
  const params = useParams()
  const phaseNumber = parseInt(params.phase as string)
  const meetingId = params.meetingId as string
  const { getMeetingById } = useMeeting()
  const meeting = getMeetingById(meetingId)

  const renderPhaseLayout = () => {
    switch (phaseNumber) {
      case 1:
        return (
          <Phase1Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} />
        )

      case 2:
        return (
          <Phase2Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} />
        )

      case 3:
        return (
          <Phase3Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} />
        )

      case 4:
        return (
          <Phase4Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} />
        )

      case 5:
        return (
          <Phase5Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} />
        )

      case 6:
        return (
          <Phase6Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} />
        )

      case 7:
        return <Phase7Layout meetingId={meetingId} meeting={meeting} />

      case 8:
        return <Phase8Layout meetingId={meetingId} meeting={meeting} />

      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="h6">Unknown Phase: {phaseNumber}</Typography>
            <Typography>This phase is not recognized.</Typography>
          </Box>
        )
    }
  }

  return (
    <Container component="main" maxWidth="xl" data-testid="meeting-dashboard">
      <Box display="flex" flexDirection="column" paddingY={{ xs: 1, sm: 3 }} gap={3}>
        <TabulationTracker meetingId={meetingId} />

        {renderPhaseLayout()}
      </Box>
    </Container>
  )
}
