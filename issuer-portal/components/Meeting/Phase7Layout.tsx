'use client'

import PresentationBoardIcon from '@rolemodel/betanxt-design-system/components/icons/brand/PresentationBoardIcon'
import TeamPresentationIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TeamPresentationIcon'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Stack,
} from '@mui/material'

import DigitalShareholderMeetingCard from '@/components/Meeting/DigitalShareholderMeetingCard'
import ScheduleDialog from '@/components/Meeting/ScheduleDialog'

import buildApiClient from '@/domain-models/apiClient'

import { useVotingTabulation } from '@/hooks/useVotingTabulation'
import type { Meeting } from '@/types/api-exports'

import TabulationReportCard from '../Tabulation/TabulationReportCard'
import KeyDatesCard from './KeyDatesCard'

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
  const router = useRouter()
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
          setScheduledLogistics(
            (data as { logisticsCallScheduled?: boolean }).logisticsCallScheduled || false
          )
          setScheduledDryRun(
            (data as { dryRunScheduled?: boolean }).dryRunScheduled || false
          )
        }
      } catch (error) {
        console.error('Failed to fetch DSM config:', error)
      }
    }

    void fetchDSMConfig()
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
        ...(dialogType === 'logistics'
          ? {
              logisticsCallDate: date.toISOString(),
              logisticsCallNotes: notes,
            }
          : {
              dryRunDate: date.toISOString(),
              dryRunNotes: notes,
            }),
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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto auto 1fr',
        gap: { xs: 2, md: 3 },
      }}
    >
      {/* Header Section */}
      <Box sx={{ gridRow: 1 }}>
        <KeyDatesCard meeting={meeting} />
      </Box>

      {/* Main Content Grid */}
      <Box
        sx={{
          gridRow: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          alignItems: 'flex-start',
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* Left Column */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, md: 3 },
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <DigitalShareholderMeetingCard meetingId={meetingId} />
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 2, md: 3 },
              flexShrink: 0,
            }}
          >
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
          </Box>
        </Box>

        {/* Right Column */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, md: 3 },
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <MeetingRolesCard meetingId={meetingId} />
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            <PreviewLinksCard />
          </Box>
        </Box>
      </Box>

      {/* Bottom Section - Tabulation */}
      <Box
        sx={{
          gridRow: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          alignItems: 'flex-start',
          gap: { xs: 2, md: 3 },
          minHeight: 0, // Allow grid item to shrink below content size
        }}
      >
        {/* Tabulation Table */}
        <Card sx={{ height: 'auto', display: 'flex', flexDirection: 'column' }}>
          <CardHeader
            title="Tabulation"
            action={
              <Button
                variant="outlined"
                onClick={() => {
                  router.push(`/${meeting?.ticker}/meeting/${meetingId}/tabulation`)
                }}
              >
                View Tabulation
              </Button>
            }
            sx={{ flexShrink: 0 }}
          />
          <CardContent sx={{ p: 0, flex: 1 }}>
            <VotingTabulationTable proposals={proposals} loading={votingLoading} />
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <Stack spacing={{ xs: 2, md: 3 }}>
          <FeatureTile
            title="Registered Holder Mailing Affidavit"
            titleVariant="h1"
            actionText="Download"
            variant="default"
            onClick={() => {
              // Event handler intentionally empty - button is disabled
            }}
          />
          <TabulationReportCard />
          <SharesVotedChart meetingId={meetingId} loading={votingLoading} />
        </Stack>
      </Box>

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
