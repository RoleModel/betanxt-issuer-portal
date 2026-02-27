'use client'

import type { User } from 'next-auth'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type React from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useColorScheme } from '@mui/material/styles'

import buildApiClient from '@/domain-models/apiClient'

import { useClient } from '@/contexts/ClientContext'
import MeetingContext from '@/contexts/MeetingContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { getBrandLogoPath } from '@/utils/brandConfig'
import { computeClientLogoSrc } from '@/utils/clientBranding'
import { parentClientEvents, solicitorEvents } from '@/utils/eventData'
import { formatMeetingDate } from '@/utils/meetingUtils'

// --- Hoisted regex constants ---
const TICKER_PREFIX_REGEX = /^\/([A-Z]{2,5})\//
const PAST_MEETINGS_REGEX = /^\/[A-Z]+\/past-meetings$/
const PAST_MEETING_REGEX = /^\/[A-Z]+\/past-meeting\//
const MEETING_REPORTS_REGEX = /^\/[A-Z]+\/meeting\/[^/]+\/reports$/
const REPORTING_REGEX = /^\/[A-Z]+\/reporting$/
const SECURE_FILE_TRANSFER_REGEX = /^\/[A-Z]+\/secure-file-transfer$/
const MEETING_PREFIX_REGEX = /^\/[A-Z]+\/meeting\//

// Safely use meeting context when it might not be available
const useMeetingSafe = () => {
  const context = useContext(MeetingContext)
  return useMemo(
    () =>
      context || {
        meetings: [] as { id?: string; status?: string }[],
        currentMeeting: null,
      },
    [context]
  )
}

// Static mapping — no need for useMemo
const USER_TYPE_BRAND_TICKER: Record<string, string> = {
  PARENT_CLIENT: 'DFIN',
  SOLICITOR: 'MRSO',
}

interface UseAppBarParams {
  logoSrc?: string
  user?: User
}

interface UseAppBarResult {
  // Logo
  logoSlotProps:
    | {
        logoImg: React.ImgHTMLAttributes<HTMLImageElement>
      }
    | undefined
  isCSM: boolean

  // Navigation
  tabs: { label: string; value: string; href: string }[]
  selectedTabValue: string | undefined
  shouldHideTabs: boolean
  handleTabChange: (event: React.SyntheticEvent, newValue: string) => void
  handleWrapperClick: (event: React.MouseEvent<HTMLDivElement>) => void

  // Meeting
  currentMeetingId: string | null
  meetingStatus: 'ACTIVE' | 'COMPLETE' | 'ADJOURNED' | null
  meetingDateLabel: string | null

  // User
  avatar: { src?: string; alt: string; children?: string }
  menuItems: { label: string; onClick: () => void }[]

  // Notifications
  unreadCount: number
  notificationsOpen: boolean
  notificationAnchor: HTMLButtonElement | null
  handleNotificationClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  handleNotificationClose: () => void

  // SSR
  isReady: boolean
}

export function useAppBar(params: UseAppBarParams): UseAppBarResult {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // --- Context ---
  const { currentClient, availableClients } = useClient()
  const { data: session, status: sessionStatus } = useSession()
  const { mode, setMode } = useColorScheme()
  const meetingContext = useMeetingSafe()
  const meetings = useMemo(() => meetingContext.meetings, [meetingContext.meetings])

  // Notification context (may not be available)
  let unreadCount = 0
  try {
    const notificationContext = useNotifications()
    unreadCount = notificationContext.unreadCount
  } catch {
    // NotificationProvider not available
  }

  // --- User type derivation ---
  const userType = session?.user?.type
  const isMultiClientUser =
    userType === 'PARENT_CLIENT' || userType === 'SOLICITOR' || userType === 'CSM'
  const isCSM = userType === 'CSM'

  // --- Notification state ---
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLButtonElement | null>(
    null
  )

  const handleNotificationClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      setNotificationAnchor(event.currentTarget)
      setNotificationsOpen((prev) => !prev)
    },
    []
  )

  const handleNotificationClose = useCallback(() => {
    setNotificationsOpen(false)
  }, [])

  // --- Meeting status ---
  const [routeMeetingStatus, setRouteMeetingStatus] = useState<string | null>(null)
  const [routeMeetingDate, setRouteMeetingDate] = useState<string | null>(null)

  const currentMeetingId = useMemo(() => {
    const match = /\/(?:past-)?meeting\/([^/]+)/.exec(pathname)
    return match ? match[1] : null
  }, [pathname])

  useEffect(() => {
    let active = true
    const fetchStatus = async () => {
      try {
        if (!currentMeetingId) {
          setRouteMeetingStatus(null)
          return
        }
        const meetingInActiveList = meetings.some(
          (m: { id?: string }) => m.id === currentMeetingId
        )
        if (!meetingInActiveList && meetings.length > 0) {
          setRouteMeetingStatus('COMPLETE')
          return
        }
        const api = await buildApiClient()
        const { data } = await api.GET('/meetings/{meetingId}', {
          params: { path: { meetingId: currentMeetingId } },
        })
        if (active) {
          const status = (data && (data as { status?: string }).status) || null
          setRouteMeetingStatus(status)
          const date = (data && (data as { meetingDate?: string }).meetingDate) || null
          setRouteMeetingDate(date)
        }
      } catch {
        if (active) {
          setRouteMeetingStatus(null)
          setRouteMeetingDate(null)
        }
      }
    }
    void fetchStatus()
    return () => {
      active = false
    }
  }, [currentMeetingId, meetings])

  const meetingStatus: 'ACTIVE' | 'COMPLETE' | 'ADJOURNED' | null = useMemo(() => {
    if (!currentMeetingId) return null
    if (PAST_MEETING_REGEX.test(pathname)) return 'COMPLETE'
    const meeting = meetings.find((m) => m.id === currentMeetingId)
    const raw = meeting?.status ?? routeMeetingStatus
    const normalized = typeof raw === 'string' ? raw.toUpperCase() : raw
    return normalized === 'ACTIVE' ||
      normalized === 'COMPLETE' ||
      normalized === 'ADJOURNED'
      ? normalized
      : null
  }, [currentMeetingId, meetings, routeMeetingStatus, pathname])

  const meetingDateRaw = useMemo(() => {
    if (!currentMeetingId) return null
    const meeting = meetings.find((m) => m.id === currentMeetingId) as
      | { meetingDate?: string }
      | undefined
    return (
      meeting?.meetingDate ??
      meetingContext?.currentMeeting?.meetingDate ??
      routeMeetingDate
    )
  }, [
    currentMeetingId,
    meetings,
    meetingContext?.currentMeeting?.meetingDate,
    routeMeetingDate,
  ])

  const meetingDateLabel = useMemo(() => {
    return meetingDateRaw ? formatMeetingDate(meetingDateRaw) : null
  }, [meetingDateRaw])

  // --- Navigation ---
  const urlTicker = useMemo(() => {
    const match = TICKER_PREFIX_REGEX.exec(pathname)
    return match ? match[1] : null
  }, [pathname])

  const dashboardPath = useMemo(() => {
    if (isMultiClientUser) return '/events'
    if (currentClient?.ticker) {
      const activeMeeting = meetings.find(
        (meeting: { id?: string; status?: string }) => meeting.status !== 'COMPLETE'
      )
      if (activeMeeting?.id) {
        return `/${currentClient.ticker}/meeting/${activeMeeting.id}/dashboard`
      }
    }
    return '/'
  }, [currentClient, meetings, isMultiClientUser])

  const tabs = useMemo(() => {
    const navTicker =
      urlTicker || currentClient?.ticker || availableClients[0]?.ticker || 'WEN'
    const tickerPrefix = `/${navTicker}`
    return [
      { label: 'Dashboard', value: 'meeting', href: dashboardPath },
      {
        label: 'Past Meetings',
        value: 'past-meetings',
        href: `${tickerPrefix}/past-meetings`,
      },
      { label: 'Reporting', value: 'reporting', href: `${tickerPrefix}/reporting` },
      {
        label: 'File Transfer',
        value: 'secure-file-transfer',
        href: `${tickerPrefix}/secure-file-transfer`,
      },
    ]
  }, [dashboardPath, urlTicker, currentClient?.ticker, availableClients])

  const currentTab = useMemo(() => {
    if (pathname === '/pdf-preview' || pathname.startsWith('/pdf-preview/')) return null
    if (pathname === '/profile' || pathname.startsWith('/profile/')) return ''
    if (pathname === '/events') return 'meeting'
    if (PAST_MEETING_REGEX.test(pathname)) return 'past-meetings'
    if (PAST_MEETINGS_REGEX.test(pathname) || pathname === '/past-meetings')
      return 'past-meetings'
    if (MEETING_REPORTS_REGEX.test(pathname)) return 'meeting'
    if (REPORTING_REGEX.test(pathname)) return 'reporting'
    if (SECURE_FILE_TRANSFER_REGEX.test(pathname)) return 'secure-file-transfer'
    if (
      pathname === '/' ||
      pathname === '/meeting' ||
      MEETING_PREFIX_REGEX.test(pathname) ||
      pathname.startsWith('/meeting/')
    ) {
      return 'meeting'
    }
    return null
  }, [pathname])

  const shouldHideTabs = currentTab === null
  const selectedTabValue = currentTab === null ? undefined : currentTab

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      event.preventDefault()
      const selectedTab = tabs.find((tab) => tab.value === newValue)
      if (selectedTab?.href) {
        router.push(selectedTab.href)
      }
    },
    [tabs, router]
  )

  const handleWrapperClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement
      const anchor = target.closest('a')
      const href = anchor?.getAttribute('href')
      if (href?.startsWith('/')) {
        event.preventDefault()
        event.stopPropagation()
        router.push(href)
      }
    },
    [router]
  )

  // --- Logo resolution ---
  const getClientLogo = useCallback(
    (clientName?: string, ticker?: string) =>
      computeClientLogoSrc(clientName, ticker, '/images/logo.svg', '-full'),
    []
  )

  const storedClient = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('betanxt-selected-client')
      if (!stored) return null
      return JSON.parse(stored) as { ticker?: string }
    } catch {
      return null
    }
  }, [])

  const issuerParam = searchParams.get('issuer')
  const issuerName = issuerParam ? decodeURIComponent(issuerParam) : null

  const matchedEventName = useMemo(() => {
    if (!isMultiClientUser || !urlTicker) return null
    const meetingMatch = /\/([^/]+)\/(?:past-)?meeting\/([^/]+)/.exec(pathname)
    if (!meetingMatch) return null
    const [, ticker, meetingId] = meetingMatch
    const events =
      userType === 'PARENT_CLIENT'
        ? parentClientEvents
        : userType === 'SOLICITOR'
          ? solicitorEvents
          : []
    const event = events.find(
      (e) => e.clientTicker === ticker && e.meetingId === meetingId
    )
    return event?.event ?? null
  }, [isMultiClientUser, urlTicker, pathname, userType])

  const logoTicker = useMemo(() => {
    if (isMultiClientUser) {
      if (matchedEventName) return null
      // On pages with a client ticker in the URL (e.g. /WEN/past-meetings), use that client's logo
      if (urlTicker) return urlTicker
      // Fallback to brand logo only on truly top-level pages like /events or /profile
      return userType ? (USER_TYPE_BRAND_TICKER[userType] ?? null) : null
    }
    return urlTicker || currentClient?.ticker || storedClient?.ticker
  }, [
    urlTicker,
    currentClient?.ticker,
    storedClient?.ticker,
    isMultiClientUser,
    matchedEventName,
    userType,
  ])

  const logoSrc = useMemo(() => {
    if (params.logoSrc) return params.logoSrc
    if (sessionStatus === 'loading') return null
    if (issuerName) return getBrandLogoPath(issuerName)
    if (matchedEventName) return getBrandLogoPath(matchedEventName)
    return logoTicker
      ? getClientLogo(
          currentClient?.company_name || currentClient?.short_name,
          logoTicker
        )
      : '/images/logo.svg'
  }, [
    params.logoSrc,
    sessionStatus,
    issuerName,
    matchedEventName,
    logoTicker,
    getClientLogo,
    currentClient?.company_name,
    currentClient?.short_name,
  ])

  const logoSlotProps = useMemo(() => {
    if (!logoSrc) return undefined
    return {
      logoImg: {
        src: logoSrc,
        alt: `${issuerName ?? logoTicker ?? 'BetaNXT'} logo`,
        width: 'auto',
        height: 44,
        style: {
          height: 44,
          width: 'auto',
          backgroundColor: 'var(--mui-palette-common-white)',
          padding: '4px 4px',
          borderRadius: '4px',
        },
      },
    }
  }, [logoSrc, logoTicker, issuerName])

  // --- Avatar ---
  const avatar = useMemo(() => {
    if (!params.user) {
      return { src: '/avatars/user.png', alt: 'User Avatar', children: 'US' }
    }
    const initials = params.user.name
      ? params.user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : params.user.username?.substring(0, 2).toUpperCase() || 'U'
    return {
      src: params.user.image || undefined,
      alt: `${params.user.name || params.user.username} Avatar`,
      children: !params.user.image ? initials : undefined,
    }
  }, [params.user])

  // --- Auth / Menu ---
  const handleLogout = useCallback(async () => {
    try {
      const csrfResponse = await fetch('/api/auth/csrf')
      const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string }
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ csrfToken }),
      })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/login')
    }
  }, [router])

  const menuItems = useMemo(
    () => [
      { label: 'Profile', onClick: () => router.push('/profile') },
      {
        label: `Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`,
        onClick: () => setMode(mode === 'light' ? 'dark' : 'light'),
      },
      { label: 'Logout', onClick: () => void handleLogout() },
    ],
    [router, mode, setMode, handleLogout]
  )

  return {
    logoSlotProps,
    isCSM,
    tabs,
    selectedTabValue,
    shouldHideTabs,
    handleTabChange,
    handleWrapperClick,
    currentMeetingId,
    meetingStatus,
    meetingDateLabel,
    avatar,
    menuItems,
    unreadCount,
    notificationsOpen,
    notificationAnchor,
    handleNotificationClick,
    handleNotificationClose,
    isReady: !!mode,
  }
}
