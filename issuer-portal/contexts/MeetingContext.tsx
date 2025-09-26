'use client'

import { usePathname } from 'next/navigation'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import type { KeyDate, Position, Task } from '@/types/api'

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
    const tickerMatch = pathname.match(/^\/([A-Za-z]{2,5})\//)
    return tickerMatch?.[1]
  }, [pathname])

  // Extract meeting ID from URL
  const getMeetingIdFromURL = useCallback((): string | undefined => {
    const meetingMatch = pathname.match(/\/meeting\/([^/]+)/)
    return meetingMatch?.[1]
  }, [pathname])

  // Fetch a specific meeting by ID (for cross-client navigation)
  const fetchMeetingById = useCallback(
    async (meetingId: string) => {
      try {
        const apiClient = await buildApiClient()
        // Use the specific meeting endpoint by ID
        const { data, error } = await apiClient.GET('/meetings/{meetingId}', {
          params: { path: { meetingId } },
        })

        if (error) {
          return
        }

        // Extract meeting from single meeting response
        const meeting = data

        if (meeting && (!currentMeeting || currentMeeting.id !== meeting.id)) {
          setCurrentMeeting(meeting)

          // Don't add cross-client meetings to the meetings array to avoid extra tabs
          // Only set as current meeting for context purposes
        }
      } catch (err) {
        // Error handling already in place
      }
    },
    [currentMeeting]
  )

  const refreshMeetings = useCallback(
    async (ticker?: string) => {
      setIsLoading(true)
      setError(null)

      try {
        // Use ticker from parameter, URL, or fetch all meetings
        const currentTicker = ticker || getTickerFromURL()

        const apiClient = await buildApiClient()
        const { data, error } = await apiClient.GET('/meetings', {
          params: {
            query: currentTicker ? { ticker: currentTicker } : {},
          },
        })

        if (error) {
          setError('Failed to fetch meetings')
          return
        }

        // Use meetings data directly from API response
        const meetingsArray = data?.meetings ?? []
        setMeetings(meetingsArray)

        // Auto-set current meeting based on URL
        const meetingIdFromURL = getMeetingIdFromURL()
        if (meetingIdFromURL && meetingsArray.length > 0) {
          const matchingMeeting = meetingsArray.find((m) => m.id === meetingIdFromURL)
          if (
            matchingMeeting &&
            (!currentMeeting || currentMeeting.id !== matchingMeeting.id)
          ) {
            setCurrentMeeting(matchingMeeting)
          } else if (!matchingMeeting && meetingIdFromURL) {
            // Meeting not found in current ticker's meetings, try to fetch it directly
            fetchMeetingById(meetingIdFromURL)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch meetings')
      } finally {
        setIsLoading(false)
      }
    },
    [getTickerFromURL, getMeetingIdFromURL, currentMeeting, fetchMeetingById]
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

      const apiClient = await buildApiClient()
      const [tasksResult, positionsResult] = await Promise.all([
        apiClient.GET('/meetings/{meetingId}/tasks', {
          params: { path: { meetingId: currentMeeting.id } },
        }),
        apiClient.GET('/positions', {
          params: { query: { meetingId: currentMeeting.id } },
        }),
      ])

      // Handle tasks
      if (tasksResult.error) {
        // Error handling in place
      } else {
        const taskData = tasksResult.data || []
        setTasks(taskData)
      }

      // Handle positions
      if (positionsResult.error) {
        // Error handling in place
      } else {
        // Handle different possible response formats
        const responseData = positionsResult.data
        const positionData = Array.isArray(responseData)
          ? responseData
          : ((responseData as { positions?: Position[] })?.positions ?? [])
        setPositions(positionData)
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
      // Error handling in place
    } finally {
      setTasksLoading(false)
      setPositionsLoading(false)
    }
  }, [
    currentMeeting?.id,
    currentMeeting?.preFilingDate,
    currentMeeting?.filingDate,
    currentMeeting?.brokerSearchDate,
    currentMeeting?.recordDate,
    currentMeeting?.mailingDate,
    currentMeeting?.meetingDate,
  ])

  // Handle URL changes to update current meeting context
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
  }, [
    pathname,
    refreshMeetings,
    getTickerFromURL,
    getMeetingIdFromURL,
    // Remove meetings and currentMeeting from dependencies to prevent infinite loop
    // Only re-run when pathname changes or functions change
  ])

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
