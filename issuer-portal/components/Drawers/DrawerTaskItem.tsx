'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import StatusChip from '@/components/ui/StatusChip'
import { formatDate } from '@/lib/formats'
import { useTasks } from '@/hooks/useTasks'
import { useMeeting } from '@/contexts/MeetingContext'
import type { Task } from '@/types/api'
import { isDTCCAuthorizationTask, getDTCCAuthorizationStatus } from '@/utils/taskTransformers'

interface DrawerTaskItemProps {
  task: Task
  phaseColor: string
  isCompleted?: boolean
  onClick?: () => void
  onStatusUpdate?: (task: Task) => void
}

export default function DrawerTaskItem({
  task,
  phaseColor,
  isCompleted = false,
  onClick,
  onStatusUpdate
}: DrawerTaskItemProps) {
  const { updateTaskById } = useTasks()
  const { refreshMeetingData } = useMeeting()
  const [isAuthorized, setIsAuthorized] = useState(task.status === 'COMPLETE')

  useEffect(() => {
    setIsAuthorized(task.status === 'COMPLETE')
  }, [task.status])

  const handleAuthorizationChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <Card
      sx={{
        borderLeft: `6px solid`,
        borderLeftColor: isCompleted ? 'complete' : phaseColor,
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
      }}
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
        </CardContent>
      </CardActionArea>
    </Card>
  )
}