'use client'

import React, { useEffect, useState } from 'react'

import {
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Link,
  Stack,
  Typography,
} from '@mui/material'

import { getStatusBorderColor } from '@/components/mui-styling/theme'
import StatusChip from '@/components/ui/StatusChip'

import { useMeeting } from '@/contexts/MeetingContext'
import { useTasks } from '@/hooks/useTasks'
import { formatDate } from '@/lib/formats'
import type { Task } from '@/types/api-exports'
import type { TaskLink} from '@/utils/taskLinks';
import { parseTaskLinks } from '@/utils/taskLinks'
import {
  getDTCCAuthorizationStatus,
  isDTCCAuthorizationTask,
} from '@/utils/taskTransformers'

interface DrawerTaskItemProps {
  task: Task
  phaseColor: string
  isCompleted?: boolean
  onClick?: () => void
  onContextMenu?: (event: React.MouseEvent) => void
  onStatusUpdate?: (task: Task) => void
  onLinkClick?: (link: TaskLink, taskTitle: string) => void
}

export default function DrawerTaskItem({
  task,
  phaseColor,
  isCompleted = false,
  onClick,
  onStatusUpdate,
  onLinkClick,
  onContextMenu,
}: DrawerTaskItemProps) {
  const { updateTaskById } = useTasks()
  const { refreshMeetingData } = useMeeting()
  const [isAuthorized, setIsAuthorized] = useState(
    task.status === 'COMPLETE' || task.status === 'AUTHORIZED'
  )

  useEffect(() => {
    setIsAuthorized(task.status === 'COMPLETE' || task.status === 'AUTHORIZED')
  }, [task.status])

  const handleAuthorizationChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked
    setIsAuthorized(checked)

    if (task.id) {
      const newStatus = getDTCCAuthorizationStatus(checked)
      await updateTaskById(task.id, { status: newStatus })

      // Update the task object and notify parent
      const updatedTask = { ...task, status: newStatus }
      if (onStatusUpdate) {
        onStatusUpdate(updatedTask as Task)
      }

      // Refresh meeting data to update UI
      void refreshMeetingData()
    }
  }

  const isDTCCAuthorization = isDTCCAuthorizationTask(task)
  const taskLinks = parseTaskLinks(task.links, task.title)

  return (
    <Card
      onContextMenu={onContextMenu}
      sx={(theme) => {
        const borderColor = isCompleted
          ? 'complete'
          : getStatusBorderColor(task.status, phaseColor, theme)

        return {
          borderLeft: `6px solid`,
          borderLeftColor: borderColor,
          backgroundColor: isCompleted
            ? 'background.paper'
            : `${theme.vars.palette.tableCellRow.fill}`,
          borderTop: 0,
          borderBottom: 0,
          borderRight: 0,
          boxShadow: `inset 0px 0px 0px 1px ${theme.vars.palette.divider}`,
          p: 0,
          textAlign: 'left',
          width: '100%',
          '&:hover': {
            boxShadow: `0px 0px 0px 1px inset ${borderColor}`,
          },
        }
      }}
    >
      <CardContent
        sx={{ p: 1.5, cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body3"
              fontWeight={600}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                mb: 0.25,
              }}
            >
              {task.title}
            </Typography>
            <Typography variant="caption">{task.owner}</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Typography
              variant="body3"
              fontWeight={600}
              sx={{
                mb: 0.25,
              }}
            >
              {formatDate(task.dueDate ?? '')}
            </Typography>
            <StatusChip status={task.status ?? null} size="small" />
          </Box>
        </Box>
        {/* Task description */}
        {task.description && (
          <Typography
            color="text.secondary"
            sx={{ fontSize: '0.75rem', lineHeight: 1.6, display: 'block', mt: 1 }}
          >
            {task.description}
          </Typography>
        )}

        {/* Task Links - Only show for issuer-owned tasks */}
        {taskLinks.length > 0 &&
          onLinkClick &&
          !['BetaNXT', 'DFIN'].includes(task.owner ?? '') && (
            <Box sx={{ mt: 1 }}>
              <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                {taskLinks.map((link: TaskLink, linkIndex: number) => (
                  <Link
                    key={linkIndex}
                    component="button"
                    variant="body3"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onLinkClick(link, task.title ?? 'Task')
                    }}
                    sx={{
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      '&:hover': {
                        textDecoration: 'none',
                      },
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
                {/* DTCC Authorization Checkbox */}
                {isDTCCAuthorization && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="secondary"
                        checked={isAuthorized}
                        onChange={handleAuthorizationChange}
                        size="small"
                      />
                    }
                    label="Authorization confirmed"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ fontSize: '0.875rem' }}
                  />
                )}
              </Stack>
            </Box>
          )}
      </CardContent>
    </Card>
  )
}
