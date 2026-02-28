'use client'

import { usePathname } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import buildApiClient from '@/domain-models/apiClient'

import type { components } from '@/types/api'
import type { KeyDate, Position, Task } from '@/types/api-exports'
import { asArray, asRecord, asString } from '@/utils/typeUtils'

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
  refreshMeetingData: () => Promise<{ tasks: Task[]; positions: Position[] } | null> // Refresh tasks and positions for current meeting
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
  const [positions, setPositions] = useState<Position[]>([])
  const [keyDates, setKeyDates] = useState<KeyDate[]>([])
  const [isLoading, setIsLoading] = useState(!initialMeeting) // Start loading if no initial data
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep local state for tasks to maintain compatibility
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)

  // Extract key dates from current meeting
  useEffect(() => {
    if (!currentMeeting) {
      setKeyDates([])
      return
    }

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
  }, [currentMeeting])

  // Extract ticker from URL
  const getTickerFromURL = useCallback((): string | undefined => {
    const tickerMatch = /^\/([A-Za-z]{2,5})\//.exec(pathname)
    return tickerMatch?.[1]
  }, [pathname])

  // Extract meeting ID from URL
  const getMeetingIdFromURL = useCallback((): string | undefined => {
    const meetingMatch = /\/(?:past-)?meeting\/([^/]+)/.exec(pathname)
    return meetingMatch?.[1]
  }, [pathname])

  const refreshMeetings = useCallback(
    async (ticker?: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const targetTicker = ticker || getTickerFromURL()
        if (!targetTicker) {
          setError('No ticker found in URL')
          return
        }

        const apiClient = await buildApiClient()
        const { data, error } = await apiClient.GET('/meetings', {
          params: { query: { ticker: targetTicker } },
        })

        if (error) {
          setError('Failed to fetch meetings')
          return
        }

        // The API returns { meetings: Meeting[], pagination: ... }
        const responseData = asRecord(data)
        const meetingsData = responseData ? asArray(responseData.meetings) : []
        const normalizedMeetings: Meeting[] = []

        for (const item of meetingsData) {
          const record = asRecord(item)
          if (!record) continue

          const meeting: Meeting = {
            id: asString(record.id) || '',
            title: asString(record.title) || '',
            ticker: asString(record.ticker) || '',
            cusip: asString(record.cusip) || undefined,
            meetingType: asString(record.meetingType) || undefined,
            meetingYear:
              typeof record.meetingYear === 'number' ? record.meetingYear : undefined,
            status: asString(record.status) as Meeting['status'],
            meetingDate: asString(record.meetingDate) || undefined,
            recordDate: asString(record.recordDate) || undefined,
            cutoffDate: asString(record.cutoffDate) || undefined,
            currentPhase: asString(record.currentPhase) || undefined,
            overallCompletion:
              typeof record.overallCompletion === 'number'
                ? record.overallCompletion
                : undefined,
            preFilingDate: asString(record.preFilingDate) || undefined,
            filingDate: asString(record.filingDate) || undefined,
            brokerSearchDate: asString(record.brokerSearchDate) || undefined,
            mailingDate: asString(record.mailingDate) || undefined,
            distributionType: asString(record.distributionType) || undefined,
            transferAgent: asString(record.transferAgent) || undefined,
            transferAgentConfirmed:
              typeof record.transferAgentConfirmed === 'boolean'
                ? record.transferAgentConfirmed
                : null,
            employeeStockPlans: asString(record.employeeStockPlans) || undefined,
            planAdministrator: asString(record.planAdministrator) || undefined,
            planAdministratorContact:
              asString(record.planAdministratorContact) || undefined,
            planAdministratorContactEmail:
              asString(record.planAdministratorContactEmail) || undefined,
            solicitor: asString(record.solicitor) || undefined,
            solicitorEmail: asString(record.solicitorEmail) || undefined,
            inspector: asString(record.inspector) || undefined,
            ivrDialInNumber: asString(record.ivrDialInNumber) || undefined,
            mailingStatus: asString(record.mailingStatus) || undefined,
            clientId: asString(record.clientId) || undefined,
            createdAt: asString(record.createdAt) || undefined,
            updatedAt: asString(record.updatedAt) || undefined,
          }

          normalizedMeetings.push(meeting)
        }

        setMeetings(normalizedMeetings)

        // Set current meeting if we don't have one or if URL suggests a different one
        const meetingIdFromURL = getMeetingIdFromURL()
        if (meetingIdFromURL) {
          const targetMeeting = normalizedMeetings.find((m) => m.id === meetingIdFromURL)
          if (
            targetMeeting &&
            (!currentMeeting || currentMeeting.id !== targetMeeting.id)
          ) {
            setCurrentMeeting(targetMeeting)
          }
        } else if (!currentMeeting && normalizedMeetings.length > 0) {
          // Fallback to first meeting if no URL context
          setCurrentMeeting(normalizedMeetings[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch meetings')
      } finally {
        setIsLoading(false)
      }
    },
    [getTickerFromURL, getMeetingIdFromURL, currentMeeting]
  )

  const getMeetingById = useCallback(
    (id: string): Meeting | undefined => {
      return meetings.find((meeting) => meeting.id === id)
    },
    [meetings]
  )

  // Fetch tasks and positions for the current meeting
  const refreshMeetingData = useCallback(async () => {
    if (!currentMeeting?.id) return null

    try {
      // Fetch meeting, tasks, and positions in parallel
      setTasksLoading(true)
      setPositionsLoading(true)

      const apiClient = await buildApiClient()
      const [meetingResult, tasksResult, positionsResult] = await Promise.all([
        apiClient.GET('/meetings/{meetingId}', {
          params: { path: { meetingId: currentMeeting.id } },
        }),
        apiClient.GET('/meetings/{meetingId}/tasks', {
          params: { path: { meetingId: currentMeeting.id } },
        }),
        apiClient.GET('/positions', {
          params: { query: { meetingId: currentMeeting.id, limit: 50000 } },
        }),
      ])

      // Update the meeting object with fresh data from the server
      const typedMeetingResult = meetingResult as { error?: unknown; data?: unknown }
      if (!typedMeetingResult.error && typedMeetingResult.data) {
        const updatedMeeting = typedMeetingResult.data as Meeting
        setCurrentMeeting(updatedMeeting)

        // Also update the meeting in the meetings array to keep everything in sync
        setMeetings((prevMeetings) =>
          prevMeetings.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m))
        )
      }

      // Handle tasks
      let taskData: Task[] = []
      if (tasksResult.error) {
        // Error handling in place
      } else {
        taskData = tasksResult.data || []
        setTasks(taskData)
      }

      // Handle positions
      const positionData: Position[] = []
      if (!positionsResult.error) {
        const rawPositions = asArray(positionsResult.data)
        for (const item of rawPositions) {
          const record = asRecord(item)
          if (!record) continue

          const position: Position = {
            id: asString(record.id) || '',
            meetingId: asString(record.meetingId) || '',
            cusip: asString(record.cusip) || undefined,
            accountType: asString(record.accountType) || undefined,
            setKey: asString(record.setKey) || undefined,
            name: asString(record.name) || undefined,
            accountNumber: asString(record.accountNumber) || undefined,
            controlNumber: asString(record.controlNumber) || undefined,
            voteStatus: asString(record.voteStatus) as Position['voteStatus'],
            shares: typeof record.shares === 'number' ? record.shares : undefined,
            sharesVoted:
              typeof record.sharesVoted === 'number' ? record.sharesVoted : undefined,
            source: record.source as Position['source'],
            createdAt: asString(record.createdAt) || undefined,
            updatedAt: asString(record.updatedAt) || undefined,
          }

          positionData.push(position)
        }
      }
      setPositions(positionData)

      return {
        tasks: taskData,
        positions: positionData,
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh meeting data')
      return null
    } finally {
      setTasksLoading(false)
      setPositionsLoading(false)
    }
  }, [currentMeeting?.id])

  // Auto-fetch meetings when component mounts or ticker changes
  useEffect(() => {
    const ticker = getTickerFromURL()
    if (ticker) {
      void refreshMeetings(ticker)
    }
  }, [refreshMeetings, getTickerFromURL])

  // Auto-set current meeting when URL changes
  useEffect(() => {
    const meetingIdFromURL = getMeetingIdFromURL()
    if (meetingIdFromURL && meetings.length > 0) {
      const targetMeeting = meetings.find((m) => m.id === meetingIdFromURL)
      // Only update if we found a target meeting and it's different from current
      if (targetMeeting) {
        setCurrentMeeting((prev) => {
          // Only update if different to avoid unnecessary re-renders
          if (!prev || prev.id !== targetMeeting.id) {
            return targetMeeting
          }
          return prev
        })
      } else {
        // Meeting not in active list - fetch it from API (likely a past meeting)
        const fetchPastMeeting = async () => {
          try {
            const api = await buildApiClient()
            const { data } = await api.GET('/meetings/{meetingId}', {
              params: { path: { meetingId: meetingIdFromURL } },
            })
            if (data) {
              const meetingData = data as Meeting
              setCurrentMeeting((prev) => {
                if (!prev || prev.id !== meetingData.id) {
                  return meetingData
                }
                return prev
              })
            }
          } catch (error) {
            console.error('Error fetching past meeting:', error)
          }
        }
        void fetchPastMeeting()
      }
    }
  }, [meetings, getMeetingIdFromURL])

  // Fetch meeting data when current meeting changes
  useEffect(() => {
    if (currentMeeting?.id) {
      void refreshMeetingData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMeeting?.id])

  return (
    <MeetingContext.Provider
      value={{
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
      }}
    >
      {children}
    </MeetingContext.Provider>
  )
}

export const useMeeting = () => {
  const context = useContext(MeetingContext)
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider')
  }
  return context
}

export const useMeetingSafe = () => {
  const context = useContext(MeetingContext)
  // Return the context if available, otherwise return a safe default
  return useMemo(
    () => context || { meetings: [] as { id?: string; status?: string }[] },
    [context]
  )
}

export default MeetingContext
