'use client'

import React, { useRef } from 'react'

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Box, Card, CardContent, CardHeader, Typography, styled, useTheme } from '@mui/material'

import { getPhaseColor } from '@/components/mui-styling/theme'

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
    brokerSearchDate?: string | null
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
}))

const KeyDatesCard: React.FC<KeyDatesCardProps> = ({
  loading = false,
  transformedKeyDates = [],
  meeting,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()

  // Use meeting dates directly
  const meetingKeyDates = []

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

  return (
    <Card>
      <CardHeader title={<Typography variant="h3">Key Dates</Typography>} />
      <CardContent sx={{ pt: 0 }}>
        <Box
          component="ul"
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
            },
            gap: 1,
            p: 0,
            m: 0,
          }}
        >
          {loading
            ? // Skeleton loading for key dates
            Array.from({ length: 4 }, (_, index) => <LoadingBox key={index} />)
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
                  <KeyDateTypography
                    variant="body3"
                    isPast={isPast}
                    sx={(theme) => {
                      return {
                        color: phaseItem.isMeeting
                          ? theme.vars.palette.keydate.light
                          : theme.vars.palette.text.primary,
                      }
                    }}
                  >
                    {phaseItem.title}
                  </KeyDateTypography>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                    width="100%"
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                    {isPast && (
                      <CheckCircleIcon
                        sx={{ fontSize: 14, color: theme.vars.palette.success.main }}
                      />
                    )}
                    <KeyDateTypography
                      isPast={isPast}
                      variant="body3"
                      fontWeight={500}
                      sx={(theme) => {
                        return {
                          color: phaseItem.isMeeting
                            ? theme.vars.palette.keydate.light
                            : theme.vars.palette.text.primary,
                        }
                      }}
                    >
                      {phaseItem.date}
                    </KeyDateTypography>
                    </Box>

                    <Typography
                      variant="body3"
                      fontWeight={600}
                      sx={(theme) => {
                        return {
                          color: phaseItem.isMeeting
                            ? theme.vars.palette.keydate.light
                            : theme.vars.palette.text.secondary,
                        }
                      }}
                    >
                      {formatDaysUntil(daysUntil)}
                    </Typography>
                  </Box>
                </KeyDateBox>
              )
            })}
        </Box>
      </CardContent>
    </Card>
  )
}

export default KeyDatesCard
