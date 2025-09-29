'use client'

import { BNTypographyPair } from '@rolemodel/betanxt-design-system/components/BNTypographyPair'
import { motion } from 'motion/react'
import React, { useEffect, useState } from 'react'

import { CalendarTodayOutlined as CalendarIcon } from '@mui/icons-material'
import { Box, Paper, Stack, Typography } from '@mui/material'

import buildApiClient from '@/domain-models/apiClient'
import { components } from '@/domain-models/generated-schema'

import { useMeeting } from '@/contexts/MeetingContext'
import { calculateDaysUntil } from '@/utils/dateUtils'

import { NumberCounter } from './NumberCounter'

type Phase = components['schemas']['Phase']

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

interface TabulationTrackerProps {
  meetingId?: string
}

const TabulationTracker: React.FC<TabulationTrackerProps> = ({
  meetingId: _meetingId,
}) => {
  // Get data from shared MeetingContext instead of making separate API calls
  const { currentMeeting, positions, positionsLoading } = useMeeting()
  const [data, setData] = useState<TabulationData | null>(null)

  const [nextPhaseDate, setNextPhaseDate] = useState<Date | null>(null)
  const [voteCutoffDate, setVoteCutoffDate] = useState<Date | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])

  // Helpers for timezone-safe local day math
  const toLocalMidnight = (dateString?: string | null): Date | null => {
    if (!dateString) return null
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return null
    d.setHours(0, 0, 0, 0)
    return d
  }

  const daysUntilDate = (d: Date): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(d)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Fetch phases to get next phase date and vote cutoff
  useEffect(() => {
    const fetchPhases = async () => {
      if (!currentMeeting?.id) return

      try {
        const apiClient = await buildApiClient()
        const { data, error } = await apiClient.GET('/meetings/{meetingId}/phases', {
          params: {
            path: { meetingId: currentMeeting.id },
          },
        })
        if (!error && data) {
          const phasesData = data || []
          setPhases(phasesData)

          // Support both camelCase and snake_case fields from API
          type PhaseSnake = {
            order_index?: number
            key_dates?: string | Record<string, unknown>
          }

          // Sort phases by order index for processing
          const sortedPhases = [...phasesData].sort(
            (a: Phase, b: Phase) =>
              (a.orderIndex ?? (a as unknown as PhaseSnake).order_index ?? 0) -
              (b.orderIndex ?? (b as unknown as PhaseSnake).order_index ?? 0)
          )

          // Find the earliest upcoming date across ALL phases (simplified approach)
          let selectedDate: Date | null = null
          const nowStart = new Date()
          nowStart.setHours(0, 0, 0, 0)
          const candidateDates: Date[] = []

          for (const ph of sortedPhases) {
            const raw = (ph as Phase).keyDates
            if (!raw) continue
            try {
              const kdObj = typeof raw === 'string' ? JSON.parse(raw) : raw
              const kd2 = kdObj as {
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
                kd2.preFilingDate,
                kd2.pre_filing_date,
                kd2.brokerSearchDate,
                kd2.broker_search_date,
                kd2.recordDate,
                kd2.record_date,
                kd2.filingDate,
                kd2.filing_date,
                kd2.mailingDate,
                kd2.mailing_date,
                kd2.meetingDate,
                kd2.meeting_date,
              ].filter(Boolean) as string[]
              for (const v of values) {
                const d = toLocalMidnight(v)
                if (d && d.getTime() > nowStart.getTime()) candidateDates.push(d)
              }
            } catch {}
          }

          if (candidateDates.length > 0) {
            candidateDates.sort((a, b) => a.getTime() - b.getTime())
            selectedDate = candidateDates[0]
          }

          // Final fallback: if no reasonable phase date found, use meeting date
          if (!selectedDate && currentMeeting.meetingDate) {
            selectedDate = toLocalMidnight(currentMeeting.meetingDate)
          }

          setNextPhaseDate(selectedDate)

          // Vote cutoff is typically 2 days before meeting date
          if (currentMeeting.meetingDate) {
            const meetingLocal = toLocalMidnight(currentMeeting.meetingDate)
            if (meetingLocal) {
              const cutoffDate = new Date(meetingLocal)
              cutoffDate.setDate(cutoffDate.getDate() - 2)
              setVoteCutoffDate(cutoffDate)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching phases:', error)
      }
    }

    fetchPhases()
  }, [currentMeeting?.id, currentMeeting?.meetingDate])

  // Calculate tabulation data from context instead of making API calls
  useEffect(() => {
    if (!currentMeeting) return

    try {
      // Always calculate data, even if positions are still loading
      const totalPositions = positions.length
      const votedPositions = positions.filter((p) => p.voteStatus === 'Voted').length
      const totalShares = positions.reduce((sum, p) => sum + (p.shares || 0), 0)
      const votedShares = positions
        .filter((p) => p.voteStatus === 'Voted')
        .reduce((sum, p) => sum + (p.sharesVoted || p.shares || 0), 0)
      const votePercentage = totalShares > 0 ? (votedShares / totalShares) * 100 : 0

      // Count by vote source
      const webVotes = positions.filter((p) => p.source === 'WEB').length
      const paperVotes = positions.filter((p) => p.source === 'PRINT').length
      const phoneVotes = positions.filter((p) => p.source === 'IVR').length

      setData({
        meeting_id: currentMeeting.id || '',
        meeting_title: currentMeeting.title || '',
        meeting_date: currentMeeting.meetingDate || '',
        total_positions: totalPositions,
        positions_voted: votedPositions,
        total_shares: totalShares.toString(),
        shares_voted: votedShares.toString(),
        shares_unvoted: (totalShares - votedShares).toString(),
        vote_percentage: votePercentage.toFixed(2),
        web_votes: webVotes,
        paper_votes: paperVotes,
        phone_votes: phoneVotes,
        status: currentMeeting.status || '',
      })
    } catch (error) {
      console.error('Error calculating tabulation data:', error)
    }
  }, [currentMeeting, positions, positionsLoading])

  // Calculate progress data - only show actual voting data in phase 6+
  // Check both phase data and meeting.currentPhase (which should be "Phase 6" for the WEN special meeting)
  const currentPhaseNumber = currentMeeting?.currentPhase
    ? parseInt(currentMeeting.currentPhase.replace('Phase ', '') || '0')
    : 0
  const isVotingPhaseFromMeeting = currentPhaseNumber >= 6
  const isVotingPhaseFromPhases = phases.some(
    (p) =>
      (p.orderIndex ?? 0) >= 6 &&
      ((p.status as string) === 'ACTIVE' ||
        p.status === 'COMPLETE' ||
        p.status === 'IN_PROGRESS')
  )
  const isVotingPhase = isVotingPhaseFromMeeting || isVotingPhaseFromPhases

  // Get quorum requirement from meeting (percentage)
  const currentVotePercentage = data ? parseFloat(data.vote_percentage) : 0

  const progress =
    data && isVotingPhase
      ? {
          voted: Math.round(currentVotePercentage),
          unvoted: 100 - Math.round(currentVotePercentage),
          toQuorum: Math.round(currentVotePercentage),
        }
      : { voted: 0, unvoted: 0, toQuorum: 0 }

  // Meeting status determines what data to show
  const isCompleted =
    data?.status === 'COMPLETE' ||
    data?.status === 'completed' ||
    currentMeeting?.status === 'COMPLETE'
  const meetingDate = data?.meeting_date ? new Date(data.meeting_date) : null

  const MainComponent = (
    <Paper
      elevation={5}
      sx={{
        background: (theme) => theme.vars?.palette.keydate.main,
        color: (theme) => theme.vars?.palette.keydate.contrastText,
        contain: 'paint',
        p: 1,
        pb: 0,
        position: 'relative',
        px: 2,
      }}
    >
      <Stack
        direction={'row'}
        flexWrap={'wrap'}
        display={'grid'}
        gridTemplateAreas={{
          xs: `
            "1 2"
          `,
          sm: `
            "1 2 3",
            "1 2 3"
          `,
        }}
        gridTemplateColumns={{
          xs: '1fr 1fr',
          sm: '1fr 1fr 1fr',
          md: 'min-content auto auto 1fr auto auto auto',
        }}
        sx={{
          gap: { xs: 0, sm: 0, md: 2 },
          pb: 3,
          transition: 'grid-template-areas 0.3s ease, grid-template-columns 0.3s ease',
        }}
      >
        <CalendarIcon
          sx={{
            mr: 2,
            fontSize: 40,
            color: 'inherit',
            display: { xs: 'none', md: 'block' },
          }}
        />

        <BNTypographyPair
          primary={{
            variant: 'body2',
            fontWeight: 500,
            text: isCompleted ? 'Meeting Date' : 'Days to Meeting',
            sx: { whiteSpace: 'nowrap' },
          }}
          secondary={{
            variant: 'h2',
            fontWeight: 600,
            text:
              isCompleted && meetingDate
                ? meetingDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : meetingDate
                  ? calculateDaysUntil(meetingDate.toISOString())
                  : '--',
          }}
          sx={{ flex: { xs: 1, md: 0 }, whiteSpace: 'nowrap' }}
        />

        {!isCompleted && (
          <BNTypographyPair
            primary={{
              variant: 'body2',
              fontWeight: 500,
              text: 'Days to Next Phase',
              sx: { whiteSpace: 'nowrap' },
            }}
            secondary={{
              variant: 'h2',
              fontWeight: 600,
              text: nextPhaseDate ? daysUntilDate(nextPhaseDate) : '--',
            }}
            sx={{ flex: { xs: 1, md: 0 }, whiteSpace: 'nowrap' }}
          />
        )}
        {isCompleted && (
          <BNTypographyPair
            primary={{
              variant: 'body2',
              fontWeight: 500,
              text: 'Total Positions',
              sx: { whiteSpace: 'nowrap' },
            }}
            secondary={{
              variant: 'h2',
              fontWeight: 600,
              text: data ? data.total_positions.toLocaleString() : '--',
            }}
            sx={{ flex: { xs: 1, md: 0 }, whiteSpace: 'nowrap' }}
          />
        )}
        {isCompleted ? (
          <BNTypographyPair
            primary={{
              variant: 'body2',
              fontWeight: 500,
              text: 'Positions Voted',
              sx: { whiteSpace: 'nowrap' },
            }}
            secondary={{
              variant: 'h2',
              fontWeight: 600,
              text: data ? data.positions_voted.toLocaleString() : '--',
              sx: { whiteSpace: 'nowrap' },
            }}
            sx={{ flex: 1 }}
          />
        ) : (
          <BNTypographyPair
            primary={{
              variant: 'body2',
              fontWeight: 500,
              text: 'Vote Cutoff',
              sx: { whiteSpace: 'nowrap' },
            }}
            secondary={{
              variant: 'h2',
              fontWeight: 600,
              text: voteCutoffDate
                ? voteCutoffDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : '--',
              sx: { whiteSpace: 'nowrap' },
            }}
            sx={{ flex: 1 }}
          />
        )}

        <NumberCounter
          label="Shares Voted"
          startValue={0}
          endValue={data && isVotingPhase ? Number(data.shares_voted) : 0}
        />

        <NumberCounter
          label="Shares Un-voted"
          startValue={0}
          endValue={data && isVotingPhase ? Number(data.shares_unvoted) : 0}
        />
        <NumberCounter
          label="To Quorum"
          startValue={0}
          endValue={Math.round(progress.toQuorum)}
          isPercent
        />
      </Stack>
      {/* Progress Bar at Bottom */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          position: 'absolute',
          bottom: 0,
          left: 0,
          // borderRadius: '0 0 4px 4px',
          overflow: 'hidden',
        }}
      >
        <Box
          component={motion.div}
          initial={{ width: 0 }}
          animate={{ width: `${progress.voted}%` }}
          transition={{ duration: 1.5, type: 'tween', ease: 'easeInOut' }}
          sx={{
            background: (theme) => theme.vars?.palette.keydate.dark,
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
            variant="caption"
            fontWeight={600}
            sx={{
              color: (theme) => theme.palette.common.white,
            }}
          >
            {progress.voted}% Voted
          </Typography>
        </Box>
        <Box
          sx={(theme) => ({
            background: `rgba(${theme.vars?.palette.keydate.darkChannel} / 0.1)`,
            px: 1,
            py: 0.25,
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
          })}
        >
          <Typography
            noWrap
            variant="caption"
            fontWeight={600}
            sx={(theme) => ({
              color: theme.vars?.palette.keydate.contrastText,
            })}
          >
            {progress.unvoted}% Unvoted
          </Typography>
        </Box>
      </Box>
    </Paper>
  )

  return <>{MainComponent}</>
}

export default TabulationTracker
