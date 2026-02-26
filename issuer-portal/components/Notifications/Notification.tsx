import React from 'react'

import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import { Avatar, Box, Link, Paper, Stack, Typography } from '@mui/material'

// Helper function to convert URL paths to readable actions
const getLinkText = (link: string, title: string): string => {
  // Extract meaningful action from URL path
  if (link.includes('/dashboard')) {
    if (title.includes('Event Has Been Created')) {
      return 'View Meeting Dashboard'
    }
    if (title.includes('Schedule Your Logistics')) {
      return 'Schedule Logistics Call'
    }
    if (title.includes('Transfer Agent Request')) {
      return 'View Task Details'
    }
    return 'Go to Dashboard'
  }

  if (link.includes('/documents')) {
    return 'Review Document'
  }

  if (link.includes('/calendar')) {
    return 'View Calendar'
  }

  if (link.includes('/tabulation')) {
    return 'View Results'
  }

  // Fallback to a generic action
  return 'View Details'
}

interface NotificationProps {
  user: string
  title: string
  date: string
  message: string
  link: string
  variant: 'read' | 'unread'
  avatar?: string
  isSystemNotification?: boolean
  onClick?: () => void
}

const Notification = ({
  user,
  title,
  date,
  message,
  link,
  variant,
  avatar,
  isSystemNotification = false,
  onClick,
}: NotificationProps) => {
  const isUnread = variant === 'unread'

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        display: 'flex',
        width: '100%',
        minWidth: 400,
        maxWidth: 500,
        backgroundColor: 'background.default',
        boxShadow: `0px 0px 0p 1px ${theme.vars.palette.divider}`,
        borderLeft: `6px solid ${isUnread ? theme.vars.palette.success.main : theme.vars.palette.complete}`,
        cursor: onClick ? 'pointer' : 'default',
        p: 1,
        '&:hover': onClick
          ? {
              backgroundColor: 'action.hover',
            }
          : {},
        '&:not(:last-child)': {
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
        },
      })}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', gap: 1.5, flex: 1 }}>
        <Box
          sx={{
            minWidth: 32,
            minHeight: 32,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            pt: 0.5,
          }}
        >
          {isSystemNotification ? (
            <NotificationsOutlinedIcon
              sx={{
                width: 20,
                height: 20,
                color: (theme) =>
                  isUnread
                    ? theme.vars.palette.success.main
                    : theme.vars.palette.complete,
              }}
            />
          ) : (
            <Avatar
              src={avatar}
              alt={user}
              variant="rounded"
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'secondary.main',
              }}
            >
              {user.charAt(0)}
            </Avatar>
          )}
        </Box>

        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                color: 'text.secondary',
              }}
            >
              {user}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              {date}
            </Typography>
          </Box>

          <Typography
            variant="body3"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body3"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.4,
              mb: 0.5,
            }}
          >
            {message}
          </Typography>

          {link && (
            <Link
              component="button"
              variant="body3"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onClick?.()
              }}
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                padding: 0,
                textAlign: 'left',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {getLinkText(link, title)}
            </Link>
          )}
        </Stack>
      </Box>
    </Paper>
  )
}

export default Notification
