'use client'

import React, { useEffect, useState } from 'react'

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  FormControlLabel,
  Link,
  Stack,
  Typography,
} from '@mui/material'

import StatusChip from '@/components/ui/StatusChip'

import { useMeeting } from '@/contexts/MeetingContext'
import { useTasks } from '@/hooks/useTasks'
import { formatDate } from '@/lib/formats'
import type { Task } from '@/types/api'
import { TaskLink, parseTaskLinks } from '@/utils/taskLinks'
import {
  getDTCCAuthorizationStatus,
  isDTCCAuthorizationTask,
  isIssuerOwnedTask,
} from '@/utils/taskTransformers'

interface DrawerTaskItemProps {
  task: Task
  phaseColor: string
  isCompleted?: boolean
  onClick?: () => void
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
}: DrawerTaskItemProps) {
  const { updateTaskById } = useTasks()
  const { refreshMeetingData } = useMeeting()
  const [isAuthorized, setIsAuthorized] = useState(task.status === 'COMPLETE')

  useEffect(() => {
    setIsAuthorized(task.status === 'COMPLETE')
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
      refreshMeetingData()
    }
  }

  const isDTCCAuthorization = isDTCCAuthorizationTask(task)
  const taskLinks = parseTaskLinks(task.links, task.title)
  const isIssuerOwned = isIssuerOwnedTask(task)

  return (
    <Card
      sx={(theme) => ({
        borderLeft: `6px solid`,
        borderLeftColor: isCompleted ? 'complete' : phaseColor,
        backgroundColor: isCompleted
          ? 'background.paper'
          : `${theme.vars.palette.tableCellRow.fill}`,
        borderTop: 0,
        borderBottom: 0,
        borderRight: 0,
        boxShadow: (theme) => `inset 0px 0px 0px 1px ${theme.vars.palette.divider}`,
        p: 0,
        textAlign: 'left',
        width: '100%',
        '&:hover': {
          boxShadow: `0px 0px 0px 1px inset ${phaseColor}`,
        },
      })}
    >
      <CardActionArea onClick={onClick} disabled={!onClick}>
        <CardContent sx={{ p: 1.5 }}>
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
            <Box
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
            >
              <Typography
                variant="body3"
                fontWeight={600}
                sx={{
                  mb: 0.25,
                }}
              >
                {formatDate(task.dueDate || '')}
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

          {/* DTCC Authorization Checkbox */}
          {isDTCCAuthorization && (
            <Box sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="secondary"
                    checked={isAuthorized}
                    onChange={handleAuthorizationChange}
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                  />
                }
                label="Authorization confirmed"
                sx={{ fontSize: '0.875rem' }}
              />
            </Box>
          )}

          {/* Task Links - only show for issuer-owned tasks */}
          {isIssuerOwned && taskLinks.length > 0 && onLinkClick && (
            <Box sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {taskLinks.map((link: TaskLink, linkIndex: number) => (
                  <Link
                    key={linkIndex}
                    component="button"
                    underline="always"
                    onClick={(e) => {
                      e.stopPropagation()
                      onLinkClick(link, task.title || 'Task')
                    }}
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
