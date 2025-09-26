'use client'

import { BNAppBar } from '@rolemodel/betanxt-design-system/components/app-bar/BNAppBar'
import type { User } from 'next-auth'
import { signOut } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import { Badge, IconButton } from '@mui/material'

import type { NotificationData } from '@/components/Notifications/NotificationPopper'

import { useClient } from '@/contexts/ClientContext'
import { useMeeting } from '@/contexts/MeetingContext'
import { computeClientLogoSrc } from '@/utils/clientBranding'

// Dynamic import: avoid loading NotificationPopper bundle until user interacts
const NotificationPopper = dynamic(
  () => import('@/components/Notifications/NotificationPopper'),
  { ssr: false }
)

// --- Hoisted regex constants (avoid re-creation & keep intent explicit) ---
const TICKER_PREFIX_REGEX = /^\/([A-Z]{2,5})\//
const PAST_MEETINGS_REGEX = /^\/[A-Z]+\/past-meetings$/
const MEETING_REPORTS_REGEX = /^\/[A-Z]+\/meeting\/[^/]+\/reports$/
const REPORTING_REGEX = /^\/[A-Z]+\/reporting$/
const MEETING_PREFIX_REGEX = /^\/[A-Z]+\/meeting\//

// Shape we need for logo rendering (superset of stored client + available client fields referenced)
interface LogoClientLike {
  ticker?: string
  name?: string
  company_name?: string
  short_name?: string
}

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
  // loadNotifications gates rendering dynamic popper
  const [loadNotifications, setLoadNotifications] = useState(false)
  const notificationButtonRef = useRef<HTMLButtonElement>(null)

  // Get current client for logo and branding
  const { currentClient, availableClients, isHydrated } = useClient()

  // Get client logo based on client ticker or name (shared with PDF export)
  const getClientLogo = useCallback(
    (clientName?: string, ticker?: string) => computeClientLogoSrc(clientName, ticker),
    []
  )

  // Try to use meeting context, but don't fail if it's not available
  try {
    useMeeting()
  } catch {
    // ignore
  }

  // Use the current client's ticker for dashboard path, fallback to '/' if no client
  const dashboardPath = useMemo(() => {
    const clientToUse = isHydrated ? currentClient : null
    if (clientToUse?.ticker) {
      return `/${clientToUse.ticker}/meeting/${clientToUse.ticker.toLowerCase()}-annual-meeting-2025`
    }
    return '/'
  }, [isHydrated, currentClient])

  // Remove prefetch to improve performance - navigation is still instant with Next.js
  // Prefetch was causing unnecessary network requests and slowing down the app

  // Memoize tabs array to prevent recreation
  const exampleTabs = useMemo(() => {
    const urlTickerMatch = pathname.match(/^\/([A-Z]{2,5})\//)
    const urlTicker = urlTickerMatch ? urlTickerMatch[1] : null
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
  }, [dashboardPath, pathname, isHydrated, currentClient])

  const currentTab = useMemo(() => {
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
  }, [pathname])

  const handleNotificationClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setNotificationAnchor(event.currentTarget)
      setLoadNotifications(true)
      setNotificationsOpen((prev) => !prev)
    },
    []
  )

  const handleNotificationClose = useCallback(() => setNotificationsOpen(false), [])

  const handleNotificationItemClick = useCallback(
    (notification: NotificationData) => {
      if (notification.link) router.push(notification.link)
      setNotificationsOpen(false)
    },
    [router]
  )

  // Cache stored client once
  const storedClientRef = useRef<{ ticker?: string; name?: string } | null>(null)
  React.useEffect(() => {
    if (storedClientRef.current === null && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('betanxt-selected-client')
        storedClientRef.current = stored ? JSON.parse(stored) : null
      } catch {
        storedClientRef.current = null
      }
    }
  }, [])

  // Extract ticker once per render
  const urlTickerMatch = pathname.match(TICKER_PREFIX_REGEX)
  const urlTicker = urlTickerMatch ? urlTickerMatch[1] : null

  // Determine logo source with simpler logic
  const logoTicker = urlTicker || currentClient?.ticker || storedClientRef.current?.ticker
  const logoSrc =
    props.logoSrc ||
    (logoTicker
      ? getClientLogo(
          currentClient?.company_name || currentClient?.short_name,
          logoTicker
        )
      : '/images/logo.svg')

  // Memoize only the final slotProps object
  const slotProps = useMemo(() => {
    const isDefaultLogo = logoSrc === '/images/logo.svg'
    const defaultLogoStyles: React.CSSProperties = isDefaultLogo
      ? { height: 30 }
      : { height: 40 }

    return {
      logoImg: {
        src: logoSrc,
        alt: logoTicker ? `${logoTicker} Logo` : 'Logo',
        style: { ...defaultLogoStyles, ...props.logoImgStyles },
      },
    }
  }, [logoSrc, logoTicker, props.logoImgStyles])

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
      : props.user.username?.substring(0, 2).toUpperCase() || 'U'
    return { alt: `${props.user.name || props.user.username} Avatar`, children: initials }
  }, [props.user])

  const isGlobalNotFound = currentTab === null

  const endSlot = useCallback(
    () => (
      <>
        <IconButton
          ref={notificationButtonRef}
          onClick={handleNotificationClick}
          aria-label="notifications"
        >
          <Badge badgeContent={3} color="primary">
            <NotificationsOutlined />
          </Badge>
        </IconButton>
        {loadNotifications && (
          <NotificationPopper
            anchorEl={notificationAnchor}
            open={notificationsOpen}
            onClose={handleNotificationClose}
            onNotificationClick={handleNotificationItemClick}
          />
        )}
      </>
    ),
    [
      notificationsOpen,
      notificationAnchor,
      handleNotificationClick,
      handleNotificationClose,
      handleNotificationItemClick,
      loadNotifications,
    ]
  )

  const menuItems = useMemo(
    () => [
      { label: 'Profile' },
      { label: 'Settings' },
      { label: 'Logout', onClick: () => signOut({ callbackUrl: '/login' }) },
    ],
    []
  )

  return (
    <BNAppBar
      slots={{ logoImg: 'img', end: endSlot }}
      slotProps={slotProps}
      color="secondary"
      selectedTabValue={currentTab || undefined}
      LinkComponent={NextLinkComponent}
      tabs={isGlobalNotFound ? [] : exampleTabs}
      avatar={avatar}
      menuItems={menuItems}
    />
  )
})

export { BNAppBar }
