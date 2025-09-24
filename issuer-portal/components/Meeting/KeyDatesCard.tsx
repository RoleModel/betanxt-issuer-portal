'use client'

import React, { useEffect, useRef, useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  styled,
} from '@mui/material'

import PhaseDrawer from '@/components/Drawers/PhaseDrawer'
import { getPhaseColor, theme } from '@/components/mui-styling/theme'

import buildApiClient from '@/domain-models/apiClient'
import { components } from '@/domain-models/generated-schema'

import { calculateDaysUntil, formatDaysUntil } from '@/utils/dateUtils'

interface TransformedKeyDate {
  title: string
  date: string
  dateString: string // Original date string for calculations
  phase: number
  phaseColor: string
  isMeeting: boolean
}

interface KeyDatesCardProps {
  loading?: boolean
  transformedKeyDates?: TransformedKeyDate[]
  className?: string
  meeting?: {
    id?: string
    recordDate?: string | null
    mailingDate?: string | null
    meetingDate?: string | null
    currentPhase?: string
    preFilingDate?: string | null
    brokerSearchDate?: string | null
    filingDate?: string | null
  }
}

const LoadingBox = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  minWidth: 150,
  height: 57,
  background: theme.vars.palette.background.default,
  borderRadius: 1.5,
  p: 1.5,
}))

interface KeyDateBoxProps {
  isMeeting?: boolean
  isPast?: boolean
  phaseColor: string
}

const KeyDateBox = styled(Box, {
  shouldForwardProp: (prop) =>
    !['isMeeting', 'isPast', 'phaseColor'].includes(prop as string),
})<KeyDateBoxProps>(({ theme, isMeeting, isPast, phaseColor }) => ({
  flexGrow: 1,
  scrollSnapAlign: 'start',
  background: isMeeting
    ? theme.vars.palette.keydate.contrastText
    : theme.vars.palette.background.default,
  color: isMeeting ? theme.vars.palette.keydate.light : theme.vars.palette.text.primary,
  borderLeft: `6px solid ${isPast ? theme.vars.palette.complete : phaseColor}`,
  boxShadow: `0px 0px 0px 1px inset ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxSizing: 'content-box',
  paddingInline: theme.spacing(1.5),
  paddingBlock: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
}))

const KeyDateTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isPast',
})<{ isPast?: boolean }>(({ isPast }) => ({
  fontWeight: 500,
  opacity: isPast ? 0.5 : 1,
  color: isPast ? 'error.main' : 'text.primary',
  textDecoration: isPast ? 'line-through' : 'none',
  textDecorationColor: 'inherit',
  textDecorationThickness: '2px',
}))

const KeyDatesCard: React.FC<KeyDatesCardProps> = ({
  loading = false,
  transformedKeyDates = [],
  meeting,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)
  const [phases, setPhases] = useState<components['schemas']['Phase'][]>([])
  const [phasesLoading, setPhasesLoading] = useState(true)

  // Fetch phases for the meeting
  useEffect(() => {
    const fetchPhases = async () => {
      if (!meeting?.id) {
        setPhasesLoading(false)
        return
      }

      try {
        const apiClient = await buildApiClient()
        const result = await apiClient.GET('/meetings/{meetingId}/phases', {
          params: { path: { meetingId: meeting.id } },
        })
        if (result.data && !result.error) {
          setPhases(result.data || [])
        }
      } catch (error) {
        console.error('Error fetching phases:', error)
      } finally {
        setPhasesLoading(false)
      }
    }

    fetchPhases()
  }, [meeting?.id])

  // Use meeting dates directly (phases only provide color mapping)
  const meetingKeyDates = []

  if (meeting?.preFilingDate) {
    meetingKeyDates.push({
      title: 'Pre-Filing',
      date: new Date(meeting.preFilingDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      dateString: meeting.preFilingDate,
      phase: 1,
      phaseColor: getPhaseColor(1),
      isMeeting: false,
    })
  }
  if (meeting?.filingDate) {
    meetingKeyDates.push({
      title: 'Filing Date',
      date: new Date(meeting.filingDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      dateString: meeting.filingDate,
      phase: 1,
      phaseColor: getPhaseColor(1),
      isMeeting: false,
    })
  }
  if (meeting?.brokerSearchDate) {
    meetingKeyDates.push({
      title: 'Broker Search',
      date: new Date(meeting.brokerSearchDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      dateString: meeting.brokerSearchDate,
      phase: 2,
      phaseColor: getPhaseColor(2),
      isMeeting: false,
    })
  }
  if (meeting?.recordDate) {
    meetingKeyDates.push({
      title: 'Record Date',
      date: new Date(meeting.recordDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      dateString: meeting.recordDate,
      phase: 3,
      phaseColor: getPhaseColor(3),
      isMeeting: false,
    })
  }
  if (meeting?.mailingDate) {
    meetingKeyDates.push({
      title: 'Mailing Date',
      date: new Date(meeting.mailingDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      dateString: meeting.mailingDate,
      phase: 4,
      phaseColor: getPhaseColor(4),
      isMeeting: false,
    })
  }
  if (meeting?.meetingDate) {
    meetingKeyDates.push({
      title: 'Meeting Date',
      date: new Date(meeting.meetingDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      dateString: meeting.meetingDate,
      phase: 7,
      phaseColor: 'var(--mui-palette-keydate-light)',
      isMeeting: true,
    })
  }

  const displayKeyDates =
    transformedKeyDates.length > 0 ? transformedKeyDates : meetingKeyDates
  const currentPhase = phases.find((p) => p.status === undefined)?.orderIndex || 1

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen)
  }

  return (
    <>
      <Card>
        <CardHeader
          title={<Typography variant="h3">Key Dates</Typography>}
          action={
            <Button variant="text" color="primary" onClick={toggleDrawer(true)}>
              Phase Overview
            </Button>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          <Box
            ref={scrollContainerRef}
            sx={{
              display: 'grid',
              width: '100%',
              height: '100%',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              transition: 'grid-template-columns 0.3s ease, gap 0.3s ease',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: 'repeat(6, minmax(130px, 1fr))',
              },
              gap: 1,
            }}
          >
            {loading || phasesLoading
              ? // Skeleton loading for key dates
              Array.from({ length: 6 }, (_, index) => <LoadingBox key={index} />)
              : displayKeyDates.map((phaseItem, index) => {
                const daysUntil = calculateDaysUntil(phaseItem.dateString)
                const isPast = daysUntil < 0
                return (
                  <KeyDateBox
                    key={index}
                    isMeeting={phaseItem.isMeeting}
                    isPast={isPast}
                    phaseColor={phaseItem.phaseColor}
                  >
                    <KeyDateTypography variant="body3" isPast={isPast}>
                      {phaseItem.title}
                    </KeyDateTypography>
                    <Box
                      display="flex"
                      alignItems="baseline"
                      justifyContent="space-between"
                      width="100%"
                    >
                      <KeyDateTypography
                        isPast={isPast}
                        variant="body3"
                        fontWeight={500}
                        sx={(theme) => {
                          return {
                            color: phaseItem.isMeeting
                              ? theme.vars.palette.primary.contrastText
                              : theme.vars.palette.text.primary,
                          }
                        }}
                      >
                        {phaseItem.date}
                      </KeyDateTypography>

                      <KeyDateTypography
                        isPast={isPast}
                        variant="body3"
                        fontWeight={600}
                        sx={(theme) => {
                          return {
                            color: phaseItem.isMeeting
                              ? theme.vars.palette.primary.contrastText
                              : theme.vars.palette.text.secondary
                          }
                        }}
                      >
                        {formatDaysUntil(daysUntil)}
                      </KeyDateTypography>
                    </Box>
                  </KeyDateBox>
                )
              })}
          </Box>
        </CardContent>
      </Card>
      <PhaseDrawer phase={currentPhase} open={open} onClose={toggleDrawer(false)} />
    </>
  )
}

export default KeyDatesCard
