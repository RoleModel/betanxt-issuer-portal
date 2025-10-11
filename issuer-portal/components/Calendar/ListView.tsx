'use client'

import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

import {
  Box,
  Divider,
  Fade,
  LinearProgress,
  List,
  ListItemButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

import { shiftWeekendToMonday } from '@/components/Calendar/CalendarUtils'
import TaskEditDialog from '@/components/Dialogs/TaskEditDialog'
import { getPhaseColor } from '@/components/mui-styling/theme'
import StatusChip from '@/components/ui/StatusChip'
import TaskContextMenu from '@/components/ui/TaskContextMenu'

import type { KeyDate, Task } from '@/types/api-exports'
import type { ContextMenuPosition } from '@/types/common'

/**
 * ListView component with left sidebar navigation and main content area
 * Matches Figma design with phase list on left and task details on right
 */

// Using KeyDate from consolidated types
interface DisplayKeyDate {
  id?: string
  title?: string
  date?: string
  phaseNumber?: number
  type?: string
  phaseId?: string
}

interface ListViewProps {
  searchQuery: string
  statusFilter: string
  phaseFilter: number | null
  currentPhase?: number
  onTaskClick: (taskId: string) => void
  tasks: Task[]
  keyDates: KeyDate[]
  loading: boolean
}

const filterTasks = (
  tasks: Task[],
  searchQuery: string,
  statusFilter: string
): Task[] => {
  return tasks.filter((task) => {
    const normalizedQuery = searchQuery.toLowerCase()
    const normalizedDesc = (task.description ?? '').toLowerCase()
    const matchesSearch =
      !searchQuery ||
      (task.title?.toLowerCase().includes(normalizedQuery) ?? false) ||
      normalizedDesc.includes(normalizedQuery)

    const matchesStatus = !statusFilter || task.status === statusFilter

    return matchesSearch && matchesStatus
  })
}

// Individual item animation - staggered by index

export const ListView: React.FC<ListViewProps> = ({
  searchQuery,
  statusFilter,
  phaseFilter,
  currentPhase = 1,
  onTaskClick,
  tasks: dbTasks,
  keyDates: dbKeyDates,
  loading,
}) => {
  const [loaded, setLoaded] = useState(false)

  // Use currentPhase as default instead of 'all' when no phaseFilter is provided
  const [selectedPhase, setSelectedPhase] = useState<number | 'all'>(
    phaseFilter ?? currentPhase ?? 'all'
  )

  // Context menu and edit modal state
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] =
    useState<ContextMenuPosition | null>(null)
  const [selectedTaskForContext, setSelectedTaskForContext] = useState<Task | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

  // Update selectedPhase when phaseFilter prop changes
  useEffect(() => {
    setSelectedPhase(phaseFilter ?? currentPhase ?? 'all')
  }, [phaseFilter, currentPhase])

  // Trigger fade in when data is ready and not loading
  useEffect(() => {
    if (!loading && (dbTasks.length > 0 || dbKeyDates.length > 0)) {
      setLoaded(true)
    } else if (!loading) {
      // Even if no data, still fade in the empty state
      const timer = setTimeout(() => setLoaded(true), 100)
      return () => clearTimeout(timer)
    }
  }, [loading, dbTasks.length, dbKeyDates.length])

  // Helper function to parse date strings for sorting
  const parseDateString = (dateStr: string): Date => {
    // Handle formats like "Aug 16" or "Friday, Aug 16"
    const cleanDateStr = dateStr.replace(/^[A-Za-z]+,\s*/, '')
    const currentYear = new Date().getFullYear()
    return new Date(`${cleanDateStr}, ${currentYear}`)
  }

  // Convert database records to expected format with weekend adjustment for tasks
  const prepareTaskForDisplay = (dbTask: Task): Task => {
    let formattedDate = undefined
    if (dbTask.dueDate) {
      // Parse date and apply weekend adjustment for tasks
      // Use UTC to avoid timezone issues
      const [year, month, day] = dbTask.dueDate.split('-').map(Number)
      const originalDate = new Date(Date.UTC(year, month - 1, day))
      const adjustedDate = shiftWeekendToMonday(originalDate)
      formattedDate = adjustedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    }

    return {
      id: dbTask.taskId ?? dbTask.id ?? '',
      title: dbTask.title ?? '',
      description: dbTask.description ?? '',
      status: dbTask.status ?? 'INCOMPLETE',
      dueDate: formattedDate ?? '',
      owner: dbTask.owner ?? 'BetaNXT',
      type: ['upload', 'signature', 'external', 'authorize', 'approve'].includes(
        dbTask.type ?? ''
      )
        ? dbTask.type ?? 'external'
        : 'external',
      phaseNumber: dbTask.phaseNumber ?? 1,
      phaseId: dbTask.phaseId ?? '',
      meetingId: dbTask.meetingId,
      taskId: dbTask.taskId ?? dbTask.id ?? '',
      documentId: dbTask.documentId ?? null,
      createdAt: dbTask.createdAt ?? undefined,
      updatedAt: dbTask.updatedAt ?? undefined,
    }
  }

  const convertKeyDateToDisplayKeyDate = (keyDate: KeyDate): DisplayKeyDate => ({
    id: keyDate.id,
    title: keyDate.title ?? '',
    date: keyDate.date
      ? (() => {
          try {
            // Handle ISO date strings like "2026-01-15T20:14:26.277-06:00"
            const originalDate = new Date(keyDate.date)
            const adjustedDate = shiftWeekendToMonday(originalDate)
            return adjustedDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC',
            })
          } catch {
            return keyDate.date
          }
        })()
      : '',
    phaseNumber: keyDate.phaseNumber || 1,
  })

  // Get data based on selected phase or all phases
  const getCurrentData = () => {
    if (loading) {
      return { tasks: [], keyDates: [] }
    }

    // Always use database data
    const convertedTasks = dbTasks.map(prepareTaskForDisplay)
    const convertedKeyDates = dbKeyDates.map(convertKeyDateToDisplayKeyDate)

    // Filter tasks by phase if a specific phase is selected
    let tasksToShow = convertedTasks
    let keyDatesToShow = convertedKeyDates

    if (selectedPhase !== 'all') {
      // Filter tasks by phase_number directly
      tasksToShow = dbTasks
        .filter((task) => {
          const matches = task.phaseNumber === selectedPhase
          return matches
        })
        .map(prepareTaskForDisplay)

      // Filter key dates by phase_number for specific phase
      keyDatesToShow = dbKeyDates
        .filter((keyDate) => keyDate.phaseNumber === selectedPhase)
        .map(convertKeyDateToDisplayKeyDate)
    } else {
      // When showing all tasks, deduplicate multi-phase tasks by showing only the earliest phase
      const taskMap = new Map<string, Task>()

      dbTasks.forEach((task) => {
        const key = task.title ?? ''
        const existing = taskMap.get(key)

        // Keep the task with the earliest phase number (or earliest due date if same phase)
        if (
          !existing ||
          (task.phaseNumber || 1) < (existing.phaseNumber || 1) ||
          ((task.phaseNumber || 1) === (existing.phaseNumber || 1) &&
            task.dueDate &&
            existing.dueDate &&
            task.dueDate < existing.dueDate)
        ) {
          taskMap.set(key, task)
        }
      })

      tasksToShow = Array.from(taskMap.values()).map(prepareTaskForDisplay)

      // When showing all phases, keep all key dates
      keyDatesToShow = dbKeyDates.map(convertKeyDateToDisplayKeyDate)
    }

    // Apply search and status filters
    const filteredTasks = filterTasks(tasksToShow, searchQuery, statusFilter)

    // Sort tasks chronologically
    filteredTasks.sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0
      const dateA = parseDateString(a.dueDate)
      const dateB = parseDateString(b.dueDate)
      return dateA.getTime() - dateB.getTime()
    })

    // Sort key dates chronologically
    const sortedKeyDates = [...keyDatesToShow].sort((a, b) => {
      const dateA = parseDateString(a.date ?? '')
      const dateB = parseDateString(b.date ?? '')
      return dateA.getTime() - dateB.getTime()
    })

    return {
      tasks: filteredTasks,
      keyDates: sortedKeyDates,
    }
  }

  const { tasks: filteredTasks, keyDates: currentKeyDates } = getCurrentData()

  // Calculate completion percentage for each phase
  const getPhaseCompletion = (phaseNumber: number) => {
    const phaseTasks = dbTasks.filter((t) => t.phaseNumber === phaseNumber)

    if (phaseTasks.length === 0) return 0
    const completed = phaseTasks.filter(
      (t) => t.status === 'COMPLETE' || t.status === 'AUTHORIZED'
    ).length
    return Math.round((completed / phaseTasks.length) * 100)
  }

  // Handle right-click on task
  const handleTaskRightClick = (event: React.MouseEvent, taskId: string) => {
    event.preventDefault()

    // Find the full database task
    const dbTask = dbTasks.find((t) => t.id === taskId || t.taskId === taskId)
    if (!dbTask) {
      return
    }

    setSelectedTaskForContext(dbTask)
    setContextMenuPosition({ x: event.clientX, y: event.clientY })
    setContextMenuOpen(true)
  }

  // Handle context menu actions
  const handleContextMenuClose = () => {
    setContextMenuOpen(false)
    setContextMenuPosition(null)
    setSelectedTaskForContext(null)
  }

  const handleEditTask = () => {
    if (selectedTaskForContext) {
      setTaskToEdit(prepareTaskForDisplay(selectedTaskForContext))
      setEditModalOpen(true)
    }
  }

  // Handle task update from edit modal
  const handleTaskUpdated = () => {
    // Trigger a refresh to get updated task data
    // This will re-fetch from the API
    setEditModalOpen(false)
    setTaskToEdit(null)
    // Force a re-render by updating the loaded state
    setLoaded(false)
    setTimeout(() => setLoaded(true), 100)
  }

  // Handle edit modal close
  const handleEditModalClose = () => {
    setEditModalOpen(false)
    setTaskToEdit(null)
  }

  return (
    <Fade in={loaded} timeout={500}>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '160px 1fr', md: '300px 1fr' }}
        height="100%"
        overflow="auto"
      >
        {/* Left Sidebar */}
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            borderRight: (theme) =>
              `1px solid ${theme.vars?.palette?.divider || theme.palette.divider}`,
            backgroundColor: (theme) =>
              theme.vars?.palette?.background?.paper || theme.palette.background.paper,
            overflow: 'auto',
            borderRadius: 0,
          }}
        >
          <ListItemButton
            selected={selectedPhase === 'all'}
            onClick={() => setSelectedPhase('all')}
            sx={(theme) => ({
              fontSize: theme.typography.body3.fontSize,
              py: 1.5,
              px: 2,
              backgroundColor: (theme) =>
                selectedPhase === 'all'
                  ? theme.vars?.palette?.action?.selected || theme.palette.action.selected
                  : 'transparent',
            })}
          >
            <Typography variant="body3" fontWeight={selectedPhase === 'all' ? 600 : 400}>
              View All
            </Typography>
          </ListItemButton>
          <Divider />

          <List sx={{ p: 0 }}>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((phaseNumber: number) => {
              const phaseColor = getPhaseColor(phaseNumber)
              const isSelected = selectedPhase === phaseNumber
              const isFiltered = phaseFilter === null || phaseFilter === phaseNumber
              const completion = getPhaseCompletion(phaseNumber)

              if (!isFiltered) return null

              return (
                <ListItemButton
                  key={phaseNumber}
                  selected={isSelected}
                  divider={true}
                  onClick={() => setSelectedPhase(phaseNumber)}
                  sx={{
                    width: '100%',
                    boxShadow: isSelected
                      ? `inset 4px 0px 0px 0px ${phaseColor}`
                      : 'none',

                    transition: (theme) => theme.transitions.create([
                      'box-shadow',
                      'background-color',
                    ]),
                    '&:hover': {
                      backgroundColor: (theme) => theme.vars?.palette?.action?.selected,
                      boxShadow: `inset 4px 0px 0px 0px ${phaseColor}`,
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                    py: 1,
                    px: 2,
                  }}
                >
                  <Box width="100%">
                    <Typography
                      variant="body3"
                      gutterBottom
                      fontWeight={isSelected ? 600 : 400}
                      sx={{
                        display: 'block',
                      }}
                    >
                      Phase {phaseNumber}
                    </Typography>
                    {isSelected && (
                      <Box
                        display="grid"
                        gridTemplateRows="1fr auto"
                        alignItems="start"
                        gap={1}
                        minWidth="100%"
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'flex',
                            lineHeight: 1,
                            alignItems: 'center',
                            width: '100%',
                            gap: 1,
                          }}
                        >
                          <span style={{ flex: 1 }}>Complete</span> {completion}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={completion}
                          color={`phase[${phaseNumber - 1}].main` as 'primary'}
                          aria-label={`Phase ${phaseNumber} completion: ${completion}%`}
                          sx={{
                            height: 6,
                            width: '100%',
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </ListItemButton>
              )
            })}
          </List>
        </Paper>

        {/* Main Content Area */}
        <Box flex={1} overflow="auto">
          {selectedPhase === 'all' ||
          (typeof selectedPhase === 'number' &&
            selectedPhase >= 1 &&
            selectedPhase <= 8) ? (
            <Stack p={{ xs: 1, md: 3 }} spacing={1}>
              <Box
                component="ul"
                sx={{ display: 'flex', flexDirection: 'column', gap: 1, m: 0, p: 0 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {(() => {
                    // Combine tasks and key dates into a single array with type information
                    const combinedItems: {
                      type: 'task' | 'keyDate'
                      item: Task | DisplayKeyDate
                      date: Date
                    }[] = []

                    // Add tasks with parsed dates
                    filteredTasks.forEach((task) => {
                      if (task.dueDate) {
                        combinedItems.push({
                          type: 'task',
                          item: task,
                          date: parseDateString(task.dueDate),
                        })
                      }
                    })

                    // Add key dates with parsed dates
                    currentKeyDates.forEach((keyDate) => {
                      combinedItems.push({
                        type: 'keyDate',
                        item: keyDate,
                        date: parseDateString(keyDate.date ?? ''),
                      })
                    })

                    // Sort all items chronologically, with key dates before tasks on the same date
                    combinedItems.sort((a, b) => {
                      const dateComparison = a.date.getTime() - b.date.getTime()
                      if (dateComparison !== 0) {
                        return dateComparison
                      }
                      // If dates are the same, put key dates before tasks
                      if (a.type === 'keyDate' && b.type === 'task') return -1
                      if (a.type === 'task' && b.type === 'keyDate') return 1
                      return 0
                    })
                    // Render combined items
                    if (combinedItems.length === 0) {
                      return (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                          <Typography variant="body3" color="text.secondary">
                            No tasks match your search criteria
                          </Typography>
                        </Paper>
                      )
                    }

                    return combinedItems.map((combinedItem, index) => {
                      if (combinedItem.type === 'keyDate') {
                        const keyDate = combinedItem.item as DisplayKeyDate
                        const uniqueKey = `keydate-${keyDate.id || keyDate.title || index}`
                        return (
                          <motion.li
                            layout
                            key={uniqueKey}
                            layoutId={uniqueKey}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{
                              duration: 0.4,
                              delay: index * 0.05,
                              ease: 'easeOut',
                            }}
                            style={{ listStyle: 'none', margin: 0, padding: 0 }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                backgroundColor: (theme) =>
                                  theme.vars?.palette?.keydate?.main,
                                borderLeft: (theme) =>
                                  `8px solid ${theme.vars?.palette?.keydate?.contrastText}`,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Typography
                                variant="body3"
                                fontWeight={500}
                                sx={{
                                  color: (theme) =>
                                    theme.vars?.palette?.keydate?.contrastText,
                                }}
                              >
                                {keyDate.title}
                              </Typography>
                              <Typography
                                variant="body3"
                                fontWeight={600}
                                sx={{
                                  color: (theme) =>
                                    theme.vars?.palette?.keydate?.contrastText,
                                }}
                              >
                                {keyDate.date}
                              </Typography>
                            </Paper>
                          </motion.li>
                        )
                      } else {
                        const task = combinedItem.item as Task
                        // Determine which phase this task belongs to
                        let taskPhase: number
                        if (selectedPhase === 'all') {
                          // For "View All", get phase from task's phase_number
                          const dbTask = dbTasks.find(
                            (t) => t.taskId === task.id || t.id === task.id
                          )
                          taskPhase = dbTask ? dbTask.phaseNumber || 1 : 1
                        } else {
                          // For specific phase selection, use the selected phase
                          taskPhase = selectedPhase
                        }
                        const taskPhaseColor: string = getPhaseColor(taskPhase)
                        const uniqueKey = `task-${task.id || task.taskId || task.title || index}`
                        return (
                          <motion.li
                            key={uniqueKey}
                            layoutId={uniqueKey}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{
                              duration: 0.4,
                              delay: index * 0.05,
                              ease: 'easeOut',
                            }}
                            style={{ listStyle: 'none', margin: 0, padding: 0 }}
                          >
                            <Paper
                              elevation={0}
                              tabIndex={0}
                              onClick={() => onTaskClick(task.id ?? '')}
                              onContextMenu={(e) => {
                                const dbTask = dbTasks.find(
                                  (t) => t.taskId === task.id || t.id === task.id
                                )
                                if (dbTask) {
                                  handleTaskRightClick(
                                    e,
                                    dbTask.id ?? dbTask.taskId ?? task.id ?? ''
                                  )
                                }
                              }}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                backgroundColor: (theme) =>
                                  task.status === 'COMPLETE' ||
                                  task.status === 'AUTHORIZED'
                                    ? theme.vars?.palette.background.default
                                    : theme.vars?.palette?.tableCellRow.fill,
                                boxShadow: (theme) =>
                                  `inset 0px 0px 0px 1px ${theme.vars?.palette?.divider}`,
                                borderLeft: (theme) =>
                                  task.status === 'COMPLETE' ||
                                  task.status === 'AUTHORIZED'
                                    ? `8px solid ${theme.vars?.palette.complete}`
                                    : `8px solid ${taskPhaseColor}`,
                                '&:hover': {
                                  boxShadow: `inset 0px 0px 0px 1px ${taskPhaseColor}`,
                                  borderLeftColor: taskPhaseColor,
                                },
                              }}
                            >
                              <Box
                                display="flex"
                                alignItems={{ xs: 'flex-start', md: 'center' }}
                                flexDirection={{ xs: 'column', md: 'row' }}
                                justifyContent="space-between"
                              >
                                <Box flex={1}>
                                  <Typography
                                    variant="body3"
                                    fontWeight={500}
                                    gutterBottom
                                    sx={{
                                      textDecoration:
                                        task.status === 'COMPLETE' ||
                                        task.status === 'AUTHORIZED'
                                          ? 'line-through'
                                          : 'none',
                                      opacity:
                                        task.status === 'COMPLETE' ||
                                        task.status === 'AUTHORIZED'
                                          ? 0.6
                                          : 1,
                                    }}
                                  >
                                    {task.title}
                                  </Typography>
                                  <Typography
                                    variant="body3"
                                    color="text.secondary"
                                    sx={{
                                      textDecoration:
                                        task.status === 'COMPLETE' ||
                                        task.status === 'AUTHORIZED'
                                          ? 'line-through'
                                          : 'none',
                                    }}
                                  >
                                    {task.owner ?? 'BetaNXT'}
                                  </Typography>
                                </Box>
                                <Box textAlign={{ xs: 'left', md: 'right' }}>
                                  <Typography
                                    variant="body3"
                                    fontWeight={500}
                                    color="primary"
                                  >
                                    {task.dueDate}
                                  </Typography>
                                  <StatusChip
                                    status={task.status ?? 'INCOMPLETE'}
                                    size="small"
                                  />
                                </Box>
                              </Box>
                            </Paper>
                          </motion.li>
                        )
                      }
                    })
                  })()}
                </AnimatePresence>
              </Box>
            </Stack>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <Typography variant="body3" color="text.secondary">
                Select a phase to view tasks
              </Typography>
            </Box>
          )}
        </Box>

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
          task={
            taskToEdit
              ? {
                  ...taskToEdit,
                  description: taskToEdit.description ?? '',
                  dueDate: taskToEdit.dueDate ?? '',
                  phaseNumber: taskToEdit.phaseNumber || 1,
                  links: taskToEdit.links || null,
                  type: [
                    'upload',
                    'signature',
                    'external',
                    'authorize',
                    'approve',
                  ].includes(taskToEdit.type ?? '')
                    ? (taskToEdit.type as
                        | 'upload'
                        | 'signature'
                        | 'external'
                        | 'authorize'
                        | 'approve')
                    : 'external',
                }
              : null
          }
          onTaskUpdated={handleTaskUpdated}
        />
      </Box>
    </Fade>
  )
}

export default ListView
