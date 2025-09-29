'use client'

import { useRouter } from 'next/navigation'
import React, { useCallback } from 'react'

import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'

import TaskDrawer from '@/components/Drawers/TaskDrawer'
import {
  getPhaseColor,
  getStatusBorderColor,
  theme,
} from '@/components/mui-styling/theme'
import StatusChip from '@/components/ui/StatusChip'

import { useMeeting } from '@/contexts/MeetingContext'
import { usePhases } from '@/hooks/usePhases'
import { formatDate } from '@/lib/formats'
import type { Task } from '@/types/api-exports'
import { exportTimelineToPdf } from '@/utils/exportTimelinePdf'

interface TaskItemProps {
  meetingId?: string
  currentPhase?: number
  task: Task
  isClickable: boolean
  phaseColor: string
  status: string
  onClick: (taskId: string) => void
}

export function TaskItem({
  task,
  phaseColor,
  onClick,
  isClickable,
  status,
}: TaskItemProps) {
  const isComplete = status === 'COMPLETE'
  const borderColor = isComplete
    ? theme.vars.palette.complete
    : getStatusBorderColor(task.status, phaseColor, theme)

  return (
    <Card
      className={`task-card-${task.id} status-${task.status}`}
      key={task.id}
      data-testid={`task-card-${task.id}`}
      sx={{
        height: '100%',
        gridArea: 'tasks',
        gridColumn: {
          xs: '1',
          sm: '1',
          md: '1 / span 2',
          lg: '1 / span 3',
          xl: '1 / span 4',
        },
        background: (theme) =>
          isComplete
            ? theme.vars.palette.background.default
            : theme.vars.palette.tableCellRow.fill,
        borderLeft: `6px solid`,
        borderLeftColor: borderColor,
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
      }}
    >
      <CardActionArea onClick={() => onClick(task.id || '')} disabled={!isClickable}>
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
                data-testid="task-title"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.25,
                  opacity: isComplete ? 0.5 : 1,
                  textDecoration: isComplete ? 'line-through' : 'none',
                  textDecorationColor: 'inherit',
                  textDecorationThickness: '2px',
                }}
              >
                {task.title}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: isComplete ? 0.5 : 1,
                  textDecoration: isComplete ? 'line-through' : 'none',
                  textDecorationColor: 'inherit',
                  textDecorationThickness: '2px',
                }}
              >
                {task.owner}
              </Typography>
            </Box>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
            >
              <Typography
                variant="body3"
                fontWeight={600}
                sx={{
                  mb: 0.25,
                  opacity: isComplete ? 0.5 : 1,
                  textDecoration: isComplete ? 'line-through' : 'none',
                  textDecorationColor: 'inherit',
                  textDecorationThickness: '2px',
                }}
              >
                {formatDate(task.dueDate || '')}
              </Typography>
              <StatusChip status={task.status ?? null} size="small" />
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

interface TaskCardProps {
  meetingId?: string
  currentPhase?: number
  currentPhaseTitle?: string
  onClick?: (taskId: string) => void
}

export default function TaskCard({
  meetingId,
  currentPhase,
  currentPhaseTitle,
  onClick,
}: TaskCardProps) {
  const { tasks, tasksLoading, keyDates, currentMeeting, refreshMeetingData } =
    useMeeting()
  const { phases } = usePhases(meetingId || currentMeeting?.id || '')

  // Determine the current phase from meeting data or prop, default to 1
  const resolvedCurrentPhase =
    currentPhase ||
    (currentMeeting?.currentPhase
      ? parseInt(currentMeeting.currentPhase.replace('Phase ', '')) || 1
      : 1)

  // Get the current phase title from phases data
  const currentPhaseFromData = phases.find(
    (phase) => phase.orderIndex === resolvedCurrentPhase
  )
  const dynamicPhaseTitle =
    currentPhaseTitle || currentPhaseFromData?.name || `Phase ${resolvedCurrentPhase}`

  const displayTasks = tasks.filter((task) => {
    // Exclude BetaNXT and DFIN tasks
    if (['BetaNXT', 'DFIN'].includes(task.owner || '')) {
      return false
    }

    // For Phase 2, include incomplete Phase 1 carry-over tasks
    if (resolvedCurrentPhase === 2) {
      // Include Phase 2 tasks
      if (task.phaseNumber === 2) return true

      // Include incomplete Phase 1 tasks that carry over
      const carryOverTitles = [
        'DTCC (SPR) Authorization Status',
        'DTCC authorization',
        'Plan File Request form',
        'Transfer Agent Registered File Request Form',
        'Broadridge/ICS Access',
      ]

      if (task.phaseNumber === 1 && carryOverTitles.includes(task.title || '')) {
        // Only show if not complete
        const incompleteStatuses = [
          'INCOMPLETE',
          'NEEDS_AUTHORIZATION',
          'PENDING_AUTHORIZATION',
          'SUBMITTED_AWAITING_RECORD_DATE',
        ]
        return incompleteStatuses.includes(task.status || 'INCOMPLETE')
      }

      return false
    }

    // For other phases, just show tasks from that phase
    return task.phaseNumber === resolvedCurrentPhase
  })

  const [open, setOpen] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen)
  }

  const router = useRouter()
  const handleViewCalendarClick = () => {
    router.push(`/${currentMeeting?.ticker}/meeting/${currentMeeting?.id}/calendar`)
  }

  const handleTaskClick = (taskId: string) => {
    if (onClick) {
      onClick(taskId)
      return
    }
    const found = tasks.find((t) => t.id === taskId) || null
    setSelectedTask(found)
    setOpen(true)
  }

  const handleExportTimeline = useCallback(async () => {
    if (!currentMeeting) return

    try {
      // Pass context data directly to exportTimelineToPdf
      await exportTimelineToPdf({
        tasks: tasks,
        keyDates: keyDates,
        meetingTitle: currentMeeting.title || 'Meeting Schedule',
        selectedPhase: 'all',
        clientTicker: currentMeeting.ticker || undefined,
      })
    } catch (error) {
      console.error('Error exporting timeline:', error)
    }
  }, [currentMeeting, tasks, keyDates])

  return (
    <>
      <Card
        sx={{
          gridArea: 'tasks',
        }}
      >
        <CardHeader title={`Tasks - ${dynamicPhaseTitle}`} />
        <CardContent sx={{ p: 2, pt: 0 }}>
          {tasksLoading ? (
            <Stack spacing={1}>
              <Skeleton variant="rounded" height={48} />
              <Skeleton variant="rounded" height={48} />
              <Skeleton variant="rounded" height={48} />
              <Skeleton variant="rounded" height={48} />
            </Stack>
          ) : (
            <Stack spacing={1}>
              {displayTasks.map((task) => {
                // Always allow clicking tasks for testing and re-opening purposes
                const isClickable = true
                const phaseColor = getPhaseColor(resolvedCurrentPhase)
                return (
                  <TaskItem
                    key={task.id}
                    meetingId={meetingId}
                    currentPhase={resolvedCurrentPhase}
                    task={task}
                    onClick={handleTaskClick}
                    isClickable={isClickable}
                    phaseColor={phaseColor}
                    status={task.status || 'INCOMPLETE'}
                  />
                )
              })}
            </Stack>
          )}
        </CardContent>
        <CardActions sx={{ p: 1, justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" onClick={handleViewCalendarClick}>
            View Calendar
          </Button>
          <Button variant="outlined" onClick={handleExportTimeline}>
            Export Timeline
          </Button>
        </CardActions>
      </Card>
      <TaskDrawer
        open={open}
        onClose={toggleDrawer(false)}
        task={selectedTask}
        onTaskUpdate={async (updatedTask) => {
          // Update the selected task
          setSelectedTask(updatedTask)
          // Refresh meeting data to update all tasks in the UI
          await refreshMeetingData()
        }}
      />
    </>
  )
}
