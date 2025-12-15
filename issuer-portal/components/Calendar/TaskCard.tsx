'use client'

import React from 'react'

import {
  Security as AuthorizeIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  Launch as ExternalIcon,
  Person as PersonIcon,
  Edit as SignIcon,
  Assignment as TaskIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

import StatusChip from '@/components/ui/StatusChip'

import type { Task } from '@/types/api-exports'

interface TaskCardProps {
  task: Task
  phase?: number
  phaseColor?: string // Direct phase color to use
  variant?: 'compact' | 'expanded'
  onClick?: () => void
  onContextMenu?: (event: React.MouseEvent) => void
  showPhaseIndicator?: boolean
  isKeyDate?: boolean
  isMeetingDate?: boolean
  isActualKeyDate?: boolean // True when this is an actual key date, not a task
  sx?: SxProps<Theme> // Allow custom styles
}

// Helper functions for complex styling logic
const getTaskBackground = (
  theme: Theme,
  task: Task,
  isMeetingDate: boolean,
  isKeyDate: boolean
) => {
  const isCompleted = task.status === 'COMPLETE' || task.status === 'AUTHORIZED'

  if (isMeetingDate) {
    // Completed tasks on meeting dates get a more muted background
    return isCompleted
      ? theme.vars?.palette?.grey?.[200] || '#e0e0e0'
      : theme.vars?.palette?.primary.main
  }

  if (isKeyDate) {
    // Completed tasks on key dates get a muted key date background
    return isCompleted
      ? (theme.vars?.palette?.keydate.main ?? '#f5f5f5')
      : theme.vars?.palette.keydate.main
  }

  if (isCompleted) return theme.vars?.palette?.background.default
  return theme.vars?.palette?.tableCellRow.fill
}

const getTaskBorderLeft = (
  theme: Theme,
  task: Task,
  isMeetingDate: boolean,
  isActualKeyDate: boolean,
  isKeyDate: boolean,
  phase?: number
) => {
  const isCompleted = task.status === 'COMPLETE' || task.status === 'AUTHORIZED'

  if (isCompleted) {
    // Completed tasks get special border treatment based on context
    if (isMeetingDate) {
      return `5px solid ${theme.vars?.palette.complete}` // Keep complete color for meeting dates
    }
    if (isKeyDate || isActualKeyDate) {
      return `5px solid ${theme.vars?.palette.keydate.dark}` // Use complete color, but will be styled differently
    }
    return `5px solid ${theme.vars?.palette.complete}`
  }

  if (isMeetingDate) {
    return `5px solid ${theme.vars?.palette?.common?.white}`
  }
  if (isActualKeyDate) {
    return `5px solid ${theme.vars?.palette.keydate.contrastText}`
  }
  if (isKeyDate) {
    return `5px solid ${theme.vars?.palette.keydate.contrastText}`
  }
  if (phase) {
    return `5px solid ${theme.vars.palette.phase[phase - 1]?.main}`
  }
  return 'none'
}

const getTaskTextColor = (
  theme: Theme,
  task: Task,
  isMeetingDate: boolean,
  isKeyDate: boolean,
  isSecondary = false
) => {
  const isCompleted = task.status === 'COMPLETE' || task.status === 'AUTHORIZED'

  if (isMeetingDate) {
    // Completed tasks on meeting dates use a muted white
    return isCompleted
      ? theme.vars?.palette?.grey?.[600] || '#666666'
      : theme.vars?.palette?.common?.white
  }

  if (isKeyDate) {
    // Completed tasks on key dates use regular text color for better contrast
    return isCompleted
      ? isSecondary
        ? theme.vars?.palette?.text?.secondary
        : theme.vars?.palette?.text?.primary
      : theme.vars?.palette.keydate.contrastText
  }

  return isSecondary
    ? theme.vars?.palette?.text?.secondary
    : theme.vars?.palette?.text?.primary
}

const getTaskHoverBackground = (
  theme: Theme,
  task: Task,
  isActualKeyDate: boolean,
  isKeyDate: boolean,
  isMeetingDate: boolean
) => {
  const isCompleted = task.status === 'COMPLETE' || task.status === 'AUTHORIZED'

  if (isActualKeyDate) return 'transparent'

  if (isKeyDate) {
    // Completed tasks on key dates get a subtle hover effect
    return isCompleted
      ? theme.vars?.palette?.grey?.[200] || '#e0e0e0'
      : theme.vars?.palette.keydate.dark || theme.vars?.palette.keydate.main
  }

  if (isMeetingDate) {
    // Completed tasks on meeting dates get a subtle hover effect
    return isCompleted
      ? theme.vars?.palette?.grey?.[300] || '#d0d0d0'
      : theme.vars?.palette.keydate.contrastText
  }

  return theme.vars?.palette?.background.paper
}

// Common styling patterns
const textTruncationStyles = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'block',
} as const

const getCompletionStyles = (status: string | null | undefined) => {
  const isCompleted = status === 'COMPLETE' || status === 'AUTHORIZED'
  return {
    textDecoration: isCompleted ? 'line-through' : 'none',
    opacity: isCompleted ? 0.6 : 1,
  }
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'download':
      return <DownloadIcon fontSize="small" />
    case 'upload':
      return <UploadIcon fontSize="small" />
    case 'sign':
      return <SignIcon fontSize="small" />
    case 'authorize':
      return <AuthorizeIcon fontSize="small" />
    case 'external':
      return <ExternalIcon fontSize="small" />
    default:
      return <ExternalIcon fontSize="small" />
  }
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  phase,
  variant = 'expanded',
  onClick,
  onContextMenu,
  showPhaseIndicator = false,
  isKeyDate = false,
  isMeetingDate = false,
  isActualKeyDate = false,
  sx,
}) => {
  // Use theme.vars.palette.phase directly in sx functions

  if (variant === 'compact') {
    return (
      <Card
        tabIndex={onClick ? 0 : -1}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          mb: 0.5,
          background: (theme) => getTaskBackground(theme, task, isMeetingDate, isKeyDate),
          boxShadow: (theme) =>
            isKeyDate || isMeetingDate
              ? 'none'
              : `inset 0px 0px 0px 1px ${theme.vars.palette.divider}`,
          borderLeft: (theme) =>
            getTaskBorderLeft(
              theme,
              task,
              isMeetingDate,
              isActualKeyDate,
              isKeyDate,
              phase
            ),
          transition: (theme) => theme.transitions.create(['background-color']),
          borderRadius: 1,
          '&:hover': {
            backgroundColor: (theme) =>
              getTaskHoverBackground(
                theme,
                task,
                isActualKeyDate,
                isKeyDate,
                isMeetingDate
              ),
          },
          ...sx, // Apply custom styles
        }}
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              ...textTruncationStyles,
              mb: 0.25,
              ...getCompletionStyles(task.status),
              color: (theme) => getTaskTextColor(theme, task, isMeetingDate, isKeyDate),
            }}
          >
            {task.title}
          </Typography>{' '}
          {!isActualKeyDate && task.owner && (
            <Typography
              variant="caption"
              className="owner-text"
              sx={{
                fontSize: '0.725rem',
                ...textTruncationStyles,
                ...getCompletionStyles(task.status),
                color: (theme) =>
                  getTaskTextColor(theme, task, isMeetingDate, isKeyDate, true),
                mb: 0.25,
              }}
            >
              {task.owner}
            </Typography>
          )}
          {!isActualKeyDate && (
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <StatusChip
                status={task.status || null}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: 18,
                  ...(isKeyDate
                    ? {
                      backgroundColor:
                        task.status === 'COMPLETE' || task.status === 'AUTHORIZED'
                          ? (theme) => theme.vars?.palette.keydate.dark
                          : 'transparent',
                      color:
                        task.status === 'COMPLETE' || task.status === 'AUTHORIZED'
                          ? 'white'
                          : (theme) => theme.vars?.palette.keydate.contrastText,
                      border:
                        task.status === 'COMPLETE' || task.status === 'AUTHORIZED'
                          ? 'none'
                          : (theme) =>
                            `1px solid ${theme.vars?.palette.keydate.contrastText}`,
                    }
                    : isMeetingDate
                      ? {
                        backgroundColor:
                          task.status === 'COMPLETE' || task.status === 'AUTHORIZED'
                            ? (theme) => theme.vars?.palette.complete
                            : 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border:
                          task.status === 'COMPLETE' || task.status === 'AUTHORIZED'
                            ? 'none'
                            : '1px solid white',
                      }
                      : {}),
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      variant="outlined"
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        mb: 2,
        background: (theme) => theme.vars?.palette?.tableCellRow.fill,
        boxShadow: (theme) => `inset 0px 0px 0px 1px ${theme.vars.palette.divider}`,
        borderLeft: (theme) =>
          task.status === 'COMPLETE' || task.status === 'AUTHORIZED'
            ? `4px solid ${theme.vars?.palette.complete}`
            : showPhaseIndicator && phase
              ? `4px solid ${theme.vars.palette.phase[phase - 1]?.main}`
              : 'none',

        '&:hover': onClick
          ? {
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out',
          }
          : {},
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <CardContent>
        {/* Header with title and status */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={1} flexGrow={1}>
            <TaskIcon
              className="task-icon"
              sx={(theme) => ({
                color:
                  showPhaseIndicator && phase
                    ? theme.vars.palette.phase[phase - 1]?.main
                    : 'text.primary',
                mt: 0.25,
              })}
            />
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{
                textDecoration:
                  task.status === 'COMPLETE' || task.status === 'AUTHORIZED'
                    ? 'line-through'
                    : 'none',
                opacity:
                  task.status === 'COMPLETE' || task.status === 'AUTHORIZED' ? 0.6 : 1,
              }}
            >
              {task.title}
            </Typography>
          </Box>

          <StatusChip
            status={task.status || null}
            sx={{
              ml: 2,
            }}
          />
        </Box>

        {/* Description */}
        <Typography
          variant="body3"
          color="text.secondary"
          sx={{
            mb: 2,
            lineHeight: 1.5,
            textDecoration: task.status === 'COMPLETE' ? 'line-through' : 'none',
          }}
        >
          {task.description}
        </Typography>

        {/* Task metadata */}
        <Box
          display="flex"
          flexWrap="wrap"
          gap={2}
          mb={Array.isArray(task.links) && task.links.length ? 2 : 0}
        >
          {task.dueDate && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body3" color="text.secondary">
                Due: {task.dueDate}
              </Typography>
            </Box>
          )}

          {task.owner && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body3" color="text.secondary">
                {task.owner}
              </Typography>
            </Box>
          )}

          {task.type && (
            <Chip label={task.type} size="small" variant="outlined" sx={{ height: 24 }} />
          )}
        </Box>

        {/* Action links */}
        {Array.isArray(task.links) && task.links.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={1}>
            {task.links.map((link, index) => (
              <Tooltip key={index} title={link.label}>
                <IconButton
                  size="small"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (link.url) {
                      window.open(link.url, '_blank')
                    }
                  }}
                >
                  {getActionIcon(link.action ?? 'external')}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        )}

        {/* Document links */}
        {task.documentId && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Document ID: {task.documentId}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// Also export as default for backward compatibility
export default TaskCard
