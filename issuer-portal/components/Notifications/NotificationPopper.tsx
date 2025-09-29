'use client'

import React, { useEffect, useState } from 'react'

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

import Notification from './Notification'

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

const dummyNotifications: NotificationData[] = [
  {
    id: '1',
    user: 'System',
    title: 'Filing Complete',
    date: 'Jun 18',
    message: '10-K filed 61 days ahead of Record Date',
    link: '',
    variant: 'unread',
    isSystemNotification: true,
  },
  {
    id: '2',
    user: 'System',
    title: 'Search Request',
    date: 'Jun 18',
    message: 'Search requests sent to intermediaries for beneficial holder counts',
    link: '',
    variant: 'unread',
    isSystemNotification: true,
  },
  {
    id: '3',
    user: 'Ellen Park',
    title: 'Comment on File 10-K',
    date: 'Jul 18',
    message: 'Please confirm financials before sending for typesetting.',
    link: 'Review Comment',
    variant: 'unread',
    avatar: 'https://untitledui.com/images/avatars/transparent/olivia-rhye',
  },
  {
    id: '4',
    user: 'System',
    title: 'Document Review',
    date: 'Aug 5',
    message: 'Draft proxy statement ready for initial review',
    link: 'Review Document',
    variant: 'read',
    isSystemNotification: true,
  },
  {
    id: '5',
    user: 'Michael Chen',
    title: 'Comment',
    date: 'Aug 5',
    message: 'Proxy statement draft needs more detail on board diversity initiatives',
    link: 'Review Comment',
    variant: 'read',
    avatar: 'https://untitledui.com/images/avatars/transparent/maxwell-tan',
  },
  {
    id: '6',
    user: 'System',
    title: 'Document Review',
    date: 'Aug 5',
    message: 'DEF 14A proof received from financial printer',
    link: 'Review Document',
    variant: 'read',
    isSystemNotification: true,
  },
  {
    id: '7',
    user: 'Sarah Johnson',
    title: 'Comment',
    date: 'Jul 18',
    message: 'Suggesting adding QR codes to printed materials for easier digital access',
    link: 'Review Comment',
    variant: 'read',
    avatar: 'https://untitledui.com/images/avatars/transparent/eva-bond',
  },
]

const StyledTabs = styled(Tabs)({
  '& .MuiTabs-flexContainer': {
    height: '100%',
    flexGrow: 1,
    minHeight: 36,
    maxHeight: 36,
  },
  '& .MuiTab-root': {
    height: '100%',
    flexGrow: 1,
    minHeight: 'unset',
    maxHeight: 36,
  },
  '& .MuiBadge-root': {
    left: 0,
    top: 0,
  },
})

export function NotificationPopper({
  anchorEl,
  open,
  onClose,
  onNotificationClick,
}: NotificationPopperProps) {
  const [notifications, setNotifications] =
    useState<NotificationData[]>(dummyNotifications)
  const [tabValue, setTabValue] = useState('0')
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const unreadNotifications = notifications.filter((n) => n.variant === 'unread')
  const unreadCount = unreadNotifications.length

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue)
  }

  const handleNotificationClick = (notification: NotificationData) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, variant: 'read' as const } : n))
    )

    if (onNotificationClick) {
      onNotificationClick(notification)
    }
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, variant: 'read' as const })))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  useEffect(() => {
    if (!open) {
      setPos(null)
      return
    }

    const computePos = () => {
      // Try to find the MUI AppBar in the DOM
      const appBar = document.querySelector('header.MuiAppBar-root') as HTMLElement | null
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
                    <Button variant="text" onClick={handleClearAll} color="error">
                      Clear all
                    </Button>
                  </Box>
                </Box>
              </Box>
              <TabPanel value="0" sx={{ p: 0 }}>
                <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                  {unreadNotifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
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
