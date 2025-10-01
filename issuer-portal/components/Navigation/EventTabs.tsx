'use client'

import { BNTypographyPair } from '@rolemodel/betanxt-design-system/components/BNTypographyPair'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import {
  Box,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  styled,
  useMediaQuery,
} from '@mui/material'

import PhaseDrawer from '@/components/Drawers/PhaseDrawer'
import {
  getPhaseColor,
  getPhaseContrastText,
  getPhaseNumber,
} from '@/components/mui-styling/theme'
import { theme } from '@/components/mui-styling/theme'
import StatusChip from '@/components/ui/StatusChip'

import type { components } from '@/domain-models/generated-schema'

import { useClient } from '@/contexts/ClientContext'
import { useMeeting } from '@/contexts/MeetingContext'
import { useRoutePreload } from '@/hooks/useRoutePreload'
import { formatDate } from '@/lib/formats'

interface MeetingTab {
  id: string
  title: string
  ticker: string
  cusip: string
  recordDate: string
  mailingDate: string
  meetingDate: string
  status: 'ACTIVE' | 'COMPLETE' | 'ADJOURNED'
  currentPhase: string
  overallCompletion: number
  client: string
}

const getNavigationTabs = (currentPhase: number) => [
  { label: 'Meeting Dashboard', route: `/dashboard/${currentPhase}` },
  { label: 'Calendar', route: '/calendar' },
  { label: 'Documents', route: '/documents' },
  { label: 'Mailing', route: '/mailing' },
  { label: 'Tabulation', route: '/tabulation' },
  { label: 'Reports', route: '/reports' },
  { label: 'Agenda', route: '/agenda' },
  { label: 'Guests/Registrants', route: '/guests' },
]

const ScrollButton = styled(IconButton, {
  shouldForwardProp: (prop) => !['direction'].includes(prop as string),
})<{ direction: 'left' | 'right' }>(({ theme, direction }) => ({
  position: 'absolute',
  [direction]: 0,
  top: 0,
  bottom: 0,
  height: '100%',
  width: theme.spacing(2.5),
  borderRadius: 0,
  backgroundColor: theme.vars.palette.primary.main,
  border: '1px solid',
  borderColor: theme.vars.palette.divider,
  borderWidth: direction === 'left' ? '0 1px 0 0' : '0 0 0 1px',
  zIndex: 3,
  '&:hover': {
    backgroundColor: theme.vars.palette.primary.dark,
  },
  '& .MuiSvgIcon-root': {
    transform: `rotate(${direction === 'left' ? '90deg' : '-90deg'})`,
    color: theme.vars.palette.common.white,
    fontSize: '16px',
  },
}))

const parsePhaseNumber = (phase: string | number | null | undefined): number => {
  if (typeof phase === 'number' && Number.isFinite(phase)) {
    return Math.max(1, phase)
  }

  if (typeof phase === 'string') {
    const match = phase.match(/(\d+)/)
    if (match?.[1]) {
      const value = Number.parseInt(match[1], 10)
      if (Number.isFinite(value) && value > 0) {
        return value
      }
    }
  }

  return 1
}

export function EventTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeMeetingTab, setActiveMeetingTab] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { meetings, isLoading: loading, currentMeeting: activeMeeting } = useMeeting()
  const { currentClient, loading: clientLoading, error: clientError } = useClient()
  const [phaseDrawerOpen, setPhaseDrawerOpen] = useState(false)
  const [drawerPhase, setDrawerPhase] = useState(1)
  const togglePhaseDrawer = (newOpen: boolean) => () => setPhaseDrawerOpen(newOpen)
  const meetingIdFromUrl = pathname.match(/\/meeting\/([^/]+)/)?.[1]
  const currentMeeting = activeMeeting || meetings.find((m) => m.id === meetingIdFromUrl)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // (Optimization) Memoize current phase parsing
  const currentPhase = useMemo(
    () => parsePhaseNumber(currentMeeting?.currentPhase),
    [currentMeeting?.currentPhase]
  )

  // Extract phase from URL if on a dashboard route
  const phaseFromUrl = useMemo(() => {
    const match = pathname.match(/\/dashboard\/(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }, [pathname])

  // Use URL phase for display if available, otherwise use meeting's current phase
  const displayPhase = phaseFromUrl ?? currentPhase

  // Memoize navigation tabs with current phase
  const navigationTabs = useMemo(() => getNavigationTabs(currentPhase), [currentPhase])

  // Keep drawerPhase in sync with currentPhase when meeting changes
  useEffect(() => {
    setDrawerPhase(currentPhase)
  }, [currentPhase])

  // Preload routes for the current meeting
  useRoutePreload(currentMeeting?.id)

  // (Optimization) Debounced prefetch to reduce immediate burst on mount/meeting change
  useEffect(() => {
    if (currentMeeting?.id && currentClient?.ticker) {
      const timeout = setTimeout(() => {
        navigationTabs.forEach((tab) => {
          const route = `/${currentClient.ticker}/meeting/${currentMeeting.id}${tab.route}`
          router.prefetch(route)
        })
      }, 120)
      return () => clearTimeout(timeout)
    }
  }, [currentMeeting?.id, currentClient?.ticker, router, navigationTabs])

  // Get active tab from current pathname
  const currentRoute = pathname.replace(/^\/[^/]+\/meeting\/[^/]+/, '')
  const activeTab =
    navigationTabs.find((tab) => tab.route === currentRoute)?.label || 'Meeting Dashboard'

  // Handle URL-based meeting selection for past meetings
  useEffect(() => {
    const handleMeetingFromURL = async () => {
      const pathMatch = pathname.match(/^\/[^/]+\/meeting\/([^/]+)/)
      if (pathMatch) {
        const meetingIdFromURL = pathMatch[1]

        // Check if the current active meeting matches the URL
        if (!activeMeeting || activeMeeting.id !== meetingIdFromURL) {
          // If we have meetings loaded and none match the URL ID, it might be a past meeting
          const meetingsArray = meetings || []
          const existingMeeting = meetingsArray.find((m) => m.id === meetingIdFromURL)
          if (!existingMeeting && meetingsArray.length > 0) {
            // This could be a past meeting - let the MeetingContext handle it
            // The context will fetch the meeting from the database
          }
        }
      }
    }

    handleMeetingFromURL()
  }, [pathname, activeMeeting, meetings, currentMeeting])

  // Helper: map API/Context meeting to simplified tab data
  const mapToMeetingTab = useCallback(
    (m: components['schemas']['Meeting']): MeetingTab => ({
      id: m.id ?? '',
      title: m.title ?? 'Meeting',
      ticker: m.ticker ?? '',
      cusip: m.cusip ?? '',
      recordDate: formatDate(m.recordDate ?? ''),
      mailingDate: formatDate(m.mailingDate ?? ''),
      meetingDate: formatDate(m.meetingDate ?? ''),
      status: (m.status as 'ACTIVE' | 'COMPLETE' | 'ADJOURNED') ?? 'ACTIVE',
      currentPhase: m.currentPhase ?? 'Phase 1',
      overallCompletion: m.overallCompletion ?? 0,
      client: currentClient?.company_name ?? '',
    }),
    [currentClient?.company_name]
  )

  // Show only active meetings OR the currently selected past meeting
  const transformedMeetings: {
    tab: MeetingTab
    src: components['schemas']['Meeting']
  }[] = useMemo(() => {
    const meetingsArray = meetings || []
    if (currentMeeting && currentMeeting.status === 'COMPLETE') {
      return [
        {
          tab: mapToMeetingTab(currentMeeting),
          src: currentMeeting,
        },
      ]
    }
    const activeMeetings = meetingsArray.filter((m) => m.status === 'ACTIVE')
    activeMeetings.sort((a, b) => {
      const dateA = a.meetingDate ? new Date(a.meetingDate).getTime() : 0
      const dateB = b.meetingDate ? new Date(b.meetingDate).getTime() : 0
      if (dateA === dateB) {
        return (a.title || '').localeCompare(b.title || '')
      }
      return dateA - dateB
    })
    return activeMeetings.map((m) => ({ tab: mapToMeetingTab(m), src: m }))
  }, [meetings, currentMeeting, mapToMeetingTab])

  // Sync activeMeetingTab with current meeting
  useEffect(() => {
    if (currentMeeting && transformedMeetings.length > 0) {
      const meetingIndex = transformedMeetings.findIndex(
        (m) => m.src.id === currentMeeting.id
      )
      if (meetingIndex !== -1 && meetingIndex !== activeMeetingTab) {
        setActiveMeetingTab(meetingIndex)
      }
    }
  }, [currentMeeting, transformedMeetings, activeMeetingTab])

  // Helper function to scroll to active tab
  const scrollToActiveTab = useCallback(() => {
    if (scrollContainerRef.current && activeMeetingTab !== -1) {
      const container = scrollContainerRef.current
      const activeTabEl = container.querySelector(
        `[data-tab-index="${activeMeetingTab}"]`
      ) as HTMLElement
      if (activeTabEl) {
        const tabLeft = activeTabEl.offsetLeft
        const targetScroll = activeMeetingTab === 0 ? 0 : Math.max(0, tabLeft - 12)
        container.scrollTo({ left: targetScroll, behavior: 'smooth' })
        checkScrollButtons()
      }
    }
  }, [activeMeetingTab])

  // Check scroll position and update button visibility
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 1) // Small tolerance for floating point precision
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  // Scroll to active tab when it changes
  useEffect(() => {
    scrollToActiveTab()
  }, [activeMeetingTab, scrollToActiveTab])

  // Initial check and setup
  useEffect(() => {
    checkScrollButtons()
    const handleResize = () => checkScrollButtons()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const tabs = container.querySelectorAll(
        '[data-tab-index]'
      ) as NodeListOf<HTMLElement>

      if (tabs.length === 0) return

      const currentScrollLeft = container.scrollLeft

      if (currentScrollLeft <= 1) return

      // Find the current leftmost visible tab
      let currentTabIndex = tabs.length - 1 // Default to last tab
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].offsetLeft >= currentScrollLeft - 5) {
          // Small tolerance
          currentTabIndex = i
          break
        }
      }

      // Go to previous tab
      const targetIndex = Math.max(0, currentTabIndex - 1)
      const targetTab = tabs[targetIndex]

      // If target is the first tab, scroll to 0
      const targetScrollLeft = targetIndex === 0 ? 0 : targetTab.offsetLeft

      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      })

      // Recheck buttons after scroll animation
      setTimeout(() => {
        checkScrollButtons()
      }, 300)
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const tabs = container.querySelectorAll(
        '[data-tab-index]'
      ) as NodeListOf<HTMLElement>

      if (tabs.length === 0) return

      const currentScrollLeft = container.scrollLeft
      const containerWidth = container.clientWidth
      const maxScrollLeft = container.scrollWidth - container.clientWidth

      // If already at max scroll, don't scroll
      if (currentScrollLeft >= maxScrollLeft - 1) return

      // Find the first tab that's completely hidden on the right
      let targetIndex = -1

      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i]
        const tabLeft = tab.offsetLeft

        // If this tab starts beyond the current visible area
        if (tabLeft >= currentScrollLeft + containerWidth) {
          targetIndex = i
          break
        }
      }

      // If no completely hidden tab found, find the first partially hidden one
      if (targetIndex === -1) {
        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i]
          const tabRight = tab.offsetLeft + tab.offsetWidth

          // If this tab extends beyond the current view
          if (tabRight > currentScrollLeft + containerWidth) {
            targetIndex = i
            break
          }
        }
      }

      // If still no target found, scroll to the last tab
      if (targetIndex === -1) {
        targetIndex = tabs.length - 1
      }

      const targetTab = tabs[targetIndex]

      // Calculate scroll position to fit the target tab in the visible area
      // We want to scroll just enough to show this tab, not necessarily position it at the left
      const targetTabRight = targetTab.offsetLeft + targetTab.offsetWidth
      const neededScroll = targetTabRight - (currentScrollLeft + containerWidth)

      let targetScrollLeft
      if (neededScroll > 0) {
        // Scroll just enough to show the tab
        targetScrollLeft = Math.min(currentScrollLeft + neededScroll, maxScrollLeft)
      } else {
        // Tab is already visible, scroll to its left position
        targetScrollLeft = Math.min(targetTab.offsetLeft, maxScrollLeft)
      }

      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      })

      // Recheck buttons after scroll animation
      setTimeout(() => {
        checkScrollButtons()
      }, 300)
    }
  }

  const renderSkeletonTab = (index: number) => (
    <Box
      key={`skeleton-${index}`}
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.vars.palette.background.default,
        position: 'relative',
        flex: '0 1 auto',
        borderRight: `1px solid ${theme.vars.palette.divider}`,
        borderLeft: `1px solid ${theme.vars.palette.divider}`,
        minWidth: theme.spacing(30),
        overflowX: 'hidden',
        '&:last-child': {
          borderLeft: 'none',
        },
      })}
    >
      <Box
        sx={(theme) => ({
          height: 110,
          px: theme.spacing(2),
          py: theme.spacing(1),
          pt: theme.spacing(2),
          flex: 1,
        })}
      >
        <Stack spacing={1}>
          <Skeleton variant="text" width="60%" height={40} />
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="text" width={60} height={20} />
            <Skeleton variant="text" width={80} height={20} />
            <Skeleton variant="text" width={70} height={20} />
            <Skeleton variant="text" width={80} height={20} />
            <Skeleton variant="text" width={60} height={20} />
          </Stack>
        </Stack>
      </Box>
    </Box>
  )

  // Subcomponents for active/inactive meeting detail sections
  const ActiveMeetingDetails = ({
    meeting,
    currentPhase,
    onOpenPhaseDrawer,
  }: {
    meeting: MeetingTab
    currentPhase: number
    onOpenPhaseDrawer: () => void
  }) => {
    const phaseLabel = meeting.currentPhase || `Phase ${currentPhase}`

    return (
      <Box sx={{ display: 'flex', color: 'text.primary' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <BNTypographyPair
            sx={{ whiteSpace: 'nowrap' }}
            primary={{
              color: 'text.secondary',
              variant: 'caption',
              fontWeight: 500,
              text: 'CUSIP',
            }}
            secondary={{ variant: 'body3', fontWeight: 500, text: meeting.cusip }}
          />
          <BNTypographyPair
            sx={{ whiteSpace: 'nowrap' }}
            primary={{
              color: 'text.secondary',
              variant: 'caption',
              fontWeight: 500,
              text: 'Record Date',
            }}
            secondary={{
              variant: 'body3',
              fontWeight: 500,
              text: meeting.recordDate,
            }}
          />
          <BNTypographyPair
            sx={{ whiteSpace: 'nowrap' }}
            primary={{
              color: 'text.secondary',
              variant: 'caption',
              fontWeight: 500,
              text: 'Mailing Date',
            }}
            secondary={{
              variant: 'body3',
              fontWeight: 500,
              text: meeting.mailingDate,
            }}
          />
          <BNTypographyPair
            sx={{ whiteSpace: 'nowrap' }}
            primary={{
              color: 'text.secondary',
              variant: 'caption',
              fontWeight: 500,
              text: 'Meeting Date',
            }}
            secondary={{
              variant: 'body3',
              fontWeight: 500,
              text: meeting.meetingDate,
            }}
          />
          <Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ fontWeight: 500 }}
            >
              Current Phase
            </Typography>
            <Typography
              component="span"
              variant="body2"
              aria-label={`Open ${phaseLabel} phase details`}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onOpenPhaseDrawer()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onOpenPhaseDrawer()
                }
              }}
              sx={(theme) => {
                return {
                  fontWeight: 600,
                  color: getPhaseColor(displayPhase),
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  alignSelf: 'start',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                  '&:focus': {
                    outline: `2px solid ${theme.vars?.palette?.primary?.main}`,
                    outlineOffset: 2,
                  },
                  ...theme.applyStyles('dark', {
                    paddingY: 0.25,
                    paddingX: 0.5,
                    borderRadius: 1,
                    background: getPhaseColor(displayPhase),
                    color: getPhaseContrastText(displayPhase),
                  }),
                }
              }}
            >
              {phaseLabel}
            </Typography>
          </Stack>
          <Stack sx={{ minWidth: 120 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ fontWeight: 500 }}
            >
              Overall Completion
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minHeight: 24 }}>
              <LinearProgress
                variant="determinate"
                color={getPhaseNumber(currentPhase) as 'primary'}
                value={meeting.overallCompletion || 0}
                aria-label={`Overall completion progress: ${meeting.overallCompletion || 0}%`}
                sx={{ flex: 1, height: 4 }}
              />
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                {meeting.overallCompletion || 0}%
              </Typography>
            </Box>
          </Stack>
          <StatusChip status={meeting.status || 'Unknown'} size="small" />
        </Stack>
      </Box>
    )
  }

  const InactiveMeetingDetails = ({ meeting }: { meeting: MeetingTab }) => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Stack sx={{ alignItems: 'flex-end' }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              fontSize: '0.75rem',
              lineHeight: 1.5,
              letterSpacing: '3.33%',
              color: 'inherit',
            }}
          >
            Meeting Date
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              fontSize: '0.875rem',
              lineHeight: 1.286,
              letterSpacing: '0.71%',
              color: 'inherit',
            }}
          >
            {meeting.meetingDate}
          </Typography>
        </Stack>
      </Box>
    )
  }

  const handleOpenPhaseDrawer = useCallback((phase: number) => {
    setDrawerPhase(phase)
    setPhaseDrawerOpen(true)
  }, [])

  function MeetingTab({
    meeting,
    src: _src,
    index,
  }: {
    meeting: MeetingTab
    src: components['schemas']['Meeting']
    index: number
  }) {
    const isActive = currentMeeting?.id === meeting.id
    const ticker = currentClient?.ticker
    const meetingId = meeting.id
    const currentPath = pathname.replace(/\/[^/]+\/meeting\/[^/]+/, '')

    // If on dashboard with phase, navigate to the target meeting's phase
    const targetPath = useMemo(() => {
      if (currentPath.match(/^\/dashboard(\/\d+)?$/)) {
        const targetPhase = parsePhaseNumber(meeting.currentPhase)
        return `/${ticker}/meeting/${meetingId}/dashboard/${targetPhase}`
      } else if (currentPath === '') {
        return `/${ticker}/meeting/${meetingId}`
      } else {
        return `/${ticker}/meeting/${meetingId}${currentPath}`
      }
    }, [currentPath, ticker, meetingId, meeting.currentPhase])

    return (
      <Box
        key={meeting.id || index}
        data-tab-index={index}
        tabIndex={0}
        role="tab"
        aria-selected={isActive}
        sx={(theme) => ({
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'row',
          height: isMobile ? 'auto' : 110,
          cursor: isActive ? 'default' : 'pointer',
          overflowX: 'hidden',
          backgroundColor: isActive
            ? theme.vars.palette.background.default
            : theme.vars.palette.common.white,
          ...theme.applyStyles('dark', {
            backgroundColor: isActive
              ? theme.vars.palette.background.default
              : theme.vars.palette.common.black,
          }),
          color: isActive
            ? theme.vars.palette.primary.main
            : theme.vars.palette.text.secondary,
          position: 'relative',
          borderRight: `1px solid ${theme.vars.palette.divider}`,
          minWidth: 'fit-content',
          transition: theme.transitions.create(['color']),
          '&:hover': { color: theme.vars.palette.primary.main },
        })}
      >
        <Box sx={(theme) => ({ px: theme.spacing(2), pt: theme.spacing(1.5) })}>
          <Stack>
            <Typography
              href={targetPath}
              variant="h1"
              component={Link}
              sx={{
                fontFamily: 'var(--font-roboto-condensed), Roboto Condensed, sans-serif',
                fontWeight: 500,
                fontSize: '2rem',
                lineHeight: 1.125,
                letterSpacing: '0.47%',
                textDecoration: 'none',
                color: 'inherit',
                mb: 1,
                fontDisplay: 'swap',
              }}
            >
              {meeting.title}
            </Typography>
            {isActive && !isMobile ? (
              <ActiveMeetingDetails
                meeting={meeting}
                currentPhase={currentPhase}
                onOpenPhaseDrawer={() => handleOpenPhaseDrawer(currentPhase)}
              />
            ) : (
              !isActive && !isMobile && <InactiveMeetingDetails meeting={meeting} />
            )}
          </Stack>
        </Box>
      </Box>
    )
  }

  // Show error state if there's a client error
  if (clientError) {
    return (
      <Box>
        <Paper
          square
          sx={{
            borderBottom: '1px solid',
            borderColor: (theme) => theme.vars.palette.divider,
            boxShadow: 'none',
            backgroundColor: (theme) => theme.vars.palette.appBarSecondary.defaultFill,
            p: 2,
          }}
        >
          <Typography color="error" variant="body2">
            Error loading client data: {clientError}
          </Typography>
        </Paper>
      </Box>
    )
  }

  // Show loading state if clients are still loading
  const meetingsArray = meetings || []

  if (clientLoading || (loading && meetingsArray.length === 0)) {
    return (
      <Box>
        <Paper
          sx={{
            borderBottom: '1px solid',
            borderColor: (theme) => theme.vars.palette.divider,
            boxShadow: 'none',
            borderRadius: 0,
            background: (theme) => theme.vars.palette.tableCellRow.fill,
          }}
        >
          <Box sx={{ px: 3 }}>
            <Stack direction="row">
              {[1, 2].map((index) => renderSkeletonTab(index))}
            </Stack>
          </Box>
        </Paper>
      </Box>
    )
  }

  return (
    <Box component="nav">
      {/* Meeting Tabs Section */}
      <Paper
        sx={{
          borderBottom: '1px solid',
          borderColor: (theme) => theme.vars.palette.divider,
          borderRadius: 0,
          boxShadow: 'none',
          background: (theme) => theme.vars.palette.tableCellRow.fill,
          position: 'relative', // Add relative positioning
          '& .MuiPaper-root': {
            borderRadius: 0,
          },
        }}
      >
        <Box sx={{ position: 'relative' }}>
          {/* Left Scroll Button - Only show for active meetings with multiple tabs */}
          {canScrollLeft && transformedMeetings.length > 1 && (
            <ScrollButton
              direction="left"
              onClick={scrollLeft}
              aria-label="Scroll meetings left"
            >
              <ArrowDropDownIcon />
            </ScrollButton>
          )}

          {/* Right Scroll Button - Only show for active meetings with multiple tabs */}
          {canScrollRight && transformedMeetings.length > 1 && (
            <ScrollButton
              direction="right"
              onClick={scrollRight}
              aria-label="Scroll meetings right"
            >
              <ArrowDropDownIcon />
            </ScrollButton>
          )}

          <Box
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            sx={{
              py: 0,
              px: { xs: 1, sm: 3 },
              maxWidth: '100%',
              overflowX: 'auto',
              overflowY: 'visible', // Allow vertical overflow for the covering line
              scrollBehavior: 'smooth',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            <Stack
              direction="row"
              sx={{
                borderLeft: '1px solid',
                borderColor: (theme) => theme.vars.palette.divider,
              }}
            >
              {loading && (!meetings || meetings.length === 0) ? (
                // Show skeleton tabs while loading
                [1, 2, 3].map((index) => renderSkeletonTab(index))
              ) : transformedMeetings.length > 0 ? (
                // Show actual meeting tabs
                transformedMeetings.map(({ tab, src }, index) => (
                  <MeetingTab
                    key={tab.id || index}
                    meeting={tab}
                    src={src}
                    index={index}
                  />
                ))
              ) : (
                // Only show "No meetings" after loading is complete
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No meetings available for{' '}
                  {currentClient?.company_name ||
                    currentClient?.short_name ||
                    'this client'}
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          boxShadow: 'none',
          backgroundColor: 'var(--mui-palette-background-default)',
          borderBottom: '1px solid',
          borderColor: (theme) => theme.vars.palette.divider,
          borderRadius: 0,
          zIndex: 2,
        }}
      >
        <Box sx={{ px: { xs: 0, sm: 0, md: 3 }, py: 0 }}>
          <Stack direction="row" sx={{ position: 'relative' }}>
            <Tabs
              value={activeTab}
              variant="scrollable"
              allowScrollButtonsMobile
              scrollButtons="auto"
              aria-label="Meeting Navigation"
              sx={{ position: 'relative', pointerEvents: 'auto' }}
            >
              {navigationTabs.map((tab) => {
                const isActive = activeTab === tab.label
                // Use ticker from currentMeeting if available, fallback to currentClient
                const ticker = currentMeeting?.ticker || currentClient?.ticker
                const tabHref =
                  currentMeeting && ticker
                    ? `/${ticker}/meeting/${currentMeeting.id}${tab.route}`
                    : '#'

                return (
                  <Tab
                    key={tab.label}
                    value={tab.label}
                    label={tab.label}
                    onClick={() => router.push(tabHref)}
                    sx={(theme) => ({
                      color: isActive
                        ? 'var(--mui-palette-primary-main)'
                        : 'var(--mui-palette-text-secondary)',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      textDecoration: 'none',
                      px: 2,
                      py: 1.125,
                      minWidth: 'fit-content',
                      borderRadius: 0,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: theme.vars?.palette.primary.main,
                      },
                    })}
                  />
                )
              })}
            </Tabs>
          </Stack>
        </Box>
      </Paper>
      <PhaseDrawer
        open={phaseDrawerOpen}
        onClose={togglePhaseDrawer(false)}
        phase={drawerPhase}
        onPhaseChange={(p) => setDrawerPhase(p)}
      />
    </Box>
  )
}

EventTabs.displayName = 'EventTabs'
