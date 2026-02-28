'use client'

import { BNTypographyPair } from '@rolemodel/betanxt-design-system/components/BNTypographyPair'
import { motion } from 'motion/react'
import React, { useEffect, useState } from 'react'

import {
  ArrowDownward,
  ArrowUpwardSharp,
  CalendarTodayOutlined as CalendarIcon,
} from '@mui/icons-material'
import { Paper, useMediaQuery, useTheme } from '@mui/material'
import { Box, Fade, Stack, Typography } from '@mui/material'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { useMeeting } from '@/contexts/MeetingContext'
import { calculateDaysUntil } from '@/utils/dateUtils'

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

interface TabulationTrackerProps {
  meetingId?: string
}

const TabulationTracker: React.FC<TabulationTrackerProps> = ({ meetingId }) => {
  // Get data from shared MeetingContext
  const { currentMeeting } = useMeeting()
  const [data, setData] = useState<TabulationData | null>(null)
  const [previousYearData, setPreviousYearData] = useState<TabulationData | null>(null)
  const [loading, setLoading] = useState(false) // Don't start as loading to prevent double LinearProgress
  const [loadingProgress, setLoadingProgress] = useState(0)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [_nextPhaseDate, setNextPhaseDate] = useState<Date | null>(null)
  const [voteCutoffDate, setVoteCutoffDate] = useState<Date | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])

  // Use meetingId from props (URL) as source of truth instead of context
  // Context might lag behind during navigation
  const currentMeetingId = meetingId ?? currentMeeting?.id

  // Animate loading progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (loading) {
      setLoadingProgress(0)
      let currentProgress = 0

      interval = setInterval(() => {
        currentProgress += 2 // Increment by 2% each time for smooth progression
        if (currentProgress >= 95) {
          setLoadingProgress(95) // Stop at 95% until data loads
          if (interval) clearInterval(interval)
        } else {
          setLoadingProgress(currentProgress)
        }
      }, 50) // Update every 50ms for smoother animation
    } else if (!loading && loadingProgress > 0) {
      // Complete the progress when loading finishes
      setLoadingProgress(100)
      setTimeout(() => setLoadingProgress(0), 300) // Reset after completion
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loading, loadingProgress])

  // Helpers for timezone-safe local day math
  const toLocalMidnight = (dateString?: string | null): Date | null => {
    if (!dateString) return null
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return null
    d.setHours(0, 0, 0, 0)
    return d
  }

  const _daysUntilDate = (d: Date): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(d)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Fetch phases to get next phase date and vote cutoff
  useEffect(() => {
    const fetchPhases = async () => {
      if (!currentMeetingId) return

      try {
        const apiClient = await buildApiClient()
        const { data, error } = await apiClient.GET('/meetings/{meetingId}/phases', {
          params: {
            path: { meetingId: currentMeetingId },
          },
        })
        if (!error && data) {
          const phasesData = data || []
          setPhases(phasesData)

          // Support both camelCase and snake_case fields from API
          interface PhaseSnake {
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
            const raw = (ph as { keyDates?: string | Record<string, unknown> }).keyDates
            if (!raw) continue
            try {
              const kdObj =
                typeof raw === 'string'
                  ? (JSON.parse(raw) as Record<string, unknown>)
                  : raw
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
            } catch {
              // Ignore date parsing errors
            }
          }

          if (candidateDates.length > 0) {
            candidateDates.sort((a, b) => a.getTime() - b.getTime())
            selectedDate = candidateDates[0]
          }

          // Final fallback: if no reasonable phase date found, use meeting date
          if (!selectedDate && currentMeeting?.meetingDate) {
            selectedDate = toLocalMidnight(currentMeeting.meetingDate)
          }

          setNextPhaseDate(selectedDate)

          // Use cutoffDate from meeting if available, otherwise calculate as 2 days before meeting date
          if (currentMeeting?.cutoffDate) {
            setVoteCutoffDate(toLocalMidnight(currentMeeting.cutoffDate))
          } else if (currentMeeting?.meetingDate) {
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

    void fetchPhases()
  }, [currentMeetingId, currentMeeting?.meetingDate, currentMeeting?.cutoffDate])

  // Fetch previous year's meeting data
  useEffect(() => {
    const fetchPreviousYearData = async () => {
      if (!currentMeetingId) return

      try {
        // Extract meeting type and year from current meeting ID
        // Format: ticker-meetingType-year (e.g., "wen-special-meeting-2026")
        const idParts = currentMeetingId.split('-')
        if (idParts.length < 4) return // ticker-meeting-type-year

        const currentYear = parseInt(idParts[idParts.length - 1])
        const baseId = idParts.slice(0, -1).join('-') // e.g., "wen-special-meeting"

        const apiClient = await buildApiClient()

        // Try to find the most recent previous year meeting (search up to 3 years back)
        let prevMeeting: Meeting | null = null

        for (let yearOffset = 1; yearOffset <= 3; yearOffset++) {
          const previousMeetingId = `${baseId}-${currentYear - yearOffset}`
          const result = (await apiClient.GET('/meetings/{meetingId}', {
            params: { path: { meetingId: previousMeetingId } },
          })) as { data?: Meeting; error?: unknown }

          if (!result.error && result.data) {
            prevMeeting = result.data
            break
          }
        }

        // Only fetch tabulation data if meeting exists
        if (prevMeeting?.id) {
          // Try to get tabulation report first
          const tabulationResult = (await apiClient.GET(
            '/meetings/{meetingId}/tabulation-report',
            {
              params: {
                path: { meetingId: prevMeeting.id },
              },
            }
          )) as { data?: TabulationReport; error?: unknown }

          if (!tabulationResult.error && tabulationResult.data) {
            // Use tabulation report data
            const report = tabulationResult.data
            const positionsVoted = report.positionsVoted
            const totalPositions =
              (positionsVoted?.voted ?? 0) + (positionsVoted?.unvoted ?? 0)
            const votedPositions = positionsVoted?.voted ?? 0
            const totalShares = positionsVoted?.totalShares ?? 0
            const votedShares = positionsVoted?.votedShares ?? 0
            const votePercentage = totalShares > 0 ? (votedShares / totalShares) * 100 : 0

            const nonDtc = report.nonDtcVoteStatus
            const webVotes = nonDtc?.webShareholders ?? 0
            const paperVotes = nonDtc?.printShareholders ?? 0
            const phoneVotes = nonDtc?.ivrShareholders ?? 0

            setPreviousYearData({
              meeting_id: prevMeeting.id ?? '',
              meeting_title: prevMeeting.title ?? '',
              meeting_date: prevMeeting.meetingDate ?? '',
              total_positions: totalPositions,
              positions_voted: votedPositions,
              total_shares: totalShares.toString(),
              shares_voted: votedShares.toString(),
              shares_unvoted: (totalShares - votedShares).toString(),
              vote_percentage: votePercentage.toFixed(2),
              web_votes: webVotes,
              paper_votes: paperVotes,
              phone_votes: phoneVotes,
              status: prevMeeting.status ?? '',
            })
          } else {
            // Fallback to positions data if tabulation report not available
            const positionsResult = (await apiClient.GET('/positions', {
              params: { query: { meetingId: prevMeeting.id } },
            })) as { data?: { positions?: Position[] }; error?: unknown }

            const positions = positionsResult.data?.positions
            if (
              !positionsResult.error &&
              positions &&
              Array.isArray(positions) &&
              positions.length > 0
            ) {
              // Calculate tabulation data for previous year as fallback
              const totalPositions = positions.length
              const votedPositions = positions.filter(
                (p) => p.voteStatus === 'Voted'
              ).length
              const totalShares = positions.reduce((sum, p) => sum + (p.shares ?? 0), 0)
              const votedShares = positions
                .filter((p) => p.voteStatus === 'Voted')
                .reduce((sum, p) => sum + (p.sharesVoted ?? p.shares ?? 0), 0)
              const votePercentage =
                totalShares > 0 ? (votedShares / totalShares) * 100 : 0

              setPreviousYearData({
                meeting_id: prevMeeting.id ?? '',
                meeting_title: prevMeeting.title ?? '',
                meeting_date: prevMeeting.meetingDate ?? '',
                total_positions: totalPositions,
                positions_voted: votedPositions,
                total_shares: totalShares.toString(),
                shares_voted: votedShares.toString(),
                shares_unvoted: (totalShares - votedShares).toString(),
                vote_percentage: votePercentage.toFixed(2),
                web_votes: 0,
                paper_votes: 0,
                phone_votes: 0,
                status: prevMeeting.status ?? '',
              })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching previous year data:', error)
      }
    }

    void fetchPreviousYearData()
  }, [currentMeetingId])

  // Fetch tabulation data from API instead of calculating locally
  useEffect(() => {
    const fetchTabulationData = async () => {
      if (!currentMeetingId) {
        setLoading(false) // No meeting data, stop loading
        return
      }

      setLoading(true)
      try {
        const meetingTitle = currentMeeting?.title ?? ''
        const meetingDate = currentMeeting?.meetingDate ?? ''
        const meetingStatus = currentMeeting?.status ?? ''

        const apiClient = await buildApiClient()
        const { data: tabulationReport, error } = (await apiClient.GET(
          '/meetings/{meetingId}/tabulation-report',
          {
            params: {
              path: { meetingId: currentMeetingId },
            },
          }
        )) as { data?: TabulationReport; error?: unknown }

        if (!error && tabulationReport) {
          // Transform API response to match component's expected format
          const positionsVoted = tabulationReport.positionsVoted
          const totalPositions =
            (positionsVoted?.voted ?? 0) + (positionsVoted?.unvoted ?? 0)
          const votedPositions = positionsVoted?.voted ?? 0
          const totalShares = positionsVoted?.totalShares ?? 0
          const votedShares = positionsVoted?.votedShares ?? 0
          const votePercentage = totalShares > 0 ? (votedShares / totalShares) * 100 : 0

          // Extract vote counts from non-DTC data
          const nonDtc = tabulationReport.nonDtcVoteStatus
          const webVotes = nonDtc?.webShareholders ?? 0
          const paperVotes = nonDtc?.printShareholders ?? 0
          const phoneVotes = nonDtc?.ivrShareholders ?? 0

          setData({
            meeting_id: currentMeetingId,
            meeting_title: meetingTitle,
            meeting_date: meetingDate,
            total_positions: totalPositions,
            positions_voted: votedPositions,
            total_shares: totalShares.toString(),
            shares_voted: votedShares.toString(),
            shares_unvoted: (totalShares - votedShares).toString(),
            vote_percentage: votePercentage.toFixed(2),
            web_votes: webVotes,
            paper_votes: paperVotes,
            phone_votes: phoneVotes,
            status: meetingStatus,
          })
        } else {
          // Fallback to positions-based calculation when tabulation report doesn't exist
          try {
            const positionsResult = (await apiClient.GET('/positions', {
              params: { query: { meetingId: currentMeetingId } },
            })) as { data?: { positions?: Position[] }; error?: unknown }

            const positions = positionsResult.data?.positions
            if (!positionsResult.error && positions && Array.isArray(positions)) {
              // Calculate tabulation data from positions as fallback
              const totalPositions = positions.length
              const votedPositions = positions.filter(
                (p) => p.voteStatus === 'Voted'
              ).length
              const totalShares = positions.reduce((sum, p) => sum + (p.shares ?? 0), 0)
              const votedShares = positions
                .filter((p) => p.voteStatus === 'Voted')
                .reduce((sum, p) => sum + (p.sharesVoted ?? p.shares ?? 0), 0)
              const votePercentage =
                totalShares > 0 ? (votedShares / totalShares) * 100 : 0

              // Count by vote source
              const webVotes = positions.filter((p) => p.source === 'WEB').length
              const paperVotes = positions.filter((p) => p.source === 'PRINT').length
              const phoneVotes = positions.filter((p) => p.source === 'IVR').length

              // Using fallback calculation based on positions data

              setData({
                meeting_id: currentMeetingId,
                meeting_title: meetingTitle,
                meeting_date: meetingDate,
                total_positions: totalPositions,
                positions_voted: votedPositions,
                total_shares: totalShares.toString(),
                shares_voted: votedShares.toString(),
                shares_unvoted: (totalShares - votedShares).toString(),
                vote_percentage: votePercentage.toFixed(2),
                web_votes: webVotes,
                paper_votes: paperVotes,
                phone_votes: phoneVotes,
                status: meetingStatus,
              })
            } else {
              // Empty data if no positions available either
              setData({
                meeting_id: currentMeetingId,
                meeting_title: meetingTitle,
                meeting_date: meetingDate,
                total_positions: 0,
                positions_voted: 0,
                total_shares: '0',
                shares_voted: '0',
                shares_unvoted: '0',
                vote_percentage: '0.00',
                web_votes: 0,
                paper_votes: 0,
                phone_votes: 0,
                status: meetingStatus,
              })
            }
          } catch (fallbackError) {
            console.error('Fallback positions calculation failed:', fallbackError)
            // Final fallback to empty data
            setData({
              meeting_id: currentMeetingId,
              meeting_title: meetingTitle,
              meeting_date: meetingDate,
              total_positions: 0,
              positions_voted: 0,
              total_shares: '0',
              shares_voted: '0',
              shares_unvoted: '0',
              vote_percentage: '0.00',
              web_votes: 0,
              paper_votes: 0,
              phone_votes: 0,
              status: meetingStatus,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching tabulation data:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchTabulationData()
    // Only depend on meeting ID - extract other values inside effect to avoid re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMeetingId])

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

  // Only use data if it matches the current meeting - otherwise show loading/empty state
  // If no data yet, also return null
  const currentData = data?.meeting_id === currentMeetingId ? data : null

  // Get quorum requirement from meeting (percentage)
  const currentVotePercentage = currentData ? parseFloat(currentData.vote_percentage) : 0

  const progress =
    currentData && isVotingPhase
      ? {
        voted: Math.round(currentVotePercentage),
        unvoted: 100 - Math.round(currentVotePercentage),
        toQuorum: Math.round(currentVotePercentage),
      }
      : { voted: 0, unvoted: 0, toQuorum: 0 }

  // Meeting status determines what data to show
  const isCompleted =
    currentData?.status === 'COMPLETE' ||
    currentData?.status === 'completed' ||
    currentMeeting?.status === 'COMPLETE'
  const meetingDate = currentData?.meeting_date
    ? new Date(currentData.meeting_date)
    : null

  const isPhase7 = (currentPhaseNumber ?? 0) < 7

  return (
    <Paper
      sx={{
        backgroundColor: (theme) => theme.vars?.palette.keydate.main,
        color: (theme) => theme.vars?.palette.keydate.contrastText,
        contain: 'paint',
        borderRadius: 1,
        p: 1,
        pb: 0,
        position: 'relative',
        px: 2,
        minHeight: !isPhase7 && !isMobile ? '105.6px' : '86px',
      }}
    >
      <Fade in={true} timeout={1000} appear>
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
            md:
              isPhase7 && previousYearData
                ? 'min-content repeat(5, auto)'
                : 'min-content repeat(6, auto)',
          }}
          sx={{
            gap: 1,
            paddingBottom: { xs: 4, sm: 4, md: 3 },
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
          <Box>
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
          </Box>

          {isCompleted && (
            <Box>
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
                  text: currentData ? currentData.total_positions.toLocaleString() : '--',
                }}
                sx={{ flex: { xs: 1, md: 0 }, whiteSpace: 'nowrap' }}
              />
            </Box>
          )}
          {isCompleted ? (
            <Box>
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
                  text: currentData ? currentData.positions_voted.toLocaleString() : '--',
                  sx: { whiteSpace: 'nowrap' },
                }}
                sx={{ flex: 1 }}
              />
            </Box>
          ) : (
            <Box>
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
                    ? `${voteCutoffDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })} 11:59 PM ET`
                    : '0',
                  sx: { whiteSpace: 'nowrap' },
                }}
                sx={{ flex: 1 }}
              />
            </Box>
          )}
          {!isPhase7 && previousYearData && !isMobile && (
            <Box
              display="flex"
              flexGrow={1}
              alignItems="flex-end"
              justifyContent="flex-end"
            >
              <Typography noWrap variant="body2" fontWeight={500}>
                Last Year
              </Typography>
            </Box>
          )}
          <Box>
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
            {!isPhase7 && previousYearData && !isMobile && (
              <Typography
                sx={{
                  justifyContent: { xs: 'start', md: 'end' },
                  display: 'flex',
                  alignItems: 'center',
                }}
                fontWeight={500}
                variant="body2"
              >
                {Number(currentData?.shares_voted ?? 0) >
                  Number(previousYearData.shares_voted) ? (
                  <ArrowUpwardSharp fontSize="inherit" />
                ) : (
                  <ArrowDownward fontSize="inherit" />
                )}
                {Number(previousYearData.shares_voted).toLocaleString()}
              </Typography>
            )}
          </Box>
          <Box>
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
            {!isPhase7 && previousYearData && !isMobile && (
              <Typography
                sx={{
                  justifyContent: { xs: 'start', md: 'end' },
                  display: 'flex',
                  alignItems: 'center',
                }}
                fontWeight={500}
                variant="body2"
              >
                {Number(currentData?.shares_unvoted ?? 0) <
                  Number(previousYearData.shares_unvoted) ? (
                  <ArrowDownward fontSize="inherit" />
                ) : (
                  <ArrowUpwardSharp fontSize="inherit" />
                )}
                {Number(previousYearData.shares_unvoted).toLocaleString()}
              </Typography>
            )}
          </Box>
          {/* <Box>
            <BNTypographyPair
              fullWidth
              alignItems={{ sx: 'start', md: 'end' }}
              primary={{
                variant: 'body2',
                fontWeight: 500,
                text: 'To Quorum',
                sx: { whiteSpace: 'nowrap' },
              }}
              secondary={{
                variant: 'h2',
                fontWeight: 600,
                text: `${Math.round(progress.toQuorum)} %`,
              }}
              sx={{
                flex: 1,
              }}
            />
            {!isPhase7 && previousYearData && !isMobile && (
              <Typography
                sx={{
                  justifyContent: { xs: 'start', md: 'end' },
                  display: 'flex',
                  alignItems: 'center',
                }}
                fontWeight={500}
                variant="body2"
              >
                {Math.round(progress.toQuorum) >
                  parseFloat(previousYearData.vote_percentage) ? (
                  <ArrowUpwardSharp fontSize="inherit" />
                ) : (
                  <ArrowDownward fontSize="inherit" />
                )}
                {Math.round(parseFloat(previousYearData.vote_percentage))}%
              </Typography>
            )}
          </Box> */}
        </Stack>
      </Fade>

      {/* Progress Bar at Bottom */}
      <Fade in={true} timeout={500}>
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
              {progress.unvoted}% Not Voted
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Paper>
  )
}

export default TabulationTracker
