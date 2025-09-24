'use client'

import { BNAppBar } from '@rolemodel/betanxt-design-system/components/app-bar/BNAppBar'
import type { User } from 'next-auth'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import { Badge, IconButton } from '@mui/material'

import NotificationPopper, {
  type NotificationData,
} from '@/components/Notifications/NotificationPopper'

import { useClient } from '@/contexts/ClientContext'
import { useMeeting } from '@/contexts/MeetingContext'

// Memoized Next.js Link component wrapper for BNAppBar - defined outside to prevent recreation
interface NextLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  to: string
  children: React.ReactNode
}

const NextLinkComponent = React.memo(
  React.forwardRef<HTMLAnchorElement, NextLinkProps>(
    ({ to, children, ...props }, ref) => (
      <Link href={to} prefetch={true} ref={ref} {...props}>
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

const BNAppBarClientMemo = React.memo(function BNAppBarClientComponent(props: BNAppBarWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLButtonElement | null>(
    null
  )
  const notificationButtonRef = useRef<HTMLButtonElement>(null)

  // Get current client for logo and branding
  const { currentClient, availableClients, isHydrated } = useClient()

  // Get client logo based on client ticker or name
  const getClientLogo = useCallback((clientName?: string, ticker?: string) => {
    if (!clientName && !ticker) return '/images/logo.svg' // Default logo

    // Try to use ticker first for more reliable matching
    if (ticker) {
      const tickerLower = ticker.toLowerCase()
      return `/logos/${tickerLower}_logo.svg`
    }

    // Fallback to name-based mapping (but this should be avoided for new clients)
    if (clientName) {
      const nameLower = clientName.toLowerCase().replace(/[^a-z0-9]/g, '')
      return `/logos/${nameLower}_logo.svg`
    }

    return '/images/logo.svg'
  }, [])

  // Try to use meeting context, but don't fail if it's not available
  // This ensures graceful fallback when context is not available
  try {
    useMeeting() // Just ensure context is available if needed
  } catch {
    // MeetingContext not available, continue with navigation-only functionality
  }

  // Use the current client's ticker for dashboard path, fallback to '/' if no client
  const dashboardPath = useMemo(() => {
    const clientToUse = isHydrated ? currentClient : null
    if (clientToUse?.ticker) {
      return `/${clientToUse.ticker}/meeting/${clientToUse.ticker.toLowerCase()}-annual-meeting-2025`
    }
    return '/'
  }, [isHydrated, currentClient])

  // Preload all navigation routes on mount to improve performance
  React.useEffect(() => {
    // Only prefetch after hydration to prevent SSR mismatches
    if (!isHydrated) return

    // Prefetch all main navigation routes that exist
    const clientToUse = currentClient
    if (clientToUse?.ticker) {
      const routes = [
        `/${clientToUse.ticker}/past-meetings`,
        `/${clientToUse.ticker}/reporting`,
      ]
      routes.forEach((route) => {
        router.prefetch(route)
      })
    }
  }, [router, isHydrated, currentClient, currentClient?.ticker])

  // Memoize tabs array to prevent recreation, filtered by permissions
  const exampleTabs = useMemo(() => {
    // Extract client ticker from current URL for navigation consistency
    const urlTickerMatch = pathname.match(/^\/([A-Z]{2,5})\//)
    const urlTicker = urlTickerMatch ? urlTickerMatch[1] : null

    // Use URL ticker if available, otherwise fall back to context client (hydration-safe)
    const navTicker = urlTicker || (isHydrated ? currentClient?.ticker : null)
    const tickerPrefix = navTicker ? `/${navTicker}` : ''

    // Try to infer current meetingId from URL or context
    const allTabs = [
      {
        label: 'Dashboard',
        value: 'meeting',
        to: dashboardPath,
      },
      {
        label: 'Past Meetings',
        value: 'past-meetings',
        to: `${tickerPrefix}/past-meetings`,
      },
      {
        label: 'Reporting',
        value: 'reporting',
        to: `${tickerPrefix}/reporting`,
      },
      {
        label: 'Education',
        value: 'education',
        to: '/education',
      },
      {
        label: 'Products',
        value: 'products',
        to: '/products',
      },
    ]

    return allTabs
  }, [dashboardPath, pathname, isHydrated, currentClient])

  // Memoize current tab determination - updated for meeting-scoped and ticker-scoped reporting
  const currentTab = useMemo(() => {
    // Match /TICKER/past-meetings or /past-meetings
    if (/^\/[A-Z]+\/past-meetings$/.test(pathname) || pathname === '/past-meetings')
      return 'past-meetings'
    // Match meeting-scoped reports - do NOT mark as reporting tab
    if (/^\/[A-Z]+\/meeting\/[^/]+\/reports$/.test(pathname)) return 'meeting'
    // Match ticker-scoped reporting
    if (/^\/[A-Z]+\/reporting$/.test(pathname)) return 'reporting'
    // Root sections (and subroutes) - education and products are now at root level
    if (pathname === '/education' || pathname.startsWith('/education/'))
      return 'education'
    if (pathname === '/products' || pathname.startsWith('/products/'))
      return 'products'
    // For home, meeting, and ticker-based meeting pages, use meeting
    if (
      pathname === '/' ||
      pathname === '/meeting' ||
      pathname.match(/^\/[A-Z]+\/meeting\//) || // Ticker-based meeting pages like /WEN/meeting/...
      pathname.startsWith('/meeting/')
    )
      return 'meeting'
    // For any other unmatched route, return null to indicate no active tab
    return null
  }, [pathname])

  // Handle notification interactions
  const handleNotificationClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
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
      // Navigate to notification link if available
      if (notification.link) {
        router.push(notification.link)
      }
      setNotificationsOpen(false)
    },
    [router]
  )

  // Memoize end slot component
  const endSlot = useCallback(() => {
    return (
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
        <NotificationPopper
          anchorEl={notificationAnchor}
          open={notificationsOpen}
          onClose={handleNotificationClose}
          onNotificationClick={handleNotificationItemClick}
        />
      </>
    )
  }, [
    notificationsOpen,
    notificationAnchor,
    handleNotificationClick,
    handleNotificationClose,
    handleNotificationItemClick,
  ])

  // Memoize menu items to prevent recreation
  const menuItems = useMemo(() => {
    return [
      {
        label: 'Profile',
      },
      {
        label: 'Settings',
      },
      {
        label: 'Logout',
        onClick: () => {
          // Handle logout - sign out immediately without confirmation page
          signOut({ callbackUrl: '/login' })
        },
      },
    ]
  }, [])

  // Memoize slot props to prevent recreation
  const slotProps = useMemo(() => {
    // Get stored client data directly to prevent flash
    const getStoredClient = () => {
      if (typeof window === 'undefined') return null
      try {
        const stored = localStorage.getItem('betanxt-selected-client')
        return stored ? JSON.parse(stored) : null
      } catch {
        return null
      }
    }

    // Extract client ticker from URL to prevent logo flash during hydration
    const urlTickerMatch = pathname.match(/^\/([A-Z]{2,5})\//)
    const urlTicker = urlTickerMatch ? urlTickerMatch[1] : null

    // Determine client for logo with multiple fallback strategies
    let logoClient = null
    let logoTicker = null

    if (urlTicker) {
      // Priority 1: If we have URL ticker, use it directly for logo generation
      logoTicker = urlTicker
      // Try to find full client data if available
      logoClient = availableClients.find((client) => client.ticker === urlTicker)
    } else {
      // Priority 2: Use stored client data (available immediately)
      const storedClient = getStoredClient()
      if (storedClient) {
        logoClient = storedClient
        logoTicker = storedClient.ticker
      } else if (isHydrated && currentClient) {
        // Priority 3: Use context client only after hydration
        logoClient = currentClient
        logoTicker = currentClient.ticker
      }
    }

    // Generate logo src - use ticker directly if we have it, even without full client data
    let logoSrc = '/images/logo.svg' // Default
    if (props.logoSrc) {
      logoSrc = props.logoSrc
    } else if (logoTicker) {
      logoSrc = getClientLogo(
        logoClient?.company_name || logoClient?.short_name,
        logoTicker
      )
    }

    // Apply 30px height only for the default logo, client logos remain unchanged
    const isDefaultLogo = logoSrc === '/images/logo.svg'
    const defaultLogoStyles: React.CSSProperties = isDefaultLogo
      ? { height: 30 }
      : { height: 40 }

    return {
      logoImg: {
        src: logoSrc,
        alt: logoClient?.company_name
          ? `${logoClient.company_name} Logo`
          : logoTicker
            ? `${logoTicker} Logo`
            : 'Logo',
        style: { ...defaultLogoStyles, ...props.logoImgStyles }, // Merge default with custom styles
      },
    }
  }, [
    pathname,
    availableClients,
    isHydrated,
    props.logoSrc,
    props.logoImgStyles,
    currentClient,
    getClientLogo,
  ])

  const avatar = useMemo(() => {
    if (!props.user) {
      return {
        src: '/avatars/user.png',
        alt: 'User Avatar',
        children: 'US',
      }
    }

    // Create initials from user name
    const initials = props.user.name
      ? props.user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
      : props.user.username?.substring(0, 2).toUpperCase() || 'U'

    return {
      alt: `${props.user.name || props.user.username} Avatar`,
      children: initials,
    }
  }, [props.user])

  // Check if this is global-not-found (when currentTab is null)
  const isGlobalNotFound = currentTab === null

  return (
    <BNAppBar
      slots={{
        logoImg: 'img',
        end: endSlot,
      }}
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
