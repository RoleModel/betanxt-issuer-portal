'use client'

import PresentationBoardIcon from '@rolemodel/betanxt-design-system/components/icons/brand/PresentationBoardIcon'
import TeamPresentationIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TeamPresentationIcon'
import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Skeleton,
  Stack,
} from '@mui/material'

import DigitalShareholderMeetingCard from '@/components/Meeting/DigitalShareholderMeetingCard'
import ScheduleDialog from '@/components/Meeting/ScheduleDialog'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import type { Meeting } from '@/types/api-exports'

import TabulationReportCard from '../Tabulation/TabulationReportCard'
import KeyDatesCard from './KeyDatesCard'

type DSMConfig = components['schemas']['DSMConfig']

// Dynamic imports for heavy components
const VotingTabulationTable = dynamic(
  () => import('@/components/Meeting/VotingTabulationTable'),
  {
    loading: () => <Skeleton variant="rectangular" height={400} />,
    ssr: false,
  }
)

const MeetingRolesCard = dynamic(() => import('@/components/Meeting/MeetingRolesCard'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})

const PreviewLinksCard = dynamic(() => import('@/components/Meeting/PreviewLinksCard'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})

const FeatureTile = dynamic(() => import('@/components/FeatureTile'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})

const SharesVotedChart = dynamic(() => import('@/components/Meeting/SharesVotedChart'), {
  loading: () => <Skeleton variant="rectangular" height={300} />,
  ssr: false,
})

interface Phase7LayoutProps {
  meetingId?: string
  meeting?: Meeting
}

export default React.memo(function Phase7Layout({
  meetingId,
  meeting,
}: Phase7LayoutProps) {
  const { proposals, loading: votingLoading } = useVotingTabulation(meetingId)
  const [scheduledLogistics, setScheduledLogistics] = useState(false)
  const [scheduledDryRun, setScheduledDryRun] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'logistics' | 'dryrun'>('logistics')

  useEffect(() => {
    const fetchDSMConfig = async () => {
      if (!meetingId) return

      try {
        const apiClient = await buildApiClient()
        const { data, error } = await apiClient.GET('/meetings/{meetingId}/dsm-config', {
          params: { path: { meetingId } },
        })

        if (!error && data) {
          setScheduledLogistics((data as { logisticsCallScheduled?: boolean }).logisticsCallScheduled || false)
          setScheduledDryRun((data as { dryRunScheduled?: boolean }).dryRunScheduled || false)
        }
      } catch (error) {
        console.error('Failed to fetch DSM config:', error)
      }
    }

    fetchDSMConfig()
  }, [meetingId])

  const handleOpenDialog = (type: 'logistics' | 'dryrun') => {
    setDialogType(type)
    setDialogOpen(true)
  }

  const handleSchedule = async (date: Date, notes?: string) => {
    if (!meetingId) return

    try {
      const apiClient = await buildApiClient()
      const config = {
        meetingId,
        liveQa: true,
        audioOnly: false,
        meetingRecording: true,
        isConfirmed: false,
        logisticsCallScheduled: dialogType === 'logistics' ? true : false,
        dryRunScheduled: dialogType !== 'logistics' ? true : false,
        dsmEnabled: true,
        ioeEnabled: true,
        ...(dialogType === 'logistics' ? {
          logisticsCallDate: date.toISOString(),
          logisticsCallNotes: notes,
        } : {
          dryRunDate: date.toISOString(),
          dryRunNotes: notes,
        })
      }

      const { data, error } = await apiClient.POST('/meetings/{meetingId}/dsm-config', {
        params: { path: { meetingId } },
        body: config,
      })

      if (!error && data) {
        if (dialogType === 'logistics') {
          setScheduledLogistics(true)
        } else {
          setScheduledDryRun(true)
        }
      }
    } catch (error) {
      console.error('Error saving DSM config:', error)
    }

    setDialogOpen(false)
  }

  return (
    <Box display="flex" flexDirection="column" gap={{ xs: 2, md: 3 }}>
      <KeyDatesCard meeting={meeting} />
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 6 }}
          display="flex"
          flexDirection="column"
          gap={{ xs: 2, md: 3 }}
        >
          <DigitalShareholderMeetingCard meetingId={meetingId} />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 3 }}>
            <FeatureTile
              flex
              title={
                scheduledLogistics
                  ? 'Logistics Call Requested'
                  : 'Schedule Logistics Call'
              }
              description={
                scheduledLogistics
                  ? 'Meeting producer will be in touch'
                  : 'Select a date and time for the call'
              }
              actionText={scheduledLogistics ? undefined : 'Schedule Call'}
              icon={<TeamPresentationIcon fontSize="3xl" />}
              variant="default"
              onClick={
                scheduledLogistics ? undefined : () => handleOpenDialog('logistics')
              }
            />
            <FeatureTile
              flex
              title={scheduledDryRun ? 'Dry Run Requested' : 'Schedule Dry Run'}
              description={
                scheduledDryRun
                  ? 'Meeting producer will be in touch'
                  : 'Select a date and time for the dry run'
              }
              actionText={scheduledDryRun ? undefined : 'Schedule Dry Run'}
              icon={<PresentationBoardIcon fontSize="3xl" />}
              variant="default"
              onClick={scheduledDryRun ? undefined : () => handleOpenDialog('dryrun')}
            />
          </Stack>
        </Grid>
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 6 }}
          display="flex"
          flexDirection="column"
          gap={3}
        >
          <MeetingRolesCard meetingId={meetingId} />
          <PreviewLinksCard />
        </Grid>
      </Grid>
      <Grid container size={12} spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 12, lg: 9 }}>
          <Card>
            <CardHeader
              title="Tabulation"
              action={
                <Button
                  variant="outlined"
                  onClick={() => {}}
                  sx={{ textTransform: 'none' }}
                >
                  View Tabulation
                </Button>
              }
            />
            <CardContent sx={{ p: 0 }}>
              <VotingTabulationTable proposals={proposals} loading={votingLoading} />
            </CardContent>
          </Card>
        </Grid>
        <Grid
          container
          size={{ xs: 12, sm: 6, md: 12, lg: 3 }}
          spacing={{ xs: 2, md: 3 }}
          display="flex"
          flexDirection="row"
          alignSelf="flex-start"
        >
          <Stack
            direction={{ xs: 'column', sm: 'row', md: 'column' }}
            spacing={{ xs: 2, md: 3 }}
            sx={{ width: '100%' }}
          >
            <FeatureTile
              flex={true}
              title="Registered Holder Mailing Affidavit"
              titleVariant="h1"
              actionText="Download"
              variant="default"
              onClick={() => {}}
            />
            <TabulationReportCard />
          </Stack>

          <Grid size={{ xs: 12, sm: 6, md: 12 }}>
            <SharesVotedChart meetingId={meetingId} loading={votingLoading} />
          </Grid>
        </Grid>
      </Grid>

      <ScheduleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSchedule={handleSchedule}
        title={
          dialogType === 'logistics' ? 'Schedule Logistics Call' : 'Schedule Dry Run'
        }
        description={
          dialogType === 'logistics'
            ? 'Select a date and time for the logistics call'
            : 'Select a date and time for the dry run'
        }
      />
    </Box>
  )
})
