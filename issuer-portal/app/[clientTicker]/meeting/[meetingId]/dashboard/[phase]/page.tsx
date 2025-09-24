'use client'

import { useParams } from 'next/navigation'

import { Box, Container, Typography } from '@mui/material'
import NoSsr from '@mui/material/NoSsr'

import Phase1Layout from '@/components/Meeting/Phase1Layout'
import Phase2Layout from '@/components/Meeting/Phase2Layout'
import Phase3Layout from '@/components/Meeting/Phase3Layout'
import Phase4Layout from '@/components/Meeting/Phase4Layout'
import Phase7Layout from '@/components/Meeting/Phase7Layout'
import Phase8Layout from '@/components/Meeting/Phase8Layout'
import TabulationTracker from '@/components/Meeting/TabulationTracker'

import { useMeeting } from '@/contexts/MeetingContext'

export default function PhasePage() {
  const params = useParams()
  const phaseNumber = parseInt(params.phase as string)
  const meetingId = params.meetingId as string
  const { getMeetingById } = useMeeting()
  const meeting = getMeetingById(meetingId)

  const renderPhaseLayout = () => {
    switch (phaseNumber) {
      case 1:
        return <NoSsr><Phase1Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} /></NoSsr>

      case 2:
        return <NoSsr><Phase2Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} /></NoSsr>

      case 3:
        return <NoSsr><Phase3Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} /></NoSsr>

      case 4:
        return <NoSsr><Phase4Layout meetingId={meetingId} meeting={meeting} phase={phaseNumber} /></NoSsr>

      case 5:
        return (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="h6">Phase 5: Pre-Meeting</Typography>
            <Typography>Coming soon...</Typography>
          </Box>
        )

      case 6:
        return (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="h6">Phase 6: Meeting Day</Typography>
            <Typography>Coming soon...</Typography>
          </Box>
        )

      case 7:
        return <NoSsr><Phase7Layout meetingId={meetingId} meeting={meeting} /></NoSsr>

      case 8:
        return (
          <NoSsr><Phase8Layout meetingId={meetingId} meeting={meeting} /></NoSsr>
        )

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
    <Container maxWidth="xl" data-testid="meeting-dashboard">
      <Box display="flex" flexDirection="column" paddingY={{ xs: 1, sm: 3 }} gap={3}>
        <NoSsr>
          <TabulationTracker meetingId={meetingId} />
        </NoSsr>

        {renderPhaseLayout()}
      </Box>
    </Container>
  )
}
