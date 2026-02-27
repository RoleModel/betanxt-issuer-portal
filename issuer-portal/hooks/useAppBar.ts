'use client'

import type { User } from 'next-auth'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useColorScheme } from '@mui/material/styles'

import buildApiClient from '@/domain-models/apiClient'

import { useClient } from '@/contexts/ClientContext'
import MeetingContext from '@/contexts/MeetingContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useClients } from '@/hooks/useClients'
import { useEvents } from '@/hooks/useEvents'
import { getBrandConfigByTicker, getBrandLogoPath } from '@/utils/brandConfig'
import { computeClientLogoSrc } from '@/utils/clientBranding'
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
  isInClientContext: boolean

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

  // --- Context ---
  const { currentClient, availableClients } = useClient()
  const { clients } = useClients()
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
  const { events } = useEvents()

  const urlTicker = useMemo(() => {
    const match = TICKER_PREFIX_REGEX.exec(pathname)
    return match ? match[1] : null
  }, [pathname])

  // A "real client context" means the URL has a ticker that is NOT the brand's own ticker.
  // e.g. /ETWO/meeting/... → true; /DFIN/secure-file-transfer → false; /events → false
  const brandTicker = isMultiClientUser && userType ? USER_TYPE_BRAND_TICKER[userType] : null
  const isInClientContext = Boolean(urlTicker) && urlTicker !== brandTicker

  // Resolve the meeting dashboard path for the active/viewed client.
  // When on a meeting URL we use that meeting ID directly; otherwise we look up the
  // most recent active meeting from the events list for the current URL ticker.
  const clientMeetingPath = useMemo(() => {
    if (!isInClientContext || !urlTicker) return null

    if (currentMeetingId) {
      const routePrefix = PAST_MEETING_REGEX.test(pathname) ? 'past-meeting' : 'meeting'
      return `/${urlTicker}/${routePrefix}/${currentMeetingId}/dashboard`
    }

    const clientEvent = [...events]
      .filter((e) => e.clientTicker === urlTicker)
      .sort((a, b) => {
        if (a.meetingStatus === 'ACTIVE' && b.meetingStatus !== 'ACTIVE') return -1
        if (a.meetingStatus !== 'ACTIVE' && b.meetingStatus === 'ACTIVE') return 1
        return b.eventDate.localeCompare(a.eventDate)
      })[0]

    if (!clientEvent) return null
    const routePrefix = clientEvent.meetingStatus === 'ACTIVE' ? 'meeting' : 'past-meeting'
    return `/${urlTicker}/${routePrefix}/${clientEvent.meetingId}/dashboard`
  }, [isInClientContext, urlTicker, currentMeetingId, pathname, events])

  const dashboardPath = useMemo(() => {
    if (isMultiClientUser) {
      return isInClientContext && clientMeetingPath ? clientMeetingPath : '/events'
    }
    if (currentClient?.ticker) {
      const activeMeeting = meetings.find(
        (meeting: { id?: string; status?: string }) => meeting.status !== 'COMPLETE'
      )
      if (activeMeeting?.id) {
        return `/${currentClient.ticker}/meeting/${activeMeeting.id}/dashboard`
      }
    }
    return '/'
  }, [currentClient, meetings, isMultiClientUser, isInClientContext, clientMeetingPath])

  const tabs = useMemo(() => {
    const navTicker =
      urlTicker || currentClient?.ticker || availableClients[0]?.ticker || 'WEN'
    const tickerPrefix = `/${navTicker}`

    const fileTransferTicker =
      isMultiClientUser && userType && !isInClientContext
        ? (USER_TYPE_BRAND_TICKER[userType] ?? navTicker)
        : navTicker
    const fileTransferHref = `/${fileTransferTicker}/secure-file-transfer`

    const eventsTab = { label: 'Events', value: 'events', href: '/events' }
    const dashboardTab = { label: 'Dashboard', value: 'meeting', href: dashboardPath }
    const pastMeetingsTab = {
      label: 'Past Meetings',
      value: 'past-meetings',
      href: `${tickerPrefix}/past-meetings`,
    }
    const reportingTab = {
      label: 'Reporting',
      value: 'reporting',
      href: `${tickerPrefix}/reporting`,
    }
    const fileTransferTab = {
      label: 'File Transfer',
      value: 'secure-file-transfer',
      href: fileTransferHref,
    }

    // Multi-client (PARENT_CLIENT / SOLICITOR / CSM) users always see Events tab.
    // Dashboard + client tabs only appear once inside a specific client context.
    if (isMultiClientUser) {
      if (isInClientContext) {
        return [eventsTab, dashboardTab, pastMeetingsTab, reportingTab, fileTransferTab]
      }
      return [eventsTab, fileTransferTab]
    }

    // Single-client users: no Events tab, full client tabs when a ticker is in the URL.
    if (!urlTicker) {
      return [dashboardTab, fileTransferTab]
    }

    return [dashboardTab, pastMeetingsTab, reportingTab, fileTransferTab]
  }, [dashboardPath, urlTicker, currentClient?.ticker, availableClients, isMultiClientUser, userType, isInClientContext])

  const currentTab = useMemo(() => {
    if (pathname === '/pdf-preview' || pathname.startsWith('/pdf-preview/')) return null
    if (pathname === '/profile' || pathname.startsWith('/profile/')) return ''
    if (pathname === '/events') return 'events'
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
  // Guard against tab value mismatches during session loading (e.g. multi-client user
  // on /events before session resolves — tabs don't include 'events' yet).
  const tabValues = useMemo(() => new Set(tabs.map((t) => t.value)), [tabs])
  const selectedTabValue =
    currentTab === null || !tabValues.has(currentTab) ? undefined : currentTab

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

  // Look up the company name for the URL ticker from the clients list
  const urlClientCompanyName = useMemo(() => {
    if (!urlTicker) return null
    const client = clients.find((c) => c.ticker === urlTicker)
    return client?.company_name ?? client?.name ?? null
  }, [urlTicker, clients])

  const logoTicker = useMemo(() => {
    if (isMultiClientUser) {
      // On pages with a client ticker in the URL (e.g. /JPMR/past-meetings), use that client's logo
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
    userType,
  ])

  const logoSrc = useMemo(() => {
    if (params.logoSrc) return params.logoSrc
    if (sessionStatus === 'loading') return null

    // Ticker-based lookup is most reliable — not affected by company name typos/mismatches
    if (logoTicker) {
      const brandByTicker = getBrandConfigByTicker(logoTicker)
      if (brandByTicker?.logoPath) return brandByTicker.logoPath
    }

    // Fall back to company name lookup (for companies not yet in brandConfigsByTicker)
    if (urlClientCompanyName) {
      const brandLogo = getBrandLogoPath(urlClientCompanyName, '')
      if (brandLogo) return brandLogo
    }

    // Final fallback for multi-client users: show the brand (DFIN / MRSO) logo rather than
    // generating a ticker-based path that won't exist for most new clients.
    if (isMultiClientUser && userType) {
      const brandTicker = USER_TYPE_BRAND_TICKER[userType]
      if (brandTicker) return getClientLogo(undefined, brandTicker)
    }

    // Single-client ISSUER users: try the ticker-based file (WEN, PAYC, WWD, ELVN have these).
    return logoTicker
      ? getClientLogo(
        currentClient?.company_name || currentClient?.short_name,
        logoTicker
      )
      : '/images/logo.svg'
  }, [
    params.logoSrc,
    sessionStatus,
    urlClientCompanyName,
    logoTicker,
    getClientLogo,
    currentClient?.company_name,
    currentClient?.short_name,
    isMultiClientUser,
    userType,
  ])

  const logoSlotProps = useMemo(() => {
    if (!logoSrc) return undefined
    return {
      logoImg: {
        src: logoSrc,
        alt: `${urlClientCompanyName ?? logoTicker ?? 'BetaNXT'} logo`,
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
  }, [logoSrc, logoTicker, urlClientCompanyName])

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
    isInClientContext,
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
