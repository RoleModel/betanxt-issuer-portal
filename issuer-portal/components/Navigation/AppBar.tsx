'use client'

import { BNLogo } from '@rolemodel/betanxt-design-system/components/BNLogo'
import { BNAppBar } from '@rolemodel/betanxt-design-system/components/app-bar/BNAppBar'
import type { User } from 'next-auth'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, {
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import { Badge, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'

import { ClientAppSwitcher } from '@/components/Navigation/ClientAppSwitcher'
// Preload NotificationPopper for better performance - no dynamic import delay
import NotificationPopper from '@/components/Notifications/NotificationPopper'

import buildApiClient from '@/domain-models/apiClient'

import { useClient } from '@/contexts/ClientContext'
import MeetingContext from '@/contexts/MeetingContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { getBrandLogoPath } from '@/utils/brandConfig'
import { computeClientLogoSrc } from '@/utils/clientBranding'
import { formatMeetingDate } from '@/utils/meetingUtils'

// Custom hook to safely use meeting context when it might not be available
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

// --- Hoisted regex constants (avoid re-creation & keep intent explicit) ---
const TICKER_PREFIX_REGEX = /^\/([A-Z]{2,5})\//
const PAST_MEETINGS_REGEX = /^\/[A-Z]+\/past-meetings$/
const PAST_MEETING_REGEX = /^\/[A-Z]+\/past-meeting\//
const MEETING_REPORTS_REGEX = /^\/[A-Z]+\/meeting\/[^/]+\/reports$/
const REPORTING_REGEX = /^\/[A-Z]+\/reporting$/
const SECURE_FILE_TRANSFER_REGEX = /^\/[A-Z]+\/secure-file-transfer$/
const MEETING_PREFIX_REGEX = /^\/[A-Z]+\/meeting\//

// Next.js Image component wrapper for BNAppBar logo
const NextImageComponent = React.memo(
  (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { src, alt, width: _width, height: _height, style } = props

    // Don't render anything if no src is provided (prevents flash)
    if (!src) {
      return null
    }

    return (
      <Image
        src={src}
        alt={alt ?? 'Logo'}
        width={120}
        height={44}
        style={style}
        loading="eager"
        priority
        blurDataURL={src}
        sizes="(max-width: 600px) 120px, 120px"
      />
    )
  }
)
NextImageComponent.displayName = 'NextImageComponent'

interface BNAppBarWrapperProps {
  title?: string
  logoImg?: React.ReactNode
  logoSrc?: string
  logoImgStyles?: React.CSSProperties
  color?: 'primary' | 'secondary'
  tabPermissions?: Record<string, boolean>
  user?: User
  appSwitcher?: boolean
}

export function BNAppBarClient(props: BNAppBarWrapperProps) {
  return (
    <Suspense fallback={null}>
      <BNAppBarClientMemo {...props} />
    </Suspense>
  )
}

const BNAppBarClientMemo = React.memo(function BNAppBarClientComponent(
  props: BNAppBarWrapperProps
) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLButtonElement | null>(
    null
  )
  // NotificationPopper is now preloaded - no need for conditional loading
  const notificationButtonRef = useRef<HTMLButtonElement>(null)

  // Get current client for logo and branding
  const { currentClient, availableClients } = useClient()
  const { data: session, status: sessionStatus } = useSession()

  // Map user types to their brand tickers for logo display
  const userTypeBrandTicker: Record<string, string> = useMemo(
    () => ({ PARENT_CLIENT: 'DFIN', SOLICITOR: 'MRSO' }),
    []
  )
  const userType = session?.user?.type
  const isMultiClientUser =
    userType === 'PARENT_CLIENT' || userType === 'SOLICITOR' || userType === 'CSM'
  const isCSM = userType === 'CSM'

  // Get theme context for toggle functionality
  const { mode, setMode } = useColorScheme()

  // Get notification count from context
  let unreadCount = 0
  try {
    const notificationContext = useNotifications()
    unreadCount = notificationContext.unreadCount
  } catch {
    // NotificationProvider not available - silently fail
  }

  // Get client logo based on client ticker or name (shared with PDF export)
  const getClientLogo = useCallback(
    (clientName?: string, ticker?: string) =>
      computeClientLogoSrc(clientName, ticker, '/images/logo.svg', '-full'),
    []
  )

  // Get meetings data - handle case where meeting context may not be available
  const meetingContext = useMeetingSafe()
  const meetings = useMemo(() => meetingContext.meetings, [meetingContext.meetings])
  const [routeMeetingStatus, setRouteMeetingStatus] = useState<string | null>(null)
  const [routeMeetingDate, setRouteMeetingDate] = useState<string | null>(null)

  // Extract current meeting ID from pathname (handles both /meeting/ and /past-meeting/)
  const currentMeetingId = useMemo(() => {
    const match = /\/(?:past-)?meeting\/([^/]+)/.exec(pathname)
    return match ? match[1] : null
  }, [pathname])

  React.useEffect(() => {
    let active = true
    const fetchStatus = async () => {
      try {
        if (!currentMeetingId) {
          setRouteMeetingStatus(null)
          return
        }

        // Immediately check if meeting is in the active meetings list
        // If not, we can assume it's a past meeting before the API call completes
        const meetingInActiveList = meetings.some(
          (m: { id?: string }) => m.id === currentMeetingId
        )
        if (!meetingInActiveList && meetings.length > 0) {
          // Meeting not in active list, likely a past meeting
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

  // Use the current client's ticker for dashboard path, fallback to '/' if no client
  const dashboardPath = useMemo(() => {
    // PARENT_CLIENT/SOLICITOR users go to events overview
    if (isMultiClientUser) {
      return '/events'
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
  }, [currentClient, meetings, isMultiClientUser])

  // Extract ticker once per render - memoize regex execution
  const urlTicker = useMemo(() => {
    const match = TICKER_PREFIX_REGEX.exec(pathname)
    return match ? match[1] : null
  }, [pathname])

  // Remove prefetch to improve performance - navigation is still instant with Next.js
  // Prefetch was causing unnecessary network requests and slowing down the app

  // Memoize tabs array to prevent recreation
  const exampleTabs = useMemo(() => {
    const navTicker = urlTicker || currentClient?.ticker || availableClients[0]?.ticker
    const tickerPrefix = navTicker ? `/${navTicker}` : ''

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
    // Check for specific page routes that don't have tabs first
    if (pathname === '/profile' || pathname.startsWith('/profile/')) return null
    if (pathname === '/pdf-preview' || pathname.startsWith('/pdf-preview/')) return null

    // Events overview page for PARENT_CLIENT/SOLICITOR
    if (pathname === '/events') return 'meeting'

    // Check if we're on a past-meeting route (singular - viewing a specific past meeting)
    if (PAST_MEETING_REGEX.test(pathname)) return 'past-meetings'

    // Check if we're explicitly on the past meetings list page
    if (PAST_MEETINGS_REGEX.test(pathname) || pathname === '/past-meetings')
      return 'past-meetings'

    // Check for other non-meeting routes
    if (MEETING_REPORTS_REGEX.test(pathname)) return 'meeting'
    if (REPORTING_REGEX.test(pathname)) return 'reporting'
    if (SECURE_FILE_TRANSFER_REGEX.test(pathname)) return 'secure-file-transfer'

    // For active meeting routes
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

  const meetingStatus: 'ACTIVE' | 'COMPLETE' | 'ADJOURNED' | null = useMemo(() => {
    if (!currentMeetingId) return null

    // If we're on a past-meeting route, immediately return COMPLETE (don't wait for data)
    if (PAST_MEETING_REGEX.test(pathname)) {
      return 'COMPLETE'
    }

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

  const handleNotificationClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent event bubbling to avoid potential conflicts
      event.stopPropagation()
      setNotificationAnchor(event.currentTarget)
      setNotificationsOpen((prev) => !prev)
    },
    []
  )

  const handleNotificationClose = useCallback(() => {
    setNotificationsOpen(false)
  }, [])

  // Cache stored client once - avoid localStorage read on every render
  const storedClient = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('betanxt-selected-client')
      if (!stored) return null
      const parsed = JSON.parse(stored) as { ticker?: string }
      return parsed
    } catch {
      return null
    }
  }, []) // localStorage access is safe with window check, no dependencies needed

  // Read the ?issuer= query param for brand logo override
  const issuerParam = searchParams.get('issuer')
  const issuerName = issuerParam ? decodeURIComponent(issuerParam) : null

  // Determine logo source - memoize expensive logo computation
  const logoTicker = useMemo(() => {
    // For PARENT_CLIENT/SOLICITOR users on /events, use their brand ticker
    if (isMultiClientUser && !urlTicker) {
      return userType ? (userTypeBrandTicker[userType] ?? null) : null
    }
    return urlTicker || currentClient?.ticker || storedClient?.ticker
  }, [
    urlTicker,
    currentClient?.ticker,
    storedClient?.ticker,
    isMultiClientUser,
    userType,
    userTypeBrandTicker,
  ])

  const logoSrc = useMemo(() => {
    // If we have a custom logoSrc prop, use it immediately
    if (props.logoSrc) return props.logoSrc

    // Don't resolve a logo until the session has loaded to prevent
    // flashing the fallback BetaNXT logo before the user-type logo appears
    if (sessionStatus === 'loading') return null

    // If ?issuer= param is present, use the brand logo from brandConfig
    if (issuerName) {
      return getBrandLogoPath(issuerName)
    }

    // Determine the appropriate logo directly - no hydration checks needed
    return logoTicker
      ? getClientLogo(
          currentClient?.company_name || currentClient?.short_name,
          logoTicker
        )
      : '/images/logo.svg'
  }, [
    props.logoSrc,
    sessionStatus,
    issuerName,
    logoTicker,
    getClientLogo,
    currentClient?.company_name,
    currentClient?.short_name,
  ])

  // Memoize only the final slotProps object — undefined when logo hasn't resolved yet
  const slotProps = useMemo(() => {
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

  const avatar = useMemo(() => {
    if (!props.user) {
      return { src: '/avatars/user.png', alt: 'User Avatar', children: 'US' }
    }

    const initials = props.user.name
      ? props.user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) // Take only first 2 initials like EditAvatarButton
      : props.user.username?.substring(0, 2).toUpperCase() || 'U'

    // Use uploaded image if available, otherwise show initials
    return {
      src: props.user.image || undefined,
      alt: `${props.user.name || props.user.username} Avatar`,
      children: !props.user.image ? initials : undefined,
    }
  }, [props.user])

  // Hide tabs for specific pages that shouldn't have navigation tabs
  const shouldHideTabs = currentTab === null // Hide tabs on pages without tabs (profile, pdf-preview, etc.)

  const endSlot = useCallback(
    () => (
      <>
        <IconButton
          ref={notificationButtonRef}
          onClick={handleNotificationClick}
          aria-label="notifications"
          // Optimize for faster interaction
          disableRipple={false}
          disableTouchRipple={false}
        >
          <Badge badgeContent={unreadCount} color="primary">
            <NotificationsOutlined />
          </Badge>
        </IconButton>
        <NotificationPopper
          anchorEl={notificationAnchor}
          open={notificationsOpen}
          onClose={handleNotificationClose}
        />
      </>
    ),
    [
      unreadCount,
      notificationsOpen,
      notificationAnchor,
      handleNotificationClick,
      handleNotificationClose,
    ]
  )

  const handleLogout = useCallback(async () => {
    try {
      // NextAuth v5 beta requires CSRF token for signout
      // Get CSRF token first
      const csrfResponse = await fetch('/api/auth/csrf')
      const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string }

      // Then call signout with CSRF token
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken,
        }),
      })

      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Fallback to router push even if signout request fails
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

  // Create a selectedTabValue - use undefined for pages without active tabs
  // This prevents any tab from being highlighted on non-tab pages like profile
  const selectedTabValue = currentTab === null ? undefined : currentTab

  // Handle tab change with client-side navigation
  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      event.preventDefault()
      const selectedTab = exampleTabs.find((tab) => tab.value === newValue)
      if (selectedTab?.href) {
        router.push(selectedTab.href)
      }
    },
    [exampleTabs, router]
  )

  // Intercept all clicks on the AppBar to prevent default navigation
  const handleWrapperClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement

      // Find the closest anchor tag
      const anchor = target.closest('a')
      const href = anchor?.getAttribute('href')
      // Only intercept internal navigation (not external links)
      if (href?.startsWith('/')) {
        event.preventDefault()
        event.stopPropagation()
        router.push(href)
      }
    },
    [router]
  )

  // CSM logo component wrapper that renders BNLogo instead of a client image
  const CSMLogoComponent = useMemo(() => {
    if (!isCSM) return null
    const CSMLogo = () => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: 44 }}>
        <BNLogo height={28} />
      </Box>
    )
    CSMLogo.displayName = 'CSMLogo'
    return CSMLogo
  }, [isCSM])

  // Prepare props object
  const appBarProps = {
    slots: {
      logoImg: isCSM && CSMLogoComponent ? CSMLogoComponent : NextImageComponent,
      end: endSlot,
    },
    slotProps: isCSM ? undefined : slotProps,
    color: 'secondary' as const,
    tabs: shouldHideTabs ? [] : exampleTabs,
    avatar,
    menuItems,
    selectedTabValue,
    meetingStatus,
    onTabChange: handleTabChange,
  }

  // Handle SSR where mode might be undefined
  if (!mode) {
    return null
  }

  return (
    <Box onClick={handleWrapperClick}>
      <BNAppBar {...appBarProps}>
        {props.appSwitcher && (
          <Box aria-label="Client and Application Switcher" role="complementary">
            <ClientAppSwitcher currentAppTitle="Issuer Portal" />
          </Box>
        )}
      </BNAppBar>
      {!!currentMeetingId && (
        <Box
          sx={{
            paddingInline: 3,
            paddingBlock: 0.5,
            borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
            backgroundColor: (theme) =>
              !meetingStatus || meetingStatus === 'ACTIVE'
                ? 'transparent'
                : meetingStatus === 'COMPLETE'
                  ? theme.vars.palette.warning.main
                  : theme.vars.palette.warning.main,
            transition: 'background-color 120ms ease',
          }}
        >
          <Typography
            variant="body3"
            fontWeight={500}
            sx={{
              color: (theme) =>
                !meetingStatus || meetingStatus === 'ACTIVE'
                  ? 'text.primary'
                  : meetingStatus === 'COMPLETE'
                    ? theme.vars.palette.warning.contrastText
                    : theme.vars.palette.warning.contrastText,
            }}
          >
            {meetingStatus === 'COMPLETE' && meetingDateLabel
              ? `You are viewing a past meeting from ${meetingDateLabel}.`
              : !meetingStatus || meetingStatus === 'ACTIVE'
                ? 'You are viewing an active meeting.'
                : 'You are viewing a meeting with unknown status.'}
          </Typography>
        </Box>
      )}
    </Box>
  )
})

export { BNAppBar }
