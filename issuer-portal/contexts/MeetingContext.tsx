'use client'

import { usePathname } from 'next/navigation'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { listMeetings } from '@/domain-models/api/meetings'
import { listPositions } from '@/domain-models/api/positions'
import { listTasksByMeetingId } from '@/domain-models/api/tasks'
import type { components } from '@/domain-models/generated-schema'
import type { Task, KeyDate, Position } from '@/types/api'

type Meeting = components['schemas']['Meeting']

interface MeetingContextType {
  currentMeeting: Meeting | null
  meetings: Meeting[]
  tasks: Task[]
  positions: Position[]
  keyDates: KeyDate[]
  isLoading: boolean
  tasksLoading: boolean
  positionsLoading: boolean
  error: string | null
  setCurrentMeeting: (meeting: Meeting | null) => void
  refreshMeetings: (ticker?: string) => Promise<void>
  refreshMeetingData: () => Promise<void> // Refresh tasks and positions for current meeting
  getMeetingById: (id: string) => Meeting | undefined
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined)

interface MeetingProviderProps {
  children: React.ReactNode
  initialMeeting?: Meeting | null
}

export function MeetingProvider({
  children,
  initialMeeting = null,
}: MeetingProviderProps) {
  const pathname = usePathname()
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(initialMeeting)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [keyDates, setKeyDates] = useState<KeyDate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extract ticker from URL
  const getTickerFromURL = useCallback((): string | undefined => {
    const tickerMatch = pathname.match(/^\/([A-Z]{2,5})\//)
    return tickerMatch?.[1]
  }, [pathname])

  // Extract meeting ID from URL
  const getMeetingIdFromURL = useCallback((): string | undefined => {
    const meetingMatch = pathname.match(/\/meeting\/([^/]+)/)
    return meetingMatch?.[1]
  }, [pathname])

  const refreshMeetings = useCallback(
    async (ticker?: string) => {
      setIsLoading(true)
      setError(null)

      try {
        // Use ticker from parameter, URL, or fetch all meetings
        const currentTicker = ticker || getTickerFromURL()
        const { data, error } = await listMeetings(
          currentTicker ? { ticker: currentTicker } : undefined
        )

        if (error) {
          console.error('Error fetching meetings:', error)
          setError('Failed to fetch meetings')
          return
        }

        // Convert API response to context format - from data.meetings
        const meetingsArray = data?.meetings ?? []
        console.log(
          'MeetingContext - Raw API meetings:',
          meetingsArray.map((m) => ({
            id: m.id,
            title: m.title,
            current_phase: m.current_phase,
            currentPhase: m.currentPhase,
            status: m.status,
          }))
        )
        const convertedMeetings = meetingsArray.map((meeting: Partial<Meeting>) => ({
          id: meeting.id,
          title: meeting.title,
          cusip: meeting.cusip,
          ticker: meeting.ticker,
          meetingDate: meeting.meetingDate,
          meetingType: meeting.meetingType,
          status: meeting.status,
          currentPhase: meeting.currentPhase || meeting.current_phase,
          overallCompletion: meeting.overallCompletion || meeting.overall_completion,
          recordDate: meeting.recordDate,
          mailingDate: meeting.mailingDate,
          client: meeting.client,
          clientId: meeting.clientId,
          // Additional fields needed by components
          preFilingDate: meeting.preFilingDate,
          filingDate: meeting.filingDate,
          brokerSearchDate: meeting.brokerSearchDate,
          distributionType: meeting.distributionType,
          transferAgent: meeting.transferAgent,
          employeeStockPlans: meeting.employeeStockPlans,
          planAdministrator: meeting.planAdministrator,
          planAdministratorContact: meeting.planAdministratorContact,
          planAdministratorContactEmail: meeting.planAdministratorContactEmail,
          solicitor: meeting.solicitor,
          solicitorEmail: meeting.solicitorEmail,
          inspector: meeting.inspector,
          documentHostingSiteLabel: meeting.documentHostingSiteLabel,
          documentHostingSiteUrl: meeting.documentHostingSiteUrl,
          eVoteSiteLabel: meeting.eVoteSiteLabel,
          eVoteSiteUrl: meeting.eVoteSiteUrl,
          ivrDialInNumber: meeting.ivrDialInNumber,
          totalSharesOutstanding: meeting.totalSharesOutstanding,
          quorumRequirement: meeting.quorumRequirement,
          createdAt: meeting.createdAt,
          updatedAt: meeting.updatedAt,
        }))

        setMeetings(convertedMeetings)

        console.log(
          'MeetingContext - All converted meetings:',
          convertedMeetings.map((m) => ({
            id: m.id,
            title: m.title,
            currentPhase: m.currentPhase,
            status: m.status,
          }))
        )

        // Auto-set current meeting based on URL
        const meetingIdFromURL = getMeetingIdFromURL()
        console.log('MeetingContext - meetingIdFromURL:', meetingIdFromURL)
        if (meetingIdFromURL && convertedMeetings.length > 0) {
          const matchingMeeting = convertedMeetings.find((m) => m.id === meetingIdFromURL)
          console.log('MeetingContext - matchingMeeting found:', matchingMeeting)
          if (
            matchingMeeting &&
            (!currentMeeting || currentMeeting.id !== matchingMeeting.id)
          ) {
            console.log(
              'MeetingContext - Setting current meeting to:',
              matchingMeeting.id,
              matchingMeeting.currentPhase
            )
            setCurrentMeeting(matchingMeeting)
          }
        }
      } catch (err) {
        console.error('Exception in refreshMeetings:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch meetings')
      } finally {
        setIsLoading(false)
      }
    },
    [getTickerFromURL, getMeetingIdFromURL, currentMeeting]
  )

  const getMeetingById = (id: string): Meeting | undefined => {
    return meetings.find((meeting) => meeting.id === id)
  }

  // Fetch tasks and positions for the current meeting
  const refreshMeetingData = useCallback(async () => {
    if (!currentMeeting?.id) return

    try {
      // Fetch tasks and positions in parallel
      setTasksLoading(true)
      setPositionsLoading(true)

      const [tasksResult, positionsResult] = await Promise.all([
        listTasksByMeetingId(currentMeeting.id),
        listPositions({ meetingId: currentMeeting.id }),
      ])

      // Handle tasks
      if (tasksResult.error) {
        console.error('Error fetching tasks:', tasksResult.error)
      } else {
        const taskData = tasksResult.data || []
        setTasks(
          taskData.map((task: Partial<Task>) => ({
            id: task.id || '',
            title: task.title || '',
            description: task.description || null,
            owner: task.owner || 'BetaNXT',
            dueDate: task.dueDate || null,
            status: task.status || 'INCOMPLETE',
            meetingId: task.meetingId || '',
            phaseId: task.phaseId || '',
            phaseNumber: task.phaseNumber || 0,
            type: (task.type || 'external') as Task['type'],
          }))
        )
      }

      // Handle positions
      if (positionsResult.error) {
        console.error('Error fetching positions:', positionsResult.error)
      } else {
        const positionData = (positionsResult.data ?? []) as unknown[]
        setPositions(
          positionData.map((pos) => {
            const p = pos as {
              id?: string
              meetingId?: string
              shares?: number
              sharesVoted?: number
              voteStatus?: string
              source?: 'WEB' | 'PRINT' | 'IVR' | null
            }
            return {
              id: p.id ?? '',
              meetingId: p.meetingId ?? '',
              shares: p.shares ?? 0,
              sharesVoted: p.sharesVoted ?? 0,
              voteStatus: p.voteStatus ?? '',
              source: p.source ?? '',
            }
          })
        )
      }

      // Extract key dates from meeting object with correct phase assignments
      const extractedKeyDates: KeyDate[] = []

      if (currentMeeting.preFilingDate) {
        extractedKeyDates.push({
          id: 'pre-filing-date',
          title: 'Pre Filing Date',
          date: currentMeeting.preFilingDate,
          phaseNumber: 1,
        })
      }

      if (currentMeeting.filingDate) {
        extractedKeyDates.push({
          id: 'filing-date',
          title: 'Filing Date',
          date: currentMeeting.filingDate,
          phaseNumber: 1,
        })
      }

      if (currentMeeting.brokerSearchDate) {
        extractedKeyDates.push({
          id: 'broker-search-date',
          title: 'Broker Search Date',
          date: currentMeeting.brokerSearchDate,
          phaseNumber: 2,
        })
      }

      if (currentMeeting.recordDate) {
        extractedKeyDates.push({
          id: 'record-date',
          title: 'Record Date',
          date: currentMeeting.recordDate,
          phaseNumber: 3,
        })
      }

      if (currentMeeting.mailingDate) {
        extractedKeyDates.push({
          id: 'mailing-date',
          title: 'Mailing Date',
          date: currentMeeting.mailingDate,
          phaseNumber: 4,
        })
      }

      if (currentMeeting.meetingDate) {
        extractedKeyDates.push({
          id: 'meeting-date',
          title: 'Meeting Date',
          date: currentMeeting.meetingDate,
          phaseNumber: 7,
        })
      }

      setKeyDates(extractedKeyDates)
    } catch (err) {
      console.error('Error refreshing meeting data:', err)
    } finally {
      setTasksLoading(false)
      setPositionsLoading(false)
    }
  }, [currentMeeting?.id])

  // Only refetch when ticker changes, not on every pathname change
  useEffect(() => {
    const currentTicker = getTickerFromURL()
    const currentMeetingId = getMeetingIdFromURL()

    if (
      currentTicker &&
      (meetings.length === 0 || !meetings.some((m) => m.ticker === currentTicker))
    ) {
      refreshMeetings(currentTicker)
    } else if (currentMeetingId && meetings.length > 0) {
      const matchingMeeting = meetings.find((m) => m.id === currentMeetingId)
      if (
        matchingMeeting &&
        (!currentMeeting || currentMeeting.id !== currentMeetingId)
      ) {
        setCurrentMeeting(matchingMeeting)
      }
    }
  }, [getTickerFromURL, getMeetingIdFromURL, meetings, currentMeeting, refreshMeetings])

  // Fetch meeting data when current meeting changes
  useEffect(() => {
    if (currentMeeting?.id) {
      refreshMeetingData()
    }
  }, [currentMeeting?.id, refreshMeetingData])

  const value: MeetingContextType = {
    currentMeeting,
    meetings,
    tasks,
    positions,
    keyDates,
    isLoading,
    tasksLoading,
    positionsLoading,
    error,
    setCurrentMeeting,
    refreshMeetings,
    refreshMeetingData,
    getMeetingById,
  }

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
}

export function useMeeting() {
  const context = useContext(MeetingContext)
  if (context === undefined) {
    throw new Error('useMeeting must be used within a MeetingProvider')
  }
  return context
}

export default MeetingContext
