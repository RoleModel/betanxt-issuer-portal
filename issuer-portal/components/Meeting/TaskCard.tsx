'use client'

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

import { getPhaseColor, theme } from '@/components/mui-styling/theme'
import TaskDrawer from '@/components/Drawers/TaskDrawer'
import StatusChip from '@/components/ui/StatusChip'
import { useRouter } from 'next/navigation'
import { exportTimelineToPdf } from '@/utils/exportTimelinePdf'

import { useMeeting } from '@/contexts/MeetingContext'
import { formatDate } from '@/lib/formats'
import type { Task } from '@/types/api'

interface TaskItemProps {
  meetingId?: string
  currentPhase?: number
  task: Task
  isClickable: boolean
  phaseColor: string
  onClick: (taskId: string) => void
}

export function TaskItem({ task, phaseColor, onClick, isClickable }: TaskItemProps) {
  return (
    <Card
      className={`task-card-${task.id}`}
      key={task.id}
      sx={{
        background: (theme) => theme.vars.palette.tableCellRow.fill,
        borderLeft: `6px solid`,
        borderLeftColor: phaseColor,
        borderTop: 0,
        borderBottom: 0,
        borderRight: 0,
        boxShadow: `inset 0px 0px 0px 1px ${theme.vars.palette.divider}`,
        p: 0,
        textAlign: 'left',
        width: '100%',
        '&:hover': {
          boxShadow: `0px 0px 0px 1px inset ${phaseColor}`,
        },
      }}
    >
      <CardActionArea onClick={() => onClick(task.id)} disabled={!isClickable}>
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
              <StatusChip status={task.status} size="small" />
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
  currentPhase = 1,
  onClick,
}: TaskCardProps) {

  const { tasks, tasksLoading, keyDates, currentMeeting } = useMeeting()

  const displayTasks = tasks.filter(
    (task) =>
      task.phaseNumber === currentPhase && !['BetaNXT', 'DFIN'].includes(task.owner)
  )
  const [open, setOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const router = useRouter()
  const handleViewCalendarClick = () => {
    router.push('calendar')
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
        clientTicker: currentMeeting.ticker || undefined
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
        <CardHeader title="Tasks - Phase Title" />
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
                const isClickable = task.status !== 'COMPLETE'
                const phaseColor = getPhaseColor(currentPhase)
                return (
                  <TaskItem
                    key={task.id}
                    meetingId={meetingId}
                    currentPhase={currentPhase}
                    task={task}
                    onClick={handleTaskClick}
                    isClickable={isClickable}
                    phaseColor={phaseColor}
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
      <TaskDrawer open={open} onClose={toggleDrawer(false)} task={selectedTask} />
    </>
  )
}
