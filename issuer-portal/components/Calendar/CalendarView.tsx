'use client'

import { motion } from 'framer-motion'
import React, { useCallback, useRef, useState } from 'react'

import { Box, Container } from '@mui/material'
import useMediaQuery from '@mui/material/useMediaQuery'

import TaskAddModal from '@/components/Dialogs/TaskAddDialog'
import ApprovalDrawer from '@/components/Drawers/ApprovalDrawer'
import TaskDrawer from '@/components/Drawers/TaskDrawer'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

import { useMeeting } from '@/contexts/MeetingContext'
import { transformApiTaskToTask } from '@/utils/taskTransformers'

import { CalendarHeader, type CalendarViewType } from './CalendarHeader'
import { ListView } from './ListView'
import { MonthView } from './MonthView'

type Task = components['schemas']['Task']

interface CalendarViewProps {
  meeting?: { id: string; meetingDate?: string | null; title?: string }
  onFullscreenChange?: (isFullscreen: boolean) => void
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  meeting,
  onFullscreenChange,
}) => {
  const { tasks, keyDates, tasksLoading, refreshMeetingData } = useMeeting()
  const [filters, setFilters] = useState({
    searchQuery: '',
    statusFilter: '',
    phaseFilter: null as number | null,
  })

  const isMobile = useMediaQuery('(max-width: 900px)')

  // Task action functions
  const approveTask = useCallback(
    async (taskId: string) => {
      try {
        const apiClient = await buildApiClient()
        const result = await apiClient.PUT('/tasks/{id}', {
          params: { path: { id: taskId } },
          body: { status: 'COMPLETE' },
        })

        if (result.error) {
          throw new Error('Failed to approve task')
        }

        // Refetch data after approval
        await refreshMeetingData()
      } catch (error) {
        throw error
      }
    },
    [refreshMeetingData]
  )

  // View state
  const [view, setView] = useState<CalendarViewType>('month')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Drawer state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Approval drawer state
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false)
  const [approvalDocumentUrl, setApprovalDocumentUrl] = useState<string>('')
  const [approvalTitle, setApprovalTitle] = useState<string>('')
  const [approvalTask, setApprovalTask] = useState<Task | null>(null)

  // Document viewer state
  const [, setDocumentViewerOpen] = useState(false)

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false)

  const handleTaskClick = async (taskId: string) => {
    try {
      const apiClient = await buildApiClient()
      const { data } = await apiClient.GET('/tasks/{id}', {
        params: { path: { id: taskId } },
      })

      if (!data) {
        return
      }

      // Convert API response to our Task type using centralized transformer
      const task = transformApiTaskToTask(data)

      if (!task) {
        return
      }

      // For approval tasks, open ApprovalDrawer directly
      if (task.type === 'approve') {
        // TODO: Add document link support when links property is added to Task schema
        const documentUrl = ''
        setApprovalDocumentUrl(documentUrl)
        setApprovalTitle(task.title || 'Task')
        setApprovalTask(task)
        setApprovalDrawerOpen(true)
        return
      }

      // Otherwise open TaskDrawer
      setSelectedTask(task)
      setDrawerOpen(true)
    } catch {
      // Error handled appropriately
    }
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setSelectedTask(null)
  }

  const handleApprovalDrawerClose = () => {
    setApprovalDrawerOpen(false)
    setApprovalDocumentUrl('')
    setApprovalTitle('')
    setApprovalTask(null)
  }

  const handleApprovalAddComment = (_comment: string) => {
    // TODO: implement comment submission logic
    // Placeholder until submission logic is implemented
    void _comment
  }

  const handleOpenFullscreen = () => {
    // Ensure calendar enters fullscreen before showing document viewer
    if (!isFullscreen) {
      setIsFullscreen(true)
      onFullscreenChange?.(true)

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden'
      }

      const event = new CustomEvent('calendar-fullscreen-change', {
        detail: { isFullscreen: true },
      })
      window.dispatchEvent(event)
    }
    setApprovalDrawerOpen(false)
    // Open the document viewer in fullscreen
    setDocumentViewerOpen(true)
  }

  const handleApprove = async () => {
    if (!approvalTask?.id) return

    try {
      await approveTask(approvalTask.id)
      handleApprovalDrawerClose()
    } catch {
      // Error handled appropriately
    }
  }

  const handleViewChange = (newView: CalendarViewType) => {
    setView(newView)
  }

  const handleSearchChange = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }))
  }

  const handleStatusFilterChange = (status: string) => {
    setFilters((prev) => ({ ...prev, statusFilter: status }))
  }

  const handlePhaseFilterChange = (phase: number | null) => {
    setFilters((prev) => ({ ...prev, phaseFilter: phase }))
  }

  const handleFullscreenToggle = () => {
    const newFullscreenState = !isFullscreen
    setIsFullscreen(newFullscreenState)
    onFullscreenChange?.(newFullscreenState)

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      document.body.style.overflow = newFullscreenState ? 'hidden' : ''
    }

    const event = new CustomEvent('calendar-fullscreen-change', {
      detail: { isFullscreen: newFullscreenState },
    })
    window.dispatchEvent(event)
  }

  const handleAddClick = () => {
    setAddModalOpen(true)
  }

  const handleTaskAdded = () => {
    // Refresh the data to show the new task
    refreshMeetingData()
  }

  return (
    <Container
      layout="position"
      className="CalendarContainer"
      ref={calendarRef}
      component={motion.div}
      initial={false}
      animate={{
        marginTop: isFullscreen ? 4 : 16,
        marginBottom: isFullscreen ? 4 : 24,
        paddingLeft: isFullscreen ? 4 : 16,
        paddingRight: isFullscreen ? 4 : 16,
      }}
      transition={{
        type: 'tween',
        duration: 0.3,
        ease: 'easeInOut',
      }}
      maxWidth={false}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? 'calc(100vh - 8px)' : 'auto',
        transition: 'height 0.2s ease-in-out',
        zIndex: isFullscreen ? 5000 : 1,
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : undefined,
        isolation: 'isolate',
        '&:before': {
          content: '""',
          position: isFullscreen ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          width: isFullscreen ? '100vw' : 'auto',
          height: isFullscreen ? '100vh' : 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1,
        },
      }}
    >
      <Box
        component={motion.div}
        sx={(theme) => ({
          border: `1px solid`,
          borderColor: theme.vars?.palette?.divider,
          borderRadius: 2,
          height: isFullscreen ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 3,
        })}
      >
        {/* Header with controls */}
        <CalendarHeader
          view={view}
          onViewChange={handleViewChange}
          searchQuery={filters.searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={filters.statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          phaseFilter={filters.phaseFilter}
          onPhaseFilterChange={handlePhaseFilterChange}
          isFullscreen={isFullscreen}
          onFullscreenToggle={handleFullscreenToggle}
          onAddClick={handleAddClick}
        />

        {/* Main content area */}
        <Box
          sx={(theme) => ({
            flex: 1,
            overflow: isFullscreen ? 'auto' : 'hidden',
            webkitOverflowScrolling: isFullscreen ? 'touch' : 'auto',
            scrollBehavior: isFullscreen ? 'smooth' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            background: theme.vars?.palette?.background?.default,
          })}
        >
          {view === 'month' && !isMobile ? (
            <MonthView
              searchQuery={filters.searchQuery}
              statusFilter={filters.statusFilter}
              phaseFilter={filters.phaseFilter}
              onTaskClick={handleTaskClick}
              tasks={tasks}
              keyDates={keyDates}
              loading={tasksLoading}
              onRefresh={async () => {
                await refreshMeetingData()
              }}
            />
          ) : (
            <ListView
              searchQuery={filters.searchQuery}
              statusFilter={filters.statusFilter}
              phaseFilter={filters.phaseFilter}
              onTaskClick={handleTaskClick}
              tasks={tasks}
              keyDates={keyDates}
              loading={tasksLoading}
            />
          )}
        </Box>
      </Box>

      <TaskDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        task={selectedTask}
        onTaskUpdate={async (updatedTask) => {
          // Update the selected task
          setSelectedTask(updatedTask)
          // Refresh meeting data to update all tasks in the UI
          await refreshMeetingData()
        }}
      />

      <ApprovalDrawer
        open={approvalDrawerOpen}
        onClose={handleApprovalDrawerClose}
        title={approvalTitle}
        fileUrl={approvalDocumentUrl}
        onApprove={handleApprove}
        taskStatus={approvalTask?.status}
        onOpenFullscreen={handleOpenFullscreen}
        onAddComment={handleApprovalAddComment}
      />

      <TaskAddModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onTaskAdded={handleTaskAdded}
        activeMeeting={meeting}
      />
    </Container>
  )
}

export default CalendarView
