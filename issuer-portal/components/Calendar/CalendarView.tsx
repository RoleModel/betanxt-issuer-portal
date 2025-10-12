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
import { exportCalendarToIcs } from '@/utils/exportCalendarIcs'
import { exportTimelineToPdf } from '@/utils/exportTimelinePdf'
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
        setApprovalTitle(task.title ?? 'Task')
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
    void refreshMeetingData()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportIcs = () => {
    try {
      exportCalendarToIcs({
        tasks,
        keyDates,
        meetingTitle: meeting?.title ?? 'Meeting Calendar',
        meetingId: meeting?.id,
      })
    } catch (error) {
      console.error('Error exporting ICS:', error)
    }
  }

  const handleExportPdf = async () => {
    try {
      // Get client ticker from meeting ID (e.g., "wen-annual-meeting-2026" -> "WEN")
      const clientTicker = meeting?.id?.split('-')[0]?.toUpperCase()

      await exportTimelineToPdf({
        tasks,
        keyDates,
        meetingTitle: meeting?.title ?? 'Meeting Timeline',
        selectedPhase: 'all',
        clientTicker,
      })
    } catch (error) {
      console.error('Error exporting PDF:', error)
    }
  }

  return (
    <>

      <Container
        className="CalendarContainer"
        ref={calendarRef}
        component={motion.div}
        layout="position" // Only animate position changes, not size
        layoutScroll // Preserve scroll position
        initial={false}
        transition={{
          layout: {
            type: 'tween',
            duration: 0.25,
            ease: [0.2, 0, 0.2, 1] // Material UI standard easing
          }
        }}
        maxWidth={isFullscreen ? false : 'xl'}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          isolation: 'isolate',
          borderRadius: 2,
          position: isFullscreen ? 'fixed' : 'relative',
          inset: isFullscreen ? 0 : 'auto',
          width: isFullscreen ? '100vw' : 'auto',
          height: isFullscreen ? '100vh' : 'auto',
          margin: isFullscreen ? 0 : 'auto',
          marginTop: isFullscreen ? 0 : 2,
          marginBottom: isFullscreen ? 0 : 2,
          zIndex: isFullscreen ? 5000 : 100,
          padding: isFullscreen ? 1 : 0,
          tranformOrigin: 'center center',
          paddingLeft: { sm: 1, md: isFullscreen ? 1 : 2, },
          paddingRight: { sm: 1, md: isFullscreen ? 1 : 2, },
        }}
      >
        <Box
          component={motion.div}
          layoutRoot // Prevents layout animations from propagating to children
          sx={{
            border: `1px solid`,
            borderColor: 'var(--mui-palette-divider)',
            borderRadius: 2,
            height: isFullscreen ? '100%' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 3,
          }}
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
            onPrint={handlePrint}
            onExportIcs={handleExportIcs}
            onExportPdf={handleExportPdf}
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
    </>
  )
}

export default CalendarView
