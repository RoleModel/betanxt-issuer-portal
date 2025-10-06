'use client'

import React, { useState } from 'react'

import { Assignment as TaskIcon } from '@mui/icons-material'
import {
  Box,
  Fade,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'

import TaskEditDialog from '@/components/Dialogs/TaskEditDialog'
import { getPhaseColor } from '@/components/mui-styling/theme'
import TaskContextMenu from '@/components/ui/TaskContextMenu'

import type { KeyDate, Task } from '@/types/api-exports'
import type { ContextMenuPosition } from '@/types/common'
import type { CalendarDate, CalendarMonth, CalendarWeek } from '@/types/common'

import { isToday, shiftWeekendToMonday } from './CalendarUtils'
import { TaskCard } from './TaskCard'

interface MonthViewProps {
  searchQuery: string
  statusFilter: string
  phaseFilter: number | null
  onTaskClick: (taskId: string) => void
  tasks: Task[]
  keyDates: KeyDate[]
  loading: boolean
  onRefresh?: () => Promise<void>
}

const getTaskPhase = (task: Task): number => {
  return task.phaseNumber ?? 1
}

// Simple date parsing without timezone issues
const parseDate = (dateStr: string | null): Date | null => {
  if (!dateStr) return null
  try {
    // Handle ISO dates and simple YYYY-MM-DD dates
    if (dateStr.includes('T')) {
      return new Date(dateStr)
    }
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day))
  } catch {
    return null
  }
}

// Parse date with weekend adjustment for tasks only
const parseDateWithWeekendShift = (dateStr: string | null): Date | null => {
  const date = parseDate(dateStr)
  if (!date) return null

  // Convert UTC date to local date for day-of-week calculation
  const localDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const shiftedLocalDate = shiftWeekendToMonday(localDate)

  // Convert back to UTC
  return new Date(
    Date.UTC(
      shiftedLocalDate.getFullYear(),
      shiftedLocalDate.getMonth(),
      shiftedLocalDate.getDate()
    )
  )
}

// UTC-compatible date comparison
const isSameDayUTC = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  )
}

// Helper function to get tasks for a specific date
const getTasksForDate = (date: Date, tasks: Task[]): Task[] => {
  return tasks.filter((task) => {
    const taskDate = parseDateWithWeekendShift(task.dueDate ?? null)
    if (!taskDate) return false
    // Convert input date to UTC for comparison
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    )
    return isSameDayUTC(taskDate, utcDate)
  })
}

// Helper function to get key dates for a specific date
const getKeyDatesForDate = (date: Date, keyDates: KeyDate[]): KeyDate[] => {
  return keyDates.filter((keyDate) => {
    const keyDateParsed = parseDateWithWeekendShift(keyDate.date ?? null)
    if (!keyDateParsed) return false
    // Convert input date to UTC for comparison
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    )
    return isSameDayUTC(keyDateParsed, utcDate)
  })
}

// Generate calendar months from data
const generateCalendar = (tasks: Task[], keyDates: KeyDate[]) => {
  // Get date range from tasks and key dates
  const allDates: Date[] = []

  tasks.forEach((task) => {
    const date = parseDateWithWeekendShift(task.dueDate ?? null)
    if (date) allDates.push(date)
  })

  keyDates.forEach((keyDate) => {
    const date = parseDateWithWeekendShift(keyDate.date ?? null)
    if (date) allDates.push(date)
  })

  if (allDates.length === 0) {
    // Fallback to current month
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    allDates.push(startDate, endDate)
  }

  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

  // Start from the beginning of the week containing the first date
  const startDate = new Date(minDate)
  startDate.setDate(startDate.getDate() - startDate.getDay()) // Start of week (Sunday)

  // End at the end of the week containing the last date
  const endDate = new Date(maxDate)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay())) // End of week (Saturday)

  const months: CalendarMonth[] = []
  const currentDate = new Date(startDate)
  const weeks: CalendarWeek[] = []

  while (currentDate <= endDate) {
    const week: CalendarWeek = { days: [] }

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dayDate = new Date(currentDate)
      const isCurrentMonth = dayDate >= minDate && dayDate <= maxDate

      const calendarDate: CalendarDate = {
        date: new Date(dayDate),
        isCurrentMonth,
        tasks: getTasksForDate(dayDate, tasks),
        keyDates: getKeyDatesForDate(dayDate, keyDates),
      }

      week.days.push(calendarDate)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    weeks.push(week)
  }

  // Group weeks by month
  if (weeks.length > 0) {
    let currentMonth = startDate.getMonth()
    let currentYear = startDate.getFullYear()
    let monthWeeks: CalendarWeek[] = []

    weeks.forEach((week) => {
      const firstDayOfWeek = week.days[0].date
      const weekMonth = firstDayOfWeek.getMonth()
      const weekYear = firstDayOfWeek.getFullYear()

      if (weekMonth !== currentMonth || weekYear !== currentYear) {
        if (monthWeeks.length > 0) {
          months.push({
            year: currentYear,
            month: new Date(currentYear, currentMonth),
            weeks: monthWeeks,
            monthName: new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            }),
          })
        }
        currentMonth = weekMonth
        currentYear = weekYear
        monthWeeks = [week]
      } else {
        monthWeeks.push(week)
      }
    })

    if (monthWeeks.length > 0) {
      months.push({
        year: currentYear,
        month: new Date(currentYear, currentMonth),
        weeks: monthWeeks,
        monthName: new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
      })
    }
  }

  return months
}

const filterTasks = (
  tasks: readonly Task[],
  searchQuery: string,
  statusFilter: string,
  phaseFilter: number | null
): Task[] => {
  return tasks.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      (task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

    const matchesStatus = !statusFilter || task.status === statusFilter

    const taskPhase = getTaskPhase(task)
    const matchesPhase = phaseFilter === null || taskPhase === phaseFilter

    return matchesSearch && matchesStatus && matchesPhase
  })
}

const DayCell: React.FC<{
  calendarDate: CalendarDate
  onTaskClick: (taskId: string) => void
  onTaskRightClick: (event: React.MouseEvent, taskId: string) => void
  searchQuery: string
  statusFilter: string
  phaseFilter: number | null
  allTasks: Task[]
}> = ({
  calendarDate,
  onTaskClick,
  onTaskRightClick,
  searchQuery,
  statusFilter,
  phaseFilter,
  allTasks,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const { date, isCurrentMonth, tasks, keyDates } = calendarDate
  const dayNumber = date.getDate()
  const dayOfWeek = date.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isCurrentDay = isToday(date)

  const filteredTasks = filterTasks(tasks, searchQuery, statusFilter, phaseFilter)

  // Check if this date has special key dates
  const hasMeetingDate = keyDates.some((kd: KeyDate) =>
    (kd.title ?? '').toLowerCase().includes('meeting date')
  )
  const hasKeyDate = keyDates.length > 0

  return (
    <Box
      sx={{
        minHeight: isMobile ? 80 : 120,
        p: 1,
        aspectRatio: '1/1',
        backgroundColor: (theme) => {
          if (hasMeetingDate) return theme.vars?.palette?.appBarPrimary.defaultFill
          if (hasKeyDate) return theme.vars?.palette.keydate.main
          if (isWeekend) return theme.vars?.palette?.background.paper
          return theme.vars?.palette?.background?.default
        },
        borderBottom: (theme) =>
          hasKeyDate ? 'none' : `1px solid ${theme.vars?.palette?.divider}`,
        borderRight: (theme) =>
          hasKeyDate
            ? 'none'
            : dayOfWeek === 6
              ? 'none'
              : `1px solid ${theme.vars?.palette?.divider}`,
        color: (theme) => {
          if (hasMeetingDate) return theme.vars?.palette?.common?.white
          if (hasKeyDate) return theme.vars?.palette.keydate.contrastText
          return isCurrentDay
            ? theme.vars?.palette?.primary?.main
            : isCurrentMonth
              ? theme.vars?.palette?.text?.primary
              : theme.vars?.palette?.text?.secondary
        },
        opacity:
          !isCurrentMonth && filteredTasks.length === 0 && keyDates.length === 0
            ? 0.5
            : 1,
        position: 'relative',
        overflowY: 'auto',
        borderRadius: hasKeyDate ? 1 : 0,
        scrollbarWidth: 'none',
      }}
    >
      {/* Day number */}
      <Typography
        variant={isMobile ? 'caption' : 'body3'}
        fontWeight={isCurrentDay ? 600 : 400}
        sx={{
          mb: 0,
          position: 'absolute',
          top: 4,
          right: 8,
          color: 'inherit',
        }}
      >
        {dayNumber}
      </Typography>

      <Box sx={{ mt: 2, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {keyDates.map((keyDate: KeyDate) => {
          const isMeetingDate = (keyDate.title ?? '').toLowerCase().includes('meeting date')

          const keyDateTask: Task = {
            id: keyDate.id,
            title: keyDate.title,
            description: null,
            status: 'INCOMPLETE',
            owner: '',
            dueDate: keyDate.date,
            meetingId: '',
            phaseId: '',
            phaseNumber: keyDate.phaseNumber ?? 1,
            type: 'external',
            taskId: keyDate.id,
            documentId: null,
            links: null,
            createdAt: undefined,
            updatedAt: undefined,
          }

          return (
            <TaskCard
              key={keyDate.id}
              task={keyDateTask}
              variant="compact"
              isKeyDate={!isMeetingDate}
              isMeetingDate={isMeetingDate}
              isActualKeyDate={true}
              showPhaseIndicator={false}
            />
          )
        })}

        {/* Tasks */}
        <Stack spacing={0.5}>
          {filteredTasks.slice(0, isMobile ? 2 : 3).map((task) => {
            // Find the original Task to get phaseNumber
            const originalTask = allTasks.find(
              (t) => t.id === task.id || t.taskId === task.id
            )
            const taskPhase = originalTask
              ? getTaskPhase(originalTask)
              : getTaskPhase(task)

            // Get phase config the same way ListView does
            const taskPhaseColor = getPhaseColor(taskPhase - 1)

            return (
              <TaskCard
                key={task.id}
                task={task}
                phase={taskPhase}
                phaseColor={taskPhaseColor} // Pass color directly
                variant="compact"
                showPhaseIndicator={true} // Always show phase indicator for tasks
                isKeyDate={hasKeyDate && !hasMeetingDate} // Tasks on key date cells get key date styling
                isMeetingDate={hasMeetingDate} // Tasks on meeting date cells get meeting date styling
                onClick={() => task.id && onTaskClick(task.id)}
                onContextMenu={(e) => task.id && onTaskRightClick(e, task.id)}
              />
            )
          })}

          {filteredTasks.length > (isMobile ? 2 : 3) && (
            <Typography
              variant="caption"
              sx={{
                textAlign: 'center',
                fontStyle: 'italic',
                cursor: 'pointer',
                color: (theme) =>
                  theme.vars?.palette?.text?.secondary || theme.palette.text.secondary,
                '&:hover': {
                  color: (theme) =>
                    theme.vars?.palette?.primary?.main || theme.palette.primary.main,
                },
              }}
            >
              +{filteredTasks.length - (isMobile ? 2 : 3)} more
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Current day indicator */}
      {isCurrentDay && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: (theme) => theme.vars?.palette?.secondary?.light,
          }}
        />
      )}
    </Box>
  )
}

const MonthGrid: React.FC<{
  month: CalendarMonth
  onTaskClick: (taskId: string) => void
  onTaskRightClick: (event: React.MouseEvent, taskId: string) => void
  searchQuery: string
  statusFilter: string
  phaseFilter: number | null
  allTasks: Task[]
}> = ({
  month,
  onTaskClick,
  onTaskRightClick,
  searchQuery,
  statusFilter,
  phaseFilter,
  allTasks,
}) => {
  return (
    <Box>
      {/* Calendar grid - no gaps between cells */}
      {month.weeks.map((week: CalendarWeek, weekIndex: number) => (
        <Box key={weekIndex} display="grid" gridTemplateColumns="repeat(7, 1fr)">
          {week.days.map((calendarDate: CalendarDate, dayIndex: number) => (
            <DayCell
              key={dayIndex}
              calendarDate={calendarDate}
              onTaskClick={onTaskClick}
              onTaskRightClick={onTaskRightClick}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              phaseFilter={phaseFilter}
              allTasks={allTasks}
            />
          ))}
        </Box>
      ))}
    </Box>
  )
}

export const MonthView: React.FC<MonthViewProps> = ({
  searchQuery,
  statusFilter,
  phaseFilter,
  onTaskClick,
  tasks,
  keyDates,
  loading,
  onRefresh,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const months = generateCalendar(tasks, keyDates)

  const [loaded, setLoaded] = React.useState(false)

  // Trigger fade in when data is ready and not loading
  React.useEffect(() => {
    if (!loading && (tasks.length > 0 || keyDates.length > 0)) {
      setLoaded(true)
    } else if (!loading) {
      // Even if no data, still fade in the empty state
      const timer = setTimeout(() => setLoaded(true), 100)
      return () => clearTimeout(timer)
    }
  }, [loading, tasks.length, keyDates.length])

  // Context menu and edit modal state
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] =
    useState<ContextMenuPosition | null>(null)
  const [selectedTaskForContext, setSelectedTaskForContext] = useState<Task | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

  // Context menu handlers
  const handleTaskRightClick = (event: React.MouseEvent, taskId: string) => {
    event.preventDefault()
    event.stopPropagation()

    const task = tasks.find((t) => t.id === taskId || t.taskId === taskId)
    if (!task) return

    setSelectedTaskForContext(task)
    setContextMenuPosition({ x: event.clientX, y: event.clientY })
    setContextMenuOpen(true)
  }

  const handleContextMenuClose = () => {
    setContextMenuOpen(false)
    setContextMenuPosition(null)
    setSelectedTaskForContext(null)
  }

  const handleEditTask = () => {
    if (selectedTaskForContext) {
      setTaskToEdit(selectedTaskForContext)
      setEditModalOpen(true)
      setContextMenuOpen(false)
    }
  }

  const _handleViewTask = () => {
    if (selectedTaskForContext) {
      const taskId = selectedTaskForContext.taskId ?? selectedTaskForContext.id
      if (taskId) {
        onTaskClick(taskId)
      }
      setContextMenuOpen(false)
    }
  }

  const handleEditModalClose = () => {
    setEditModalOpen(false)
    setTaskToEdit(null)
  }

  const handleTaskUpdated = async () => {
    // Trigger a refresh of tasks data from parent component
    if (onRefresh) {
      await onRefresh()
    }
    setEditModalOpen(false)
    setTaskToEdit(null)
  }

  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]

  if (months.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <TaskIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No tasks or events to display
        </Typography>
        <Typography variant="body3" color="text.secondary">
          Tasks and key dates will appear here once they are scheduled.
        </Typography>
      </Box>
    )
  }

  return (
    <Fade in={loaded} timeout={500}>
      <Paper
        elevation={0}
        square
        sx={(theme) => ({
          backgroundColor: theme.vars?.palette?.background?.paper,
        })}
      >
        {/* Fixed day headers */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(7, 1fr)"
          sx={{
            backgroundColor: (theme) => theme.vars?.palette?.background?.paper,
            borderBottom: (theme) => `1px solid ${theme.vars?.palette?.divider}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          {dayNames.map((dayName, index) => {
            return (
              <Box
                key={dayName}
                sx={{
                  py: 1,
                  px: 2,
                  backgroundColor: (theme) => theme.vars?.palette?.background?.paper,
                  borderRight: (theme) =>
                    index < 6 ? `1px solid ${theme.vars?.palette?.divider}` : 'none',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body3" fontWeight={500} color="text.primary">
                  {isMobile ? dayName.substring(0, 3) : dayName}
                </Typography>
              </Box>
            )
          })}
        </Box>

        {/* Continuous calendar grid */}

        {months.map((month: CalendarMonth) => (
          <MonthGrid
            key={`${month.year}-${month.month}`}
            month={month}
            onTaskClick={onTaskClick}
            onTaskRightClick={handleTaskRightClick}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            phaseFilter={phaseFilter}
            allTasks={tasks}
          />
        ))}

        {/* Context Menu */}
        <TaskContextMenu
          open={contextMenuOpen}
          position={contextMenuPosition}
          onClose={handleContextMenuClose}
          onEdit={handleEditTask}
        />

        {/* Task Edit Modal */}
        <TaskEditDialog
          open={editModalOpen}
          onClose={handleEditModalClose}
          task={taskToEdit}
          onTaskUpdated={handleTaskUpdated}
        />
      </Paper>
    </Fade>
  )
}

export default MonthView
