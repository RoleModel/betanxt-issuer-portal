'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { TabContext, TabPanel } from '@mui/lab'
import {
  Badge,
  Box,
  Button,
  ClickAwayListener,
  Fade,
  Paper,
  Popover,
  Stack,
  Tab,
  Tabs,
  Typography,
  styled,
} from '@mui/material'

import type { components } from '@/domain-models/generated-schema'

import { useNotifications } from '@/contexts/NotificationContext'

import Notification from './Notification'

type DbNotification = components['schemas']['Notification']

interface NotificationData {
  id: string
  user: string
  title: string
  date: string
  message: string
  link: string
  variant: 'read' | 'unread'
  avatar?: string
  isSystemNotification?: boolean
}

interface NotificationPopperProps {
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
  onNotificationClick?: (notification: NotificationData) => void
}

const StyledTabs = styled(Tabs)({
  '&.MuiTabs-root': {
    height: 36,
    minHeight: 36,
    maxHeight: 36,
  },
  '& .MuiTabs-flexContainer': {
    height: '100%',
    flexGrow: 1,
    minHeight: 36,
    maxHeight: 36,
  },
  '& .MuiTab-root': {
    height: 36,
    flexGrow: 1,
    minHeight: 36,
    maxHeight: 36,
  },
  '& .MuiBadge-root': {
    left: 0,
    top: 0,
  },
})

const formatNotificationDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    const month = date.toLocaleString('en-US', { month: 'short' })
    const day = date.getDate()
    return `${month} ${day}`
  }
}

const convertDbNotificationToNotificationData = (
  dbNotification: DbNotification
): NotificationData => {
  // Check if this is a comment notification (from a user, not system)
  const isCommentNotification = dbNotification.title?.includes('Comment')

  // Extract user name from message for comment notifications
  // Example: "Michael Chen left a comment..." -> "Michael Chen"
  let userName = 'System'
  let userAvatar: string | undefined = undefined

  if (isCommentNotification && dbNotification.message) {
    const match = /^([^:]+(?:\s+[^:]+)*?)\s+(?:left a comment|commented)/.exec(
      dbNotification.message
    )
    if (match) {
      userName = match[1].trim()
      // Don't set userAvatar - let MUI Avatar use the username for initials
      userAvatar = undefined
    }
  }

  return {
    id: dbNotification.id ?? '',
    user: userName,
    title: dbNotification.title ?? '',
    date: dbNotification.createdAt
      ? formatNotificationDate(dbNotification.createdAt)
      : '',
    message: dbNotification.message ?? '',
    link: dbNotification.actionUrl ?? '',
    variant: dbNotification.read ? 'read' : 'unread',
    avatar: userAvatar,
    isSystemNotification:
      !isCommentNotification &&
      (dbNotification.type === 'info' || dbNotification.type === 'success'),
  }
}

export function NotificationPopper({
  anchorEl,
  open,
  onClose,
  onNotificationClick,
}: NotificationPopperProps) {
  const router = useRouter()
  const {
    notifications: dbNotifications,
    loading: _loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications()
  const [tabValue, setTabValue] = useState('0')
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // Convert DB notifications to UI format
  const notifications = useMemo(
    () => dbNotifications.map(convertDbNotificationToNotificationData),
    [dbNotifications]
  )

  const unreadNotifications = notifications.filter((n) => n.variant === 'unread')
  const unreadCount = unreadNotifications.length

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue)
  }

  // No need to fetch notifications here - they're already available from context

  const handleNotificationClick = async (notification: NotificationData) => {
    // Mark as read using context
    await markAsRead(notification.id)

    // Navigate to the notification's link if it exists
    if (notification.link) {
      router.push(notification.link)
      onClose?.() // Close the popover after navigation
    }

    if (onNotificationClick) {
      onNotificationClick(notification)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const handleClearAll = () => {
    // Just close the popover - notifications remain in backend
    onClose?.()
  }

  useEffect(() => {
    if (!open) {
      setPos(null)
      return
    }

    const computePos = () => {
      // Try to find the MUI AppBar in the DOM
      const appBar = document.querySelector('header.MuiAppBar-root')
      const appBarBottom = appBar?.getBoundingClientRect().bottom ?? 0

      // Fallback: if no app bar found, align to the anchorEl bottom
      const anchorBottom = anchorEl?.getBoundingClientRect().bottom ?? 0

      const top = Math.max(appBarBottom, anchorBottom) + 8 // 8px gap below bar
      const left = window.innerWidth // right edge of viewport

      setPos({ top, left })
    }

    computePos()
    window.addEventListener('resize', computePos)
    window.addEventListener('scroll', computePos, true)
    return () => {
      window.removeEventListener('resize', computePos)
      window.removeEventListener('scroll', computePos, true)
    }
  }, [open, anchorEl])

  return (
    <Popover
      open={open && !!pos}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={pos ?? { top: 0, left: 0 }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        transition: {
          component: Fade,
        },
      }}
    >
      <Paper
        elevation={12}
        sx={{
          maxWidth: 500,
          maxHeight: 700,
          minWidth: { xs: '100%', sm: 400, md: 500 },
          overflow: 'hidden',
          borderRadius: 2,
          border: '1px solid',
          borderColor: (theme) => theme.vars?.palette?.divider,
        }}
      >
        <ClickAwayListener onClickAway={onClose}>
          <TabContext value={tabValue}>
            <Box>
              {/* Header */}
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: (theme) => theme.vars?.palette?.divider,
                }}
              >
                <Box
                  sx={{
                    height: 40,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <StyledTabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="notification tabs"
                  >
                    <Tab
                      value="0"
                      label="Unread"
                      iconPosition="start"
                      icon={
                        unreadCount > 0 ? (
                          <Box sx={{ px: unreadCount.toString().length / 2 + 0.5 }}>
                            <Badge badgeContent={unreadCount} color="primary" />
                          </Box>
                        ) : undefined
                      }
                      id="notification-tab-0"
                      aria-controls="notification-tabpanel-0"
                    />
                    <Tab
                      value="1"
                      label="All"
                      id="notification-tab-1"
                      aria-controls="notification-tabpanel-1"
                    />
                  </StyledTabs>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {unreadCount > 0 && (
                      <Button variant="text" onClick={handleMarkAllRead}>
                        Mark all read
                      </Button>
                    )}
                    {notifications.length > 0 && (
                      <Button variant="text" onClick={handleClearAll} color="error">
                        Clear all
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
              <TabPanel value="0" sx={{ p: 0 }}>
                <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                  {unreadNotifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body3" color="text.secondary">
                        No unread notifications
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1} sx={{ p: 2 }}>
                      {unreadNotifications.map((notification) => (
                        <Notification
                          key={notification.id}
                          user={notification.user}
                          title={notification.title}
                          date={notification.date}
                          message={notification.message}
                          link={notification.link}
                          variant={notification.variant}
                          avatar={notification.avatar}
                          isSystemNotification={notification.isSystemNotification}
                          onClick={() => handleNotificationClick(notification)}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value="1" sx={{ p: 0 }}>
                <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                  {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body3" color="text.secondary">
                        No notifications
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1} sx={{ p: 2 }}>
                      {notifications.map((notification) => (
                        <Notification
                          key={notification.id}
                          user={notification.user}
                          title={notification.title}
                          date={notification.date}
                          message={notification.message}
                          link={notification.link}
                          variant={notification.variant}
                          avatar={notification.avatar}
                          isSystemNotification={notification.isSystemNotification}
                          onClick={() => handleNotificationClick(notification)}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              </TabPanel>
            </Box>
          </TabContext>
        </ClickAwayListener>
      </Paper>
    </Popover>
  )
}

// Export types for external use
export type { NotificationPopperProps, NotificationData }

// Also export as default for backward compatibility
export default NotificationPopper
