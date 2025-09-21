'use client'

import { motion } from 'framer-motion'
import React, { useCallback, useRef, useState } from 'react'

import { Box, Container } from '@mui/material'
import useMediaQuery from '@mui/material/useMediaQuery'

import TaskAddModal from '@/components/Dialogs/TaskAddDialog'
import ApprovalDrawer from '@/components/Drawers/ApprovalDrawer'
import TaskDrawer from '@/components/Drawers/TaskDrawer'

import { getTaskById, updateTask } from '@/domain-models/api/tasks'
import { useMeeting } from '@/contexts/MeetingContext'
import type { Task } from '@/types/api'

import { CalendarHeader, type CalendarViewType } from './CalendarHeader'
import { ListView } from './ListView'
import { MonthView } from './MonthView'


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

  const isMobile = useMediaQuery('(max-width: 600px)')

  // Task action functions
  const approveTask = useCallback(
    async (taskId: string) => {
      try {
        const result = await updateTask(taskId, { status: 'COMPLETE' })

        if (result.error) {
          throw new Error('Failed to approve task')
        }

        // Refetch data after approval
        await refreshMeetingData()
      } catch (error) {
        console.error('Error approving task:', error)
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
  const [_documentViewerOpen, setDocumentViewerOpen] = useState(false)

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false)

  const handleTaskClick = async (taskId: string) => {
    try {
      const result = await getTaskById(taskId)

      if (result.error || !result.data) {
        console.error('Task not found:', taskId)
        return
      }

      const apiTask = result.data

      // Convert API response to our Task type
      const task: Task = {
        id: apiTask.id || '',
        title: apiTask.title || '',
        description: apiTask.description || null,
        owner: apiTask.owner || 'BetaNXT',
        dueDate: apiTask.dueDate || null,
        status: apiTask.status || 'INCOMPLETE',
        meetingId: apiTask.meetingId || '',
        phaseId: apiTask.phaseId || '',
        phaseNumber: apiTask.phaseNumber || 0,
        type: (apiTask.type || 'external') as Task['type'],
        taskId: apiTask.taskId || apiTask.id || '',
        documentId: apiTask.documentId || null,
        links: (apiTask.links as Task['links']) || null,
        createdAt: apiTask.createdAt || null,
        updatedAt: apiTask.updatedAt || null,
      }

      // For approval tasks, open ApprovalDrawer directly
      if (task.type === 'approve') {
        // Use document link from task links if available
        const documentUrl = task.links?.find(link => link.action === 'download')?.url || ''
        setApprovalDocumentUrl(documentUrl)
        setApprovalTitle(task.title)
        setApprovalTask(task)
        setApprovalDrawerOpen(true)
        return
      }

      // Otherwise open TaskDrawer
      setSelectedTask(task)
      setDrawerOpen(true)
    } catch (err) {
      console.error('Error fetching task details:', err)
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

  const handleApprovalAddComment = (comment: string) => {
    console.log('Approval comment added:', comment)
  }

  const handleOpenFullscreen = () => {
    // Close the approval drawer
    setApprovalDrawerOpen(false)
    // Open the document viewer in fullscreen
    setDocumentViewerOpen(true)
  }

  const _handleCloseDocumentViewer = () => {
    setDocumentViewerOpen(false)
  }

  const handleApprove = async () => {
    if (!approvalTask?.id) return

    try {
      await approveTask(approvalTask.id)
      handleApprovalDrawerClose()
    } catch (err) {
      console.error('Error approving document:', err)
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
        marginTop: isFullscreen ? 4 : 24,
        marginBottom: isFullscreen ? 4 : 24,
        paddingLeft: isFullscreen ? 4 : 24,
        paddingRight: isFullscreen ? 4 : 24,
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
        zIndex: isFullscreen ? 10 : '1',
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
              onRefresh={refreshMeetingData}
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
              onRefresh={refreshMeetingData}
            />
          )}
        </Box>
      </Box>

      <TaskDrawer open={drawerOpen} onClose={handleDrawerClose} task={selectedTask} />

      <ApprovalDrawer
        open={approvalDrawerOpen}
        onClose={handleApprovalDrawerClose}
        title={approvalTitle}
        pdfUrl={approvalDocumentUrl}
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

      {/* TODO: Add DocumentViewer component */}
      {/* <DocumentViewer
        open={documentViewerOpen}
        onClose={handleCloseDocumentViewer}
        pdfUrl={approvalDocumentUrl}
        title={approvalTitle}
        taskId={approvalTask?.id}
        onSubmitSuccess={() => {
          // Refresh calendar data and close viewer
          refreshData()
          handleCloseDocumentViewer()
        }}
      /> */}
    </Container>
  )
}

export default CalendarView
