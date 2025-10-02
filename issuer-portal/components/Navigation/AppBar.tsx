'use client'

import { BNAppBar } from '@rolemodel/betanxt-design-system/components/app-bar/BNAppBar'
import type { User } from 'next-auth'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useContext } from 'react'

import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import { Badge, IconButton } from '@mui/material'

import type { NotificationData } from '@/components/Notifications/NotificationPopper'
// Preload NotificationPopper for better performance - no dynamic import delay
import NotificationPopper from '@/components/Notifications/NotificationPopper'

import { useClient } from '@/contexts/ClientContext'
import { useColorScheme } from '@mui/material/styles'
import MeetingContext from '@/contexts/MeetingContext'
import { computeClientLogoSrc } from '@/utils/clientBranding'

// Custom hook to safely use meeting context when it might not be available
const useMeetingSafe = () => {
  const context = useContext(MeetingContext)
  // Return the context if available, otherwise return a safe default
  return useMemo(
    () => context || { meetings: [] as Array<{ id?: string; status?: string }> },
    [context]
  )
}

// --- Hoisted regex constants (avoid re-creation & keep intent explicit) ---
const TICKER_PREFIX_REGEX = /^\/([A-Z]{2,5})\//
const PAST_MEETINGS_REGEX = /^\/[A-Z]+\/past-meetings$/
const MEETING_REPORTS_REGEX = /^\/[A-Z]+\/meeting\/[^/]+\/reports$/
const REPORTING_REGEX = /^\/[A-Z]+\/reporting$/
const MEETING_PREFIX_REGEX = /^\/[A-Z]+\/meeting\//

// Memoized Next.js Link component wrapper for BNAppBar - defined outside to prevent recreation
interface NextLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  to: string
  children: React.ReactNode
}

const NextLinkComponent = React.memo(
  React.forwardRef<HTMLAnchorElement, NextLinkProps>(
    ({ to, children, ...props }, ref) => (
      <Link href={to} prefetch={false} ref={ref} {...props}>
        {children}
      </Link>
    )
  )
)
NextLinkComponent.displayName = 'NextLinkComponent'

// Next.js Image component wrapper for BNAppBar logo
const NextImageComponent = React.memo(
  (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { src, alt, width, height, style } = props

    // Don't render anything if no src is provided (prevents flash)
    if (!src) {
      return null
    }

    return (
      <Image
        src={src}
        alt={alt || 'Logo'}
        width={typeof width === 'number' ? width : 30}
        height={typeof height === 'number' ? height : 30}
        style={style}
        loading="eager"
        priority
        placeholder="blur"
        blurDataURL={src}
        sizes="(max-width: 600px) 40px, 40px"
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
}

export function BNAppBarClient(props: BNAppBarWrapperProps) {
  return <BNAppBarClientMemo {...props} />
}

const BNAppBarClientMemo = React.memo(function BNAppBarClientComponent(
  props: BNAppBarWrapperProps
) {
  const pathname = usePathname()
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLButtonElement | null>(
    null
  )
  // NotificationPopper is now preloaded - no need for conditional loading
  const notificationButtonRef = useRef<HTMLButtonElement>(null)

  // Get current client for logo and branding
  const { currentClient, isHydrated } = useClient()

  // Get theme context for toggle functionality
  const { mode, setMode } = useColorScheme()

  // Get client logo based on client ticker or name (shared with PDF export)
  const getClientLogo = useCallback(
    (clientName?: string, ticker?: string) => computeClientLogoSrc(clientName, ticker),
    []
  )

  // Get meetings data - handle case where meeting context may not be available
  const meetingContext = useMeetingSafe()
  const meetings = useMemo(() => meetingContext.meetings, [meetingContext.meetings])

  // Extract current meeting ID from pathname
  const currentMeetingId = useMemo(() => {
    const match = pathname.match(/\/meeting\/([^\/]+)/)
    return match ? match[1] : null
  }, [pathname])

  // Check if current meeting is a past meeting (completed)
  const isViewingPastMeeting = useMemo(() => {
    if (!currentMeetingId) return false
    const meeting = meetings.find((m: { id?: string }) => m.id === currentMeetingId)
    return meeting?.status === 'COMPLETE'
  }, [currentMeetingId, meetings])

  // Use the current client's ticker for dashboard path, fallback to '/' if no client
  const dashboardPath = useMemo(() => {
    const clientToUse = isHydrated ? currentClient : null
    // Find the first meeting that is not COMPLETE
    if (clientToUse?.ticker) {
      const activeMeeting = meetings.find(
        (meeting: { id?: string; status?: string }) => meeting.status !== 'COMPLETE'
      )
      if (activeMeeting?.id) {
        return `/${clientToUse.ticker}/meeting/${activeMeeting.id}`
      }
    }
    return '/'
  }, [isHydrated, currentClient, meetings])

  // Extract ticker once per render - memoize regex execution
  const urlTicker = useMemo(() => {
    const match = pathname.match(TICKER_PREFIX_REGEX)
    return match ? match[1] : null
  }, [pathname])

  // Remove prefetch to improve performance - navigation is still instant with Next.js
  // Prefetch was causing unnecessary network requests and slowing down the app

  // Memoize tabs array to prevent recreation - optimize dependencies
  const exampleTabs = useMemo(() => {
    const navTicker = urlTicker || (isHydrated ? currentClient?.ticker : null)
    const tickerPrefix = navTicker ? `/${navTicker}` : ''

    return [
      { label: 'Dashboard', value: 'meeting', to: dashboardPath },
      {
        label: 'Past Meetings',
        value: 'past-meetings',
        to: `${tickerPrefix}/past-meetings`,
      },
      { label: 'Reporting', value: 'reporting', to: `${tickerPrefix}/reporting` },
      { label: 'Education', value: 'education', to: '/education' },
      { label: 'Products', value: 'products', to: '/products' },
    ]
  }, [dashboardPath, urlTicker, isHydrated, currentClient?.ticker])

  const currentTab = useMemo(() => {
    // Check if viewing a past meeting first
    if (isViewingPastMeeting) return 'past-meetings'

    if (PAST_MEETINGS_REGEX.test(pathname) || pathname === '/past-meetings')
      return 'past-meetings'
    if (MEETING_REPORTS_REGEX.test(pathname)) return 'meeting'
    if (REPORTING_REGEX.test(pathname)) return 'reporting'
    if (pathname === '/education' || pathname.startsWith('/education/'))
      return 'education'
    if (pathname === '/products' || pathname.startsWith('/products/')) return 'products'
    if (
      pathname === '/' ||
      pathname === '/meeting' ||
      MEETING_PREFIX_REGEX.test(pathname) ||
      pathname.startsWith('/meeting/')
    )
      return 'meeting'
    return null
  }, [pathname, isViewingPastMeeting])

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

  const handleNotificationItemClick = useCallback(
    (notification: NotificationData) => {
      if (notification.link) {
        // Use router.push for client-side navigation (faster)
        router.push(notification.link)
      }
      setNotificationsOpen(false)
    },
    [router]
  )

  // Cache stored client once - avoid localStorage read on every render
  const storedClient = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('betanxt-selected-client')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  // Determine logo source - memoize expensive logo computation
  const logoTicker = useMemo(
    () => urlTicker || currentClient?.ticker || storedClient?.ticker,
    [urlTicker, currentClient?.ticker, storedClient?.ticker]
  )

  const logoSrc = useMemo(() => {
    // If we have a custom logoSrc prop, use it immediately
    if (props.logoSrc) return props.logoSrc

    // Don't show ANY logo until we're fully hydrated
    if (!isHydrated) {
      return null
    }

    // After hydration, determine the appropriate logo
    return logoTicker
      ? getClientLogo(
        currentClient?.company_name || currentClient?.short_name,
        logoTicker
      )
      : '/images/logo.svg'
  }, [
    props.logoSrc,
    isHydrated,
    logoTicker,
    getClientLogo,
    currentClient?.company_name,
    currentClient?.short_name,
  ])

  // Memoize only the final slotProps object
  const slotProps = useMemo(() => {
    // Don't render logo if logoSrc is null (waiting for hydration)
    if (!logoSrc) {
      return {} // Completely omit logoImg prop
    }

    const isDefaultLogo = logoSrc === '/images/logo.svg'
    const defaultLogoStyles: React.CSSProperties = isDefaultLogo
      ? { height: 30, width: 120 }
      : { height: 40, width: 44 }

    return {
      logoImg: {
        src: logoSrc,
        alt: `${logoTicker || 'BetaNXT'} logo`,
        width: isDefaultLogo ? 120 : 44,
        height: isDefaultLogo ? 30 : 40,
        style: defaultLogoStyles,
      },
    }
  }, [logoSrc, logoTicker])

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
  const shouldHideTabs = false // Show tabs on all pages including profile

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
          <Badge badgeContent={3} color="primary">
            <NotificationsOutlined />
          </Badge>
        </IconButton>
        <NotificationPopper
          anchorEl={notificationAnchor}
          open={notificationsOpen}
          onClose={handleNotificationClose}
          onNotificationClick={handleNotificationItemClick}
        />
      </>
    ),
    [
      notificationsOpen,
      notificationAnchor,
      handleNotificationClick,
      handleNotificationClose,
      handleNotificationItemClick,
    ]
  )

  const menuItems = useMemo(
    () => [
      { label: 'Profile', onClick: () => router.push('/profile') },
      {
        label: `Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`,
        onClick: () => setMode(mode === 'light' ? 'dark' : 'light')
      },
      { label: 'Logout', onClick: () => signOut({ callbackUrl: '/login' }) },
    ],
    [router, mode, setMode]
  )

  // Create a selectedTabValue that's always a valid tab value
  // Default to 'meeting' (Dashboard) when no current tab matches
  const selectedTabValue = currentTab || 'meeting'

  // Prepare props object
  const appBarProps = {
    slots: { logoImg: NextImageComponent, end: endSlot },
    slotProps,
    color: 'secondary' as const,
    LinkComponent: NextLinkComponent,
    tabs: shouldHideTabs ? [] : exampleTabs,
    avatar,
    menuItems,
    selectedTabValue,
  }

  // Handle SSR where mode might be undefined
  if (!mode) {
    return null
  }

  return <BNAppBar {...appBarProps} />
})

export { BNAppBar }
