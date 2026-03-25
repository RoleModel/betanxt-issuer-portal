'use client'

import { BNTypographyPair } from '@rolemodel/betanxt-design-system/components/BNTypographyPair'
import { motion } from 'motion/react'
import React from 'react'

import { CalendarTodayOutlined as CalendarIcon } from '@mui/icons-material'
import {
  Box,
  Fade,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import type { SparkLineChartProps } from '@mui/x-charts/SparkLineChart'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { useMeeting } from '@/contexts/MeetingContext'
import { calculateDaysUntil } from '@/utils/dateUtils'

type ApiClient = Awaited<ReturnType<typeof buildApiClient>>
type Phase = components['schemas']['Phase']
type Meeting = components['schemas']['Meeting']
type Position = components['schemas']['Position']
type TabulationReport = components['schemas']['TabulationReport']

interface TabulationData {
  meeting_id: string
  meeting_title: string
  meeting_date: string
  total_positions: number
  positions_voted: number
  total_shares: string
  shares_voted: string
  shares_unvoted: string
  vote_percentage: string
  web_votes: number
  paper_votes: number
  phone_votes: number
  status: string
}

interface HistoricalTabulationPoint {
  meetingId: string
  yearLabel: string
  votedShares: number
  unvotedShares: number
  isCurrentMeeting: boolean
}

type HistoricalDataStatus = 'idle' | 'loading' | 'loaded'

interface TabulationTrackerProps {
  meetingId?: string
  phase?: string
}

interface MeetingSummarySource {
  id?: string | null
  title?: string | null
  meetingDate?: string | null
  status?: string | null
}

function isSpecialMeeting(meetingType?: string | null): boolean {
  if (!meetingType) return false
  return meetingType.toLowerCase().includes('special')
}

const createEmptySummary = (meeting: MeetingSummarySource): TabulationData => ({
  meeting_id: meeting.id ?? '',
  meeting_title: meeting.title ?? '',
  meeting_date: meeting.meetingDate ?? '',
  total_positions: 0,
  positions_voted: 0,
  total_shares: '0',
  shares_voted: '0',
  shares_unvoted: '0',
  vote_percentage: '0.00',
  web_votes: 0,
  paper_votes: 0,
  phone_votes: 0,
  status: meeting.status ?? '',
})

const buildSummaryFromReport = (
  meeting: MeetingSummarySource,
  report: TabulationReport
): TabulationData => {
  const positionsVoted = report.positionsVoted
  const totalPositions = (positionsVoted?.voted ?? 0) + (positionsVoted?.unvoted ?? 0)
  const votedPositions = positionsVoted?.voted ?? 0
  const totalShares = positionsVoted?.totalShares ?? 0
  const votedShares = positionsVoted?.votedShares ?? 0
  const votePercentage = totalShares > 0 ? (votedShares / totalShares) * 100 : 0

  const nonDtc = report.nonDtcVoteStatus

  return {
    meeting_id: meeting.id ?? '',
    meeting_title: meeting.title ?? '',
    meeting_date: meeting.meetingDate ?? '',
    total_positions: totalPositions,
    positions_voted: votedPositions,
    total_shares: totalShares.toString(),
    shares_voted: votedShares.toString(),
    shares_unvoted: Math.max(totalShares - votedShares, 0).toString(),
    vote_percentage: votePercentage.toFixed(2),
    web_votes: nonDtc?.webShareholders ?? 0,
    paper_votes: nonDtc?.printShareholders ?? 0,
    phone_votes: nonDtc?.ivrShareholders ?? 0,
    status: meeting.status ?? '',
  }
}

const buildSummaryFromPositions = (
  meeting: MeetingSummarySource,
  positions: Position[]
): TabulationData => {
  const totalPositions = positions.length
  const votedPositions = positions.filter(
    (position) => position.voteStatus === 'Voted'
  ).length
  const totalShares = positions.reduce((sum, position) => sum + (position.shares ?? 0), 0)
  const votedShares = positions
    .filter((position) => position.voteStatus === 'Voted')
    .reduce((sum, position) => sum + (position.sharesVoted ?? position.shares ?? 0), 0)
  const votePercentage = totalShares > 0 ? (votedShares / totalShares) * 100 : 0

  return {
    meeting_id: meeting.id ?? '',
    meeting_title: meeting.title ?? '',
    meeting_date: meeting.meetingDate ?? '',
    total_positions: totalPositions,
    positions_voted: votedPositions,
    total_shares: totalShares.toString(),
    shares_voted: votedShares.toString(),
    shares_unvoted: Math.max(totalShares - votedShares, 0).toString(),
    vote_percentage: votePercentage.toFixed(2),
    web_votes: positions.filter((position) => position.source === 'WEB').length,
    paper_votes: positions.filter((position) => position.source === 'PRINT').length,
    phone_votes: positions.filter((position) => position.source === 'IVR').length,
    status: meeting.status ?? '',
  }
}

const fetchMeetingSummary = async (
  apiClient: ApiClient,
  meeting: MeetingSummarySource
): Promise<TabulationData> => {
  if (!meeting.id) {
    return createEmptySummary(meeting)
  }

  const tabulationResult = (await apiClient.GET(
    '/meetings/{meetingId}/tabulation-report',
    {
      params: {
        path: { meetingId: meeting.id },
      },
    }
  )) as { data?: TabulationReport; error?: unknown }

  if (!tabulationResult.error && tabulationResult.data) {
    return buildSummaryFromReport(meeting, tabulationResult.data)
  }

  const positionsResult = (await apiClient.GET('/positions', {
    params: { query: { meetingId: meeting.id } },
  })) as { data?: { positions?: Position[] }; error?: unknown }

  const positions = positionsResult.data?.positions

  if (!positionsResult.error && positions && Array.isArray(positions)) {
    return buildSummaryFromPositions(meeting, positions)
  }

  return createEmptySummary(meeting)
}

const parseMeetingYearInfo = (
  meetingId: string
): { baseId: string; currentYear: number } | null => {
  const idParts = meetingId.split('-')

  if (idParts.length < 4) {
    return null
  }

  const currentYear = Number.parseInt(idParts[idParts.length - 1], 10)

  if (Number.isNaN(currentYear)) {
    return null
  }

  return {
    baseId: idParts.slice(0, -1).join('-'),
    currentYear,
  }
}

const buildSparklineDomain = (
  series: number[]
): NonNullable<SparkLineChartProps['yAxis']>['domainLimit'] => {
  const finiteValues = series.filter((value) => Number.isFinite(value))

  if (finiteValues.length === 0) {
    return () => ({ min: 0, max: 1 })
  }

  const minValue = Math.min(...finiteValues)
  const maxValue = Math.max(...finiteValues)
  const range = maxValue - minValue

  if (range === 0) {
    const padding = Math.max(Math.abs(maxValue) * 0.05, 1)
    return () => ({
      min: Math.max(0, minValue - padding),
      max: maxValue + padding,
    })
  }

  const padding = Math.max(range * 0.35, maxValue * 0.01)

  return () => ({
    min: Math.max(0, minValue - padding),
    max: maxValue + padding,
  })
}

const formatSparklineAxisValue = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('en-US', { year: 'numeric' })
  }

  return ''
}

const sortMeetingsBySeriesOrder = (
  firstMeeting: Meeting,
  secondMeeting: Meeting
): number => {
  const firstYear = firstMeeting.meetingYear ?? 0
  const secondYear = secondMeeting.meetingYear ?? 0

  if (firstYear !== secondYear) {
    return firstYear - secondYear
  }

  const firstDate = firstMeeting.meetingDate
    ? new Date(firstMeeting.meetingDate).getTime()
    : 0
  const secondDate = secondMeeting.meetingDate
    ? new Date(secondMeeting.meetingDate).getTime()
    : 0

  return firstDate - secondDate
}

function TabulationTracker({ meetingId, phase }: TabulationTrackerProps) {
  const { currentMeeting } = useMeeting()
  const [data, setData] = React.useState<TabulationData | null>(null)
  const [historicalData, setHistoricalData] = React.useState<HistoricalTabulationPoint[]>(
    []
  )
  const [historicalDataStatus, setHistoricalDataStatus] =
    React.useState<HistoricalDataStatus>('idle')

  const [_nextPhaseDate, setNextPhaseDate] = React.useState<Date | null>(null)
  const [voteCutoffDate, setVoteCutoffDate] = React.useState<Date | null>(null)
  const [phases, setPhases] = React.useState<Phase[]>([])

  const currentMeetingId = meetingId ?? currentMeeting?.id

  const toLocalMidnight = React.useCallback((dateString?: string | null): Date | null => {
    if (!dateString) {
      return null
    }

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return null
    }

    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  React.useEffect(() => {
    const fetchPhases = async () => {
      if (!currentMeetingId) {
        return
      }

      try {
        const apiClient = await buildApiClient()
        const { data: phaseData, error } = await apiClient.GET(
          '/meetings/{meetingId}/phases',
          {
            params: {
              path: { meetingId: currentMeetingId },
            },
          }
        )

        if (error || !phaseData) {
          return
        }

        const phasesData = phaseData || []
        setPhases(phasesData)

        interface PhaseSnake {
          order_index?: number
        }

        interface KeyDatesShape {
          keyDates?: string | Record<string, unknown>
        }

        const sortedPhases = [...phasesData].sort(
          (firstPhase: Phase, secondPhase: Phase) =>
            (firstPhase.orderIndex ?? (firstPhase as PhaseSnake).order_index ?? 0) -
            (secondPhase.orderIndex ?? (secondPhase as PhaseSnake).order_index ?? 0)
        )

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const candidateDates: Date[] = []

        for (const phase of sortedPhases) {
          const rawKeyDates = (phase as KeyDatesShape).keyDates

          if (!rawKeyDates) {
            continue
          }

          try {
            const keyDates =
              typeof rawKeyDates === 'string'
                ? (JSON.parse(rawKeyDates) as Record<string, unknown>)
                : rawKeyDates

            const normalizedKeyDates = keyDates as {
              preFilingDate?: string
              pre_filing_date?: string
              brokerSearchDate?: string
              broker_search_date?: string
              recordDate?: string
              record_date?: string
              filingDate?: string
              filing_date?: string
              mailingDate?: string
              mailing_date?: string
              meetingDate?: string
              meeting_date?: string
            }

            const values = [
              normalizedKeyDates.preFilingDate,
              normalizedKeyDates.pre_filing_date,
              normalizedKeyDates.brokerSearchDate,
              normalizedKeyDates.broker_search_date,
              normalizedKeyDates.recordDate,
              normalizedKeyDates.record_date,
              normalizedKeyDates.filingDate,
              normalizedKeyDates.filing_date,
              normalizedKeyDates.mailingDate,
              normalizedKeyDates.mailing_date,
              normalizedKeyDates.meetingDate,
              normalizedKeyDates.meeting_date,
            ].filter(Boolean) as string[]

            values.forEach((value) => {
              const candidate = toLocalMidnight(value)

              if (candidate && candidate.getTime() > today.getTime()) {
                candidateDates.push(candidate)
              }
            })
          } catch {
            // Ignore malformed date blobs from the mock API
          }
        }

        if (candidateDates.length > 0) {
          candidateDates.sort(
            (firstDate, secondDate) => firstDate.getTime() - secondDate.getTime()
          )
          setNextPhaseDate(candidateDates[0])
        } else if (currentMeeting?.meetingDate) {
          setNextPhaseDate(toLocalMidnight(currentMeeting.meetingDate))
        }

        if (currentMeeting?.cutoffDate) {
          setVoteCutoffDate(toLocalMidnight(currentMeeting.cutoffDate))
          return
        }

        if (currentMeeting?.meetingDate) {
          const meetingLocal = toLocalMidnight(currentMeeting.meetingDate)

          if (meetingLocal) {
            const cutoffDate = new Date(meetingLocal)
            cutoffDate.setDate(cutoffDate.getDate() - 2)
            setVoteCutoffDate(cutoffDate)
          }
        }
      } catch (error) {
        console.error('Error fetching phases:', error)
      }
    }

    void fetchPhases()
  }, [
    currentMeetingId,
    currentMeeting?.cutoffDate,
    currentMeeting?.meetingDate,
    toLocalMidnight,
  ])

  React.useEffect(() => {
    const fetchCurrentTabulation = async () => {
      if (!currentMeetingId) {
        setData(null)
        return
      }

      try {
        const apiClient = await buildApiClient()
        const summary = await fetchMeetingSummary(apiClient, {
          id: currentMeetingId,
          title: currentMeeting?.title,
          meetingDate: currentMeeting?.meetingDate,
          status: currentMeeting?.status,
        })

        setData(summary)
      } catch (error) {
        console.error('Error fetching tabulation data:', error)
        setData(
          createEmptySummary({
            id: currentMeetingId,
            title: currentMeeting?.title,
            meetingDate: currentMeeting?.meetingDate,
            status: currentMeeting?.status,
          })
        )
      }
    }

    void fetchCurrentTabulation()
  }, [
    currentMeeting?.meetingDate,
    currentMeeting?.status,
    currentMeeting?.title,
    currentMeetingId,
  ])

  React.useEffect(() => {
    const fetchHistoricalTabulation = async () => {
      if (!currentMeetingId) {
        setHistoricalDataStatus('idle')
        setHistoricalData([])
        return
      }

      if (!currentMeeting?.ticker || !currentMeeting?.meetingType) {
        setHistoricalDataStatus('idle')
        setHistoricalData([])
        return
      }

      if (isSpecialMeeting(currentMeeting.meetingType)) {
        setHistoricalDataStatus('idle')
        setHistoricalData([])
        return
      }

      try {
        setHistoricalDataStatus('loading')
        const apiClient = await buildApiClient()
        const comparableMeetingsResult = (await apiClient.GET('/meetings', {
          params: {
            query: {
              ticker: currentMeeting.ticker,
              limit: 250,
            },
          },
        })) as {
          data?: { meetings?: Meeting[] } | Meeting[]
          error?: unknown
        }

        if (comparableMeetingsResult.error) {
          throw new Error('Failed to fetch comparable meetings')
        }

        const rawMeetings = Array.isArray(comparableMeetingsResult.data)
          ? comparableMeetingsResult.data
          : (comparableMeetingsResult.data?.meetings ?? [])
        const comparableMeetings = rawMeetings
          .filter((meeting) => meeting.id)
          .filter((meeting) => meeting.meetingType === currentMeeting.meetingType)
          .filter((meeting) =>
            currentMeeting.cusip ? meeting.cusip === currentMeeting.cusip : true
          )
          .filter(
            (meeting) => meeting.id === currentMeetingId || meeting.status === 'COMPLETE'
          )
          .sort(sortMeetingsBySeriesOrder)

        const nextHistoricalData: HistoricalTabulationPoint[] = []

        for (const comparableMeeting of comparableMeetings) {
          if (!comparableMeeting.id) {
            continue
          }

          const summary = await fetchMeetingSummary(apiClient, comparableMeeting)

          nextHistoricalData.push({
            meetingId: summary.meeting_id,
            yearLabel:
              comparableMeeting.meetingYear?.toString() ||
              parseMeetingYearInfo(summary.meeting_id)?.currentYear?.toString() ||
              'Unknown',
            votedShares: Number(summary.shares_voted),
            unvotedShares: Number(summary.shares_unvoted),
            isCurrentMeeting: comparableMeeting.id === currentMeetingId,
          })
        }

        setHistoricalData(nextHistoricalData)
        setHistoricalDataStatus('loaded')
      } catch (error) {
        console.error('Error fetching previous year data:', error)
        setHistoricalData([])
        setHistoricalDataStatus('loaded')
      }
    }

    void fetchHistoricalTabulation()
  }, [
    currentMeeting?.cusip,
    currentMeeting?.meetingType,
    currentMeeting?.ticker,
    currentMeetingId,
  ])

  const routePhaseNumber =
    typeof phase === 'string' ? Number.parseInt(phase.trim(), 10) : Number.NaN
  const meetingPhaseNumber = currentMeeting?.currentPhase
    ? Number.parseInt(currentMeeting.currentPhase.replace('Phase ', '') || '0', 10)
    : Number.NaN
  const currentPhaseNumber = Number.isFinite(routePhaseNumber)
    ? routePhaseNumber
    : Number.isFinite(meetingPhaseNumber)
      ? meetingPhaseNumber
      : 0

  const isVotingPhaseFromMeeting = currentPhaseNumber >= 6
  const isVotingPhaseFromPhases = phases.some(
    (phase) =>
      (phase.orderIndex ?? 0) >= 6 &&
      ((phase.status as string) === 'ACTIVE' ||
        phase.status === 'COMPLETE' ||
        phase.status === 'IN_PROGRESS')
  )
  const isVotingPhase = isVotingPhaseFromMeeting || isVotingPhaseFromPhases
  const currentData = data?.meeting_id === currentMeetingId ? data : null
  const currentVotePercentage = currentData
    ? Number.parseFloat(currentData.vote_percentage)
    : 0

  const progress =
    currentData && isVotingPhase
      ? {
          voted: Math.round(currentVotePercentage),
          unvoted: 100 - Math.round(currentVotePercentage),
        }
      : { voted: 0, unvoted: 0 }

  const meetingStatus = currentData?.status || currentMeeting?.status || ''
  const isCompleted = meetingStatus === 'COMPLETE' || meetingStatus === 'completed'
  const meetingDateValue = currentData?.meeting_date || currentMeeting?.meetingDate || ''
  const meetingDate = meetingDateValue ? new Date(meetingDateValue) : null
  const showHistoricalComparison = currentPhaseNumber >= 7
  const shouldShowPreviousYearInfo =
    showHistoricalComparison && !isSpecialMeeting(currentMeeting?.meetingType)
  const previousComparableMeetings = historicalData.filter(
    (point) => !point.isCurrentMeeting
  )
  const currentMeetingSeriesIndex = historicalData.findIndex(
    (point) => point.isCurrentMeeting
  )
  const previousComparablePoint =
    currentMeetingSeriesIndex > 0 ? historicalData[currentMeetingSeriesIndex - 1] : null
  const hasHistoricalSparkline =
    shouldShowPreviousYearInfo &&
    historicalDataStatus === 'loaded' &&
    previousComparableMeetings.length >= 2
  const shouldReserveHistoricalLayout = true
  const summaryMetrics = [
    {
      label: isCompleted ? 'Meeting Date' : 'Days to Meeting',
      value:
        isCompleted && meetingDate
          ? meetingDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : meetingDate
            ? calculateDaysUntil(meetingDate.toISOString())
            : '--',
      secondarySx: undefined as Record<string, unknown> | undefined,
    },
    ...(isCompleted
      ? [
          {
            label: 'Total Positions',
            value: currentData ? currentData.total_positions.toLocaleString() : '--',
            secondarySx: undefined as Record<string, unknown> | undefined,
          },
          {
            label: 'Positions Voted',
            value: currentData ? currentData.positions_voted.toLocaleString() : '--',
            secondarySx: { whiteSpace: 'nowrap' } as Record<string, unknown>,
          },
        ]
      : [
          {
            label: 'Vote Cutoff',
            value: voteCutoffDate
              ? `${voteCutoffDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })} 11:59 PM ET`
              : '0',
            secondarySx: { whiteSpace: 'nowrap' } as Record<string, unknown>,
          },
        ]),
    ...(!shouldReserveHistoricalLayout
      ? [
          {
            label: 'Shares Voted',
            value:
              currentData && isVotingPhase
                ? Number(currentData.shares_voted).toLocaleString()
                : '0',
            secondarySx: undefined as Record<string, unknown> | undefined,
          },
          {
            label: 'Shares Unvoted',
            value:
              currentData && isVotingPhase
                ? Number(currentData.shares_unvoted).toLocaleString()
                : '0',
            secondarySx: undefined as Record<string, unknown> | undefined,
          },
        ]
      : []),
  ]
  const desktopMetricColumns = summaryMetrics.length
  const summaryGridTemplateColumns = {
    xs: 'repeat(2, minmax(0, 1fr))',
    sm: 'repeat(3, minmax(0, 1fr))',
    md: `48px repeat(${desktopMetricColumns}, minmax(0, auto))`,
  }

  const historicalVotedSeries = historicalData.map((point) => point.votedShares)
  const historicalUnvotedSeries = historicalData.map((point) => point.unvotedShares)
  const historicalYearLabels = historicalData.map((point) => point.yearLabel)
  const theme = useTheme()
  const sparklineStrokeColor = theme.vars?.palette.keydate.dark || '#004d73'
  const votedAreaColor = `rgba(${theme.vars?.palette.keydate.darkChannel || '0 77 115'} / 0.1)`
  const unvotedAreaColor = `rgba(${theme.vars?.palette.keydate.darkChannel || '0 77 115'} / 0.1)`

  const votedSettings: SparkLineChartProps = {
    data: historicalVotedSeries,
    area: true,
    baseline: 'min',
    color: sparklineStrokeColor,
    yAxis: {
      domainLimit: buildSparklineDomain(historicalVotedSeries),
    },
    slotProps: {
      area: { style: { opacity: 1, fill: votedAreaColor } },
      line: { style: { strokeWidth: 2, stroke: sparklineStrokeColor } },
      lineHighlight: { r: 4 },
    },
    clipAreaOffset: { top: 2, bottom: 2 },
    axisHighlight: { x: 'line' },
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  }

  const unvotedSettings: SparkLineChartProps = {
    data: historicalUnvotedSeries,
    area: true,
    baseline: 'min',
    color: sparklineStrokeColor,
    yAxis: {
      domainLimit: buildSparklineDomain(historicalUnvotedSeries),
    },
    slotProps: {
      area: { style: { opacity: 1, fill: unvotedAreaColor } },
      line: { style: { strokeWidth: 2, stroke: sparklineStrokeColor } },
      lineHighlight: { r: 4 },
    },
    clipAreaOffset: { top: 2, bottom: 2 },
    axisHighlight: { x: 'line' },
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  }

  const sparklineCardSx = {
    backgroundColor: theme.vars?.palette.keydate.main,
    color: theme.vars?.palette.keydate.contrastText,
    borderRadius: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
    minHeight: shouldShowPreviousYearInfo ? 110 : 105,
    '& > div ': {
      pt: 1,
      pb: shouldShowPreviousYearInfo ? 0 : 1,
      px: 1,
    },
  }

  return (
    <Grid container spacing={2} sx={{ mt: 1, alignItems: 'stretch' }}>
      <Grid size={{ xs: 12, lg: shouldReserveHistoricalLayout ? 6 : 12 }}>
        <Paper
          sx={{
            backgroundColor: (muiTheme) => muiTheme.vars?.palette.keydate.main,
            color: (muiTheme) => muiTheme.vars?.palette.keydate.contrastText,
            contain: 'paint',
            borderRadius: 1,
            p: 1,
            pb: 0,
            position: 'relative',
            px: 2,
            height: '100%',
            minHeight: {
              xs: '105.6px',
              lg: shouldReserveHistoricalLayout ? '110.6px' : '105.6px',
            },
          }}
        >
          <Fade in timeout={1000} appear>
            <Box
              display="grid"
              gridTemplateColumns={{
                ...summaryGridTemplateColumns,
              }}
              sx={{
                alignItems: 'start',
                gap: 1,
                paddingBottom: { xs: 4, sm: 4, md: 3 },
                transition: 'grid-template-columns 0.3s ease',
              }}
            >
              <CalendarIcon
                sx={{
                  fontSize: 40,
                  color: 'inherit',
                  display: { xs: 'none', md: 'block' },
                  alignSelf: 'center',
                }}
              />
              {summaryMetrics.map((metric) => (
                <Box key={metric.label} sx={{ minWidth: 0 }}>
                  <BNTypographyPair
                    alignItems={{ sx: 'start', md: 'start' }}
                    fullWidth
                    primary={{
                      variant: 'body2',
                      fontWeight: 500,
                      text: metric.label,
                      sx: { whiteSpace: 'nowrap' },
                    }}
                    secondary={{
                      variant: 'h2',
                      fontWeight: 600,
                      text: metric.value,
                      sx: metric.secondarySx,
                    }}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      textAlign: 'left',
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Fade>

          <Fade in timeout={500}>
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                position: 'absolute',
                bottom: 0,
                left: 0,
                overflow: 'hidden',
              }}
            >
              <Box
                component={motion.div}
                initial={{ width: 0 }}
                animate={{ width: `${progress.voted}%` }}
                transition={{ duration: 1.5, type: 'tween', ease: 'easeInOut' }}
                sx={{
                  background: (muiTheme) => muiTheme.vars?.palette.keydate.dark,
                  px: 1,
                  py: 0,
                  minWidth: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'end',
                }}
              >
                <Typography
                  noWrap
                  variant="body3"
                  fontWeight={600}
                  sx={{
                    color: (muiTheme) => muiTheme.palette.common.white,
                  }}
                >
                  {progress.voted}% Voted
                </Typography>
              </Box>
              <Box
                sx={(muiTheme) => ({
                  background: `rgba(${muiTheme.vars?.palette.keydate.darkChannel} / 0.1)`,
                  px: 1,
                  py: 0.25,
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                })}
              >
                <Typography
                  noWrap
                  variant="body3"
                  fontWeight={600}
                  sx={(muiTheme) => ({
                    color: muiTheme.vars?.palette.keydate.contrastText,
                  })}
                >
                  {progress.unvoted}% Not Voted
                </Typography>
              </Box>
            </Box>
          </Fade>
        </Paper>
      </Grid>
      {shouldReserveHistoricalLayout && (
        <>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Paper sx={sparklineCardSx}>
              <BNTypographyPair
                alignItems={{ sx: 'start', md: 'end' }}
                fullWidth
                primary={{
                  variant: 'body2',
                  fontWeight: 500,
                  text: 'Shares Voted',
                  sx: { whiteSpace: 'nowrap' },
                }}
                secondary={{
                  variant: 'h2',
                  fontWeight: 600,
                  text:
                    currentData && isVotingPhase
                      ? Number(currentData.shares_voted).toLocaleString()
                      : '0',
                }}
                sx={{ flex: 1 }}
              />

              {shouldShowPreviousYearInfo ? (
                <Stack direction="row" alignItems="center" gap={1} justifyContent="end">
                  <Typography variant="body3">Previous year:</Typography>
                  {previousComparablePoint ? (
                    <Typography variant="body3" fontWeight={600} color="inherit">
                      {previousComparablePoint.votedShares.toLocaleString()}
                    </Typography>
                  ) : (
                    <Skeleton variant="text" width={48} />
                  )}
                </Stack>
              ) : null}
              {hasHistoricalSparkline ? (
                <SparkLineChart
                  height={42}
                  showTooltip
                  showHighlight
                  xAxis={{
                    data: historicalYearLabels,
                    valueFormatter: formatSparklineAxisValue,
                  }}
                  valueFormatter={(value) => value?.toLocaleString() ?? ''}
                  margin={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  {...votedSettings}
                />
              ) : null}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Paper sx={sparklineCardSx}>
              <BNTypographyPair
                alignItems={{ sx: 'start', md: 'end' }}
                fullWidth
                primary={{
                  variant: 'body2',
                  fontWeight: 500,
                  text: 'Shares Not Voted',
                  sx: { whiteSpace: 'nowrap' },
                }}
                secondary={{
                  variant: 'h2',
                  fontWeight: 600,
                  text:
                    currentData && isVotingPhase
                      ? Number(currentData.shares_unvoted).toLocaleString()
                      : '0',
                }}
                sx={{ flex: 1 }}
              />
              {shouldShowPreviousYearInfo ? (
                <Stack direction="row" alignItems="center" justifyContent="end" gap={1}>
                  <Typography variant="body3">Previous year:</Typography>
                  {previousComparablePoint ? (
                    <Typography variant="body3" fontWeight={600} color="inherit">
                      {previousComparablePoint.unvotedShares.toLocaleString()}
                    </Typography>
                  ) : (
                    <Skeleton variant="text" width={48} />
                  )}
                </Stack>
              ) : null}
              {hasHistoricalSparkline ? (
                <SparkLineChart
                  height={42}
                  showTooltip
                  showHighlight
                  xAxis={{
                    data: historicalYearLabels,
                    valueFormatter: formatSparklineAxisValue,
                  }}
                  valueFormatter={(value) => value?.toLocaleString() ?? ''}
                  margin={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  {...unvotedSettings}
                />
              ) : null}
            </Paper>
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default TabulationTracker
