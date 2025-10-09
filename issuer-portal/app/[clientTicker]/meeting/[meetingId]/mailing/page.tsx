'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { Card, CardContent, Container, LinearProgress, Skeleton } from '@mui/material'
import Grid from '@mui/material/Grid'

import EmptyState from '@/components/EmptyState'
import FeatureTile from '@/components/FeatureTile'
import MailingDataCard from '@/components/Meeting/MailingDataCard'

import type { components } from '@/domain-models/generated-schema'

import { useMeeting } from '@/contexts/MeetingContext'
import { useMailing } from '@/hooks/useMailing'
import { usePhases } from '@/hooks/usePhases'
import { friendlyDate } from '@/utils/dateUtils'

type MailingData = components['schemas']['Mailing']

// Helper to parse phase label like "Phase 4" safely to number
const parsePhaseNumber = (phaseLabel?: string | null): number | null => {
  if (!phaseLabel) return null
  const match = /(\d+)/.exec(phaseLabel)
  if (!match) return null
  const num = Number(match[1])
  return Number.isFinite(num) ? num : null
}

const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0'
  return num.toLocaleString('en-US')
}

export default function MailingPage() {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting()
  const meetingId = currentMeeting?.id
  const { phases, loading: phasesLoading } = usePhases(meetingId)
  const { getMailingByMeetingId, loading: mailingLoading } = useMailing()
  const [mailingData, setMailingData] = useState<MailingData | null>(null)

  useEffect(() => {
    if (meetingId) {
      void getMailingByMeetingId(meetingId).then((data) => {
        setMailingData(data)
      })
    }
  }, [meetingId, getMailingByMeetingId])

  const currentPhaseLabel = useMemo(() => {
    if (!currentMeeting || typeof currentMeeting !== 'object') return undefined
    if ('currentPhase' in currentMeeting) {
      const val = (currentMeeting as Record<string, unknown>).currentPhase
      return typeof val === 'string' ? val : undefined
    }
    return undefined
  }, [currentMeeting])

  const currentPhaseNumber = useMemo(() => {
    const fromLabel = parsePhaseNumber(currentPhaseLabel)
    if (fromLabel) return fromLabel
    if (phases.length > 0) {
      return phases.reduce((m, p) => (p.orderIndex > m ? p.orderIndex : m), 0) || null
    }
    return null
  }, [currentPhaseLabel, phases])

  const phaseIsSevenOrGreater = (currentPhaseNumber ?? 0) >= 7

  const mailingDateStr = currentMeeting?.mailingDate
  const friendlyMailingDate = mailingDateStr ? friendlyDate(mailingDateStr) : 'TBD'

  // Show loading state while data is being fetched
  if (meetingLoading || phasesLoading || (meetingId && !currentMeeting)) {
    return (
      <LinearProgress
        sx={{
          height: 4,
        }}
      />
    )
  }

  return (
    <Container
      maxWidth="xl"
      sx={{ my: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      {phaseIsSevenOrGreater ? (
        <>
          <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  {mailingLoading ? (
                    <Skeleton variant="rounded" height={80} />
                  ) : (
                    <FeatureTile
                      height="auto"
                      title={formatNumber(mailingData?.totalPositions)}
                      subtitle="Positions Received"
                    />
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  {mailingLoading ? (
                    <Skeleton variant="rounded" height={80} />
                  ) : (
                    <FeatureTile
                      height="auto"
                      title={formatNumber(mailingData?.totalPositions)}
                      subtitle="Positions Loaded"
                    />
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  {mailingLoading ? (
                    <Skeleton variant="rounded" height={80} />
                  ) : (
                    <FeatureTile
                      height="auto"
                      title={formatNumber(
                        (mailingData?.fullsetMailPositions ?? 0) +
                          (mailingData?.naaMailPositions ?? 0)
                      )}
                      subtitle="Mailing Initiated"
                    />
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  {mailingLoading ? (
                    <Skeleton variant="rounded" height={80} />
                  ) : (
                    <FeatureTile
                      height="auto"
                      title={formatNumber(
                        (mailingData?.fullsetMailPositions ?? 0) +
                          (mailingData?.naaMailPositions ?? 0)
                      )}
                      subtitle="Mailing Complete"
                    />
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          <MailingDataCard meetingId={meetingId} />
        </>
      ) : (
        <EmptyState
          title="Mailing"
          description={`Your mailing is confirmed and will go out on ${friendlyMailingDate}. Check back afterward to review status updates and delivery progress.`}
        />
      )}
    </Container>
  )
}
