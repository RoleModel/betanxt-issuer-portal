'use client'

import { Global } from '@emotion/react'
import React, { useCallback, useMemo, useState } from 'react'
import type { FileRejection } from 'react-dropzone'

import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Stack,
  SwipeableDrawer,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'

import TaskEditDialog from '@/components/Dialogs/TaskEditDialog'
import DocumentViewer from '@/components/Documents/DocumentViewer'
import ApprovalDrawer from '@/components/Drawers/ApprovalDrawer'
import BNFileDropzone from '@/components/file-upload/BNFileDropzone'
import StatusChip from '@/components/ui/StatusChip'
import TaskContextMenu from '@/components/ui/TaskContextMenu'

import { useMeeting } from '@/contexts/MeetingContext'
import { usePhases } from '@/hooks/usePhases'
import type { KeyDate, Task, TaskLink } from '@/types/api'
import type { ContextMenuPosition } from '@/types/common'
import { calculateDaysUntil, formatDaysUntil } from '@/utils/dateUtils'

// Phase URL type for UI
type PhaseUrl = { title: string; description?: string; url?: string }

// Signature area type (should match DocumentViewer interface)
type SignatureArea = {
  id: string
  x: number
  y: number
  width: number
  height: number
  page?: number
  label?: string
  signed?: boolean
}

// Swipeable drawer constants
const drawerBleeding = 56

// Styled components for swipeable drawer
const StyledBox = styled('div')(({ theme }) => ({
  backgroundColor: theme.vars?.palette.background.paper || '#fff',
}))

const Puller = styled('div')(({ theme }) => ({
  width: 30,
  height: 6,
  backgroundColor: theme.vars?.palette.divider || '#e0e0e0',
  borderRadius: 3,
  position: 'absolute',
  top: 8,
  left: 'calc(50% - 15px)',
}))

// Remove duplicate SignatureArea - use from DocumentViewer if needed

interface PhaseDrawerProps {
  open: boolean
  onClose: () => void
  phase: number
  onPhaseChange?: (newPhase: number) => void
  onTaskClick?: (taskId: string) => void
}

const PhaseDrawer: React.FC<PhaseDrawerProps> = (props) => {
  const { open, onClose, phase = 1, onPhaseChange, onTaskClick } = props

  // Get active meeting and tasks from context
  const { currentMeeting, tasks, tasksLoading, refreshMeetingData, keyDates: meetingKeyDates, setCurrentMeeting } = useMeeting()

  // Mobile detection
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Get phases using the proper hook
  const {
    phases,
    loading: phaseLoading,
    error: phaseError,
    refetch: _refetchPhaseData,
  } = usePhases(currentMeeting?.id)

  const [currentView, setCurrentView] = useState<'overview' | 'upload'>('overview')

  // Determine current phase from MeetingContext, fallback to prop, then 1
  const currentPhaseNumber = React.useMemo(() => {
    const label = currentMeeting?.currentPhase || `Phase ${phase || 1}`
    const parsed = parseInt(label.replace('Phase ', ''))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : (phase || 1)
  }, [currentMeeting?.currentPhase, phase])
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadTaskTitle, setUploadTaskTitle] = useState('')
  const [hasUnsupportedFiles, setHasUnsupportedFiles] = useState(false)
  const [mobileUploadOpen, setMobileUploadOpen] = useState(false)
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [documentUrl, setDocumentUrl] = useState<string>('')
  const [documentTitle, setDocumentTitle] = useState<string>('')
  const [signatureAreas, setSignatureAreas] = useState<SignatureArea[]>([])
  const [approvalDrawerOpen, setApprovalDrawerOpen] = useState(false)
  const [approvalDocumentUrl, setApprovalDocumentUrl] = useState<string>('')
  const [approvalTitle, setApprovalTitle] = useState<string>('')

  // Context menu states
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [TaskEditDialogOpen, setTaskEditDialogOpen] = useState(false)

  // Get theme and phase color using theme palette
  const phaseColor = theme.vars.palette.phase[currentPhaseNumber - 1].main
  const phaseContrast = theme.vars.palette.phase[currentPhaseNumber - 1].contrastText

  // Find the current phase data
  const currentPhaseData = phases.find((p) => p.orderIndex === currentPhaseNumber)
  const phaseTitle = currentPhaseData?.name || `Phase ${currentPhaseNumber}`

  // Filter tasks for the current phase from context and cast to TaskWithLinks
  // Memoize filtered tasks for performance
  const phaseTasks = useMemo(() =>
    tasks.filter((task) => task.phaseNumber === currentPhaseNumber),
    [tasks, currentPhaseNumber]
  )

  // Get key dates for current phase from MeetingContext
  const keyDates: KeyDate[] = React.useMemo(() => {
    if (currentPhaseData?.keyDates) {
      // If phase has specific key dates in the phase data, use those
      return Object.entries(currentPhaseData.keyDates)
        .filter(([, value]) => value)
        .map(([key, value]) => ({
          id: key,
          title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
          phaseNumber: currentPhaseNumber,
          date: value as string,
        }))
    }

    // Use key dates from MeetingContext (with correct phase assignments)
    return meetingKeyDates.filter((kd) => kd.phaseNumber === currentPhaseNumber)
  }, [currentPhaseData, meetingKeyDates, currentPhaseNumber])

  // URLs would come from phase data if available (currently not in our schema)
  const urls: PhaseUrl[] = []

  const handleFilesSelected = (newFiles: File[]) => {
    setUploadFiles((prev) => [...prev, ...newFiles])
    setHasUnsupportedFiles(false)
  }

  const handleFileRejections = (fileRejections: FileRejection[]) => {
    const hasUnsupportedType = fileRejections.some((rejection) =>
      rejection.errors.some((error) => error.code === 'file-invalid-type')
    )
    if (hasUnsupportedType) {
      setHasUnsupportedFiles(true)
    }
  }

  const handleTaskLinkClick = useCallback(
    (
      taskId: string,
      taskTitle: string,
      linkLabel: string,
      linkAction?: string,
      linkUrl?: string,
      linkSignatureAreas?: SignatureArea[]
    ) => {
      if (linkAction === 'sign') {
        if (linkUrl) {
          // Open DocumentViewer with the PDF URL
          setDocumentUrl(linkUrl)
          setDocumentTitle(taskTitle)
          setSignatureAreas(linkSignatureAreas || [])
          setDocumentViewerOpen(true)
        } else {
          // Fallback to original behavior if no URL provided
          console.log('Attempting to open signature document for task:', taskId)
          if (onTaskClick) {
            onTaskClick(taskId)
            onClose()
          } else {
            console.error('onTaskClick function not provided')
          }
        }
      } else if (
        linkAction === 'upload' ||
        linkLabel.includes('Upload') ||
        linkLabel.includes('Submit')
      ) {
        setUploadTaskTitle(taskTitle)
        if (isMobile) {
          setMobileUploadOpen(true)
        } else {
          setCurrentView('upload')
        }
      }
    },
    [onTaskClick, onClose, isMobile]
  )

  const handleTaskApprovalClick = useCallback((task: Task) => {
    if (task.type === 'approve' && task.links?.[0]?.url) {
      setApprovalDocumentUrl(task.links[0].url)
      setApprovalTitle(task.title)
      setApprovalDrawerOpen(true)
    }
  }, [])

  const handleBackToOverview = () => {
    setCurrentView('overview')
    setUploadFiles([])
    setUploadTaskTitle('')
    setMobileUploadOpen(false)
  }

  const handleMobileUploadClose = () => {
    setMobileUploadOpen(false)
    setUploadFiles([])
    setUploadTaskTitle('')
  }

  const toggleMobileUpload = (newOpen: boolean) => () => {
    setMobileUploadOpen(newOpen)
  }

  const handleMainDrawerClose = () => {
    setCurrentView('overview')
    setUploadFiles([])
    setUploadTaskTitle('')
    onClose()
  }

  const handleDocumentViewerClose = useCallback(() => {
    setDocumentViewerOpen(false)
    setDocumentUrl('')
    setDocumentTitle('')
    setSignatureAreas([])
  }, [])

  const handleApprovalDrawerClose = useCallback(() => {
    setApprovalDrawerOpen(false)
    setApprovalDocumentUrl('')
    setApprovalTitle('')
  }, [])

  const handleApprove = useCallback(() => {
    // Handle approval logic here
    console.log('Document approved:', approvalTitle)
    handleApprovalDrawerClose()
  }, [approvalTitle, handleApprovalDrawerClose])

  // Context menu handlers - memoized for performance
  const handleTaskRightClick = useCallback((event: React.MouseEvent, task: Task) => {
    event.preventDefault()
    setSelectedTask(task)
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null)
    setSelectedTask(null)
  }, [])

  const handleTaskEdit = useCallback(() => {
    if (selectedTask) {
      setTaskEditDialogOpen(true)
      handleContextMenuClose()
    }
  }, [selectedTask, handleContextMenuClose])

  const handleTaskView = () => {
    if (selectedTask) {
      console.log('View task details:', selectedTask)
      // You could open a view-only modal or expand the task details
    }
  }

  const handleTaskEditDialogClose = useCallback(() => {
    setTaskEditDialogOpen(false)
  }, [])

  const handleTaskUpdated = useCallback(() => {
    // Refresh meeting data (including tasks) after task update
    refreshMeetingData()
  }, [refreshMeetingData])

  const handlePhaseNavigation = useCallback((direction: 'prev' | 'next') => {
    const maxPhase = 8 // We have 8 phases
    const next = direction === 'prev' ? Math.max(1, currentPhaseNumber - 1) : Math.min(maxPhase, currentPhaseNumber + 1)

    // Update MeetingContext.currentMeeting.currentPhase so all openers stay in sync
    if (currentMeeting) {
      setCurrentMeeting({
        ...currentMeeting,
        currentPhase: `Phase ${next}`,
      } as typeof currentMeeting)
    }

    onPhaseChange?.(next)
  }, [currentPhaseNumber, currentMeeting, setCurrentMeeting, onPhaseChange])

  const renderMobileUploadDrawer = () => (
    <>
      <Global
        styles={{
          '.MuiDrawer-root > .MuiPaper-root': {
            height: `calc(70% - ${drawerBleeding}px)`,
            overflow: 'visible',
          },
        }}
      />
      <SwipeableDrawer
        anchor="bottom"
        open={mobileUploadOpen}
        onClose={toggleMobileUpload(false)}
        onOpen={toggleMobileUpload(true)}
        swipeAreaWidth={drawerBleeding}
        disableSwipeToOpen={false}
        keepMounted
        ModalProps={{
          disableEnforceFocus: true,
        }}
      >
        <StyledBox
          sx={{
            position: 'absolute',
            top: -drawerBleeding,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            visibility: 'visible',
            right: 0,
            left: 0,
            height: drawerBleeding,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Puller />
        </StyledBox>
        <StyledBox sx={{ height: '100%', overflow: 'hidden' }}>
          {renderUploadContent()}
        </StyledBox>
      </SwipeableDrawer>
    </>
  )

  const renderUploadContent = () => (
    <Stack sx={{ height: '100%' }}>
      {/* Header */}
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: theme.vars.palette.divider,
          p: 2,
          height: 60,
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 500 }}>
            {uploadTaskTitle || 'Upload Form'}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={isMobile ? handleMobileUploadClose : handleBackToOverview}
          aria-label="Close upload view and return to overview"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Upload Area */}
      <Box sx={{ m: 3, height: 300 }}>
        <BNFileDropzone
          onFilesSelected={handleFilesSelected}
          onFileRejections={handleFileRejections}
          maxFiles={5}
          maxSize={3 * 1024 * 1024} // 3MB
          acceptedFileTypes={['.docx', '.doc', '.xlsx', '.pdf']}
          multiple={true}
          linkText="Browse files"
          hasUnsupportedFiles={hasUnsupportedFiles}
        />
      </Box>

      {/* Submit Button */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid rgba(31, 30, 28, 0.12)',
        }}
      >
        <Button
          variant="contained"
          disabled={uploadFiles.length === 0}
          onClick={() => {
            // Handle file submission here
            console.log('Submitting files:', uploadFiles)
            setUploadFiles([])
            if (isMobile) {
              handleMobileUploadClose()
            } else {
              handleBackToOverview()
            }
          }}
        >
          Submit File{uploadFiles.length > 1 ? 's' : ''}
        </Button>
      </Box>
    </Stack>
  )

  const renderUploadSection = () => renderUploadContent()

  const renderOverviewSection = () => (
    <Stack sx={{ height: '100%' }}>
      {/* Header */}
      <Box
        sx={(theme) => ({
          background: theme.vars.palette.appBarPrimary.defaultFill,
          color: theme.vars.palette.appBarPrimary.defaultContrast,
        })}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            height: 60,
          }}
        >
          <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 500 }}>
            Phase {currentPhaseNumber} Overview
          </Typography>
          {currentView === 'overview' && (
            <IconButton
              size="small"
              onClick={handleMainDrawerClose}
              aria-label="Close phase drawer"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {/* Phase Navigation */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            px: 1,
            height: 40,
          }}
        >
          <IconButton
            size="small"
            disabled={currentPhaseNumber <= 1}
            onClick={() => handlePhaseNavigation('prev')}
            aria-label="Go to previous phase"
            sx={{ color: 'white', opacity: currentPhaseNumber <= 1 ? 0.5 : 1 }}
          >
            <ChevronLeftIcon />
          </IconButton>

          <Typography variant="caption" sx={{ color: 'white', fontSize: '12px' }}>
            Phase {currentPhaseNumber} of 8
          </Typography>

          <IconButton
            size="small"
            disabled={currentPhaseNumber >= 8}
            onClick={() => handlePhaseNavigation('next')}
            aria-label="Go to next phase"
            sx={{ color: 'white', opacity: currentPhaseNumber >= 8 ? 0.5 : 1 }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Phase Bar */}
      <Box
        sx={{
          background: phaseColor,
          color: phaseContrast,
          px: 2,
          py: 1,
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'left',
        }}
      >
        Phase {currentPhaseNumber}: {phaseTitle}
      </Box>
      {/* Linear Progress Loader */}
      {(phaseLoading || tasksLoading) && (
        <LinearProgress
          aria-label="Loading phase data"
          sx={{
            height: 4,
            backgroundColor: `color-mix(in srgb, ${theme.vars.palette.phase[currentPhaseNumber].main} 50%, transparent)`,
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.vars.palette.phase[currentPhaseNumber].main,
            },
          }}
        />
      )}

      {/* Content */}
      <Box
        sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}
        tabIndex={0}
        role="region"
        aria-label={`Phase ${currentPhaseNumber} content`}
      >
        {phaseError ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
            }}
          >
            <Typography variant="body2" color="error">
              Error loading phase data: {phaseError}
            </Typography>
          </Box>
        ) : phaseLoading || tasksLoading ? (
          <Box /> // Empty box while loading to hide old content
        ) : (
          <Stack spacing={1}>
            {/* Key Dates */}
            {keyDates.length > 0 && (
              <>
                <Typography variant="body2" fontWeight={500} sx={{ fontSize: '14px' }}>
                  Key Dates
                </Typography>

                {keyDates.map((keyDate: KeyDate) => (
                  <Card
                    key={keyDate.id}
                    sx={(theme) => ({
                      background: theme.vars.palette.appBarPrimary.defaultFill,
                      color: theme.vars.palette.appBarPrimary.defaultContrast,
                    })}
                  >
                    <CardContent>
                      <Typography
                        variant="caption"
                        sx={{ color: '#CCE5FF', fontSize: '14px', fontWeight: 500 }}
                      >
                        {keyDate.date}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontSize: '16px', fontWeight: 700, my: 0.5 }}
                      >
                        {keyDate.title}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontSize: '14px', fontWeight: 500 }}
                      >
                        {formatDaysUntil(calculateDaysUntil(keyDate.date))}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}

                {/* Phase-specific description after key dates */}
                {currentPhaseNumber === 6 && (
                  <Typography
                    variant="body3"
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: '14px', lineHeight: 1.6 }}
                  >
                    Once the mailing process is finalized, mailing affidavits will be
                    delivered shortly thereafter for your legal and record-keeping
                    purposes. Please note, mailing affidavits are not provided for
                    beneficial holder distributions; however, we proactively confirm that
                    these beneficial mailings have been completed by the relevant
                    intermediaries according to applicable guidelines.
                  </Typography>
                )}
              </>
            )}

            {/* Tasks */}
            {phaseTasks.map((task) => (
              <Card
                key={task.id}
                onClick={() => {
                  // If task type is approve, open ApprovalDrawer immediately
                  if (task.type === 'approve') {
                    handleTaskApprovalClick(task)
                  }
                }}
                onContextMenu={(e) => handleTaskRightClick(e, task)}
                sx={(theme) => ({
                  p: 1.5,
                  background: theme.vars.palette.tableCellRow.fill,
                  borderLeft: `5px solid ${phaseColor}`,
                  boxShadow: `inset 0px 0px 0px 1px ${theme.vars.palette.divider}`,
                  cursor: task.type === 'approve' ? 'pointer' : 'default',
                  '&:hover': {
                    boxShadow: `inset 0px 0px 0px 2px ${theme.vars.palette.action.hover}`,
                  },
                })}
              >
                <Typography
                  variant="body3"
                  fontWeight={500}
                  sx={{ lineHeight: 1.2, mb: 0.5 }}
                >
                  {task.title}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', lineHeight: 1.6, display: 'block', mb: 1 }}
                >
                  {task.description}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <StatusChip
                    status={task.status}
                    size="small"
                    sx={{
                      fontSize: '13px',
                      height: 20,
                    }}
                  />
                </Box>

                {task.links && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {task.links.map((link: TaskLink, linkIndex: number) => (
                      <Link
                        key={linkIndex}
                        component="button"
                        underline="always"
                        onClick={() =>
                          handleTaskLinkClick(
                            task.id,
                            task.title,
                            link.label,
                            link.action,
                            link.url,
                          )
                        }
                      >
                        {link.label}
                      </Link>
                    ))}
                  </Stack>
                )}
              </Card>
            ))}

            {/* URLs Section */}
            {urls.length > 0 && (
              <>
                <Divider />
                {urls.map((urlItem: PhaseUrl, index: number) => (
                  <Box key={index}>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                      {urlItem.title}
                    </Typography>
                    <Typography
                      variant="body3"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1 }}
                    >
                      {urlItem.description}
                    </Typography>
                    {urlItem.url && (
                      <Link href={urlItem.url} target="_blank" rel="noopener noreferrer">
                        {urlItem.url}
                      </Link>
                    )}
                  </Box>
                ))}
              </>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  )

  return (
    <Drawer
      anchor="left"
      elevation={0}
      open={open}
      onClose={handleMainDrawerClose}
      keepMounted={false}
      sx={{
        zIndex: 1300,
      }}
      slotProps={{
        paper: {
          sx: {
            width: 'auto',
            height: '100%',
            borderRadius: '0px 4px 4px 0px',
            boxShadow:
              '0px 8px 10px -5px rgba(0, 0, 0, 0.08), 0px 16px 24px 2px rgba(0, 0, 0, 0.05), 0px 6px 30px 5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            alignItems: 'center',
          },
        },
      }}
      ModalProps={{
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
        BackdropProps: {
          sx: {
            zIndex: -1,
            background: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {/* Overview Content */}
        <Box sx={{ width: { xs: '100%', sm: 550 }, height: '100%' }}>
          {renderOverviewSection()}
        </Box>

        {/* Upload Content - Desktop only */}
        {!isMobile && (
          <Collapse
            orientation="horizontal"
            in={currentView === 'upload'}
            mountOnEnter
            unmountOnExit
          >
            <Paper
              sx={(theme) => ({
                width: 450,
                height: '100%',
                borderLeft: `1px solid ${theme.vars.palette.divider}`,
              })}
            >
              {renderUploadSection()}
            </Paper>
          </Collapse>
        )}
      </Box>

      {/* Document Viewer Modal */}
      <DocumentViewer
        open={documentViewerOpen}
        onClose={handleDocumentViewerClose}
        pdfUrl={documentUrl}
        title={documentTitle}
        signatureAreas={signatureAreas}
      />

      {/* Approval Drawer */}
      <ApprovalDrawer
        open={approvalDrawerOpen}
        onClose={handleApprovalDrawerClose}
        title={approvalTitle}
        pdfUrl={approvalDocumentUrl}
        onApprove={handleApprove}
        onAddComment={(comment: string) => {
          console.log('Adding comment:', comment)
          // TODO: Implement comment addition logic
        }}
      />

      {/* Context Menu */}
      <TaskContextMenu
        open={contextMenu !== null}
        position={contextMenu}
        onClose={handleContextMenuClose}
        onEdit={handleTaskEdit}
        onView={handleTaskView}
      />

      {/* Task Edit Modal - Only render when needed for performance */}
      {(TaskEditDialogOpen || selectedTask) && (
        <TaskEditDialog
          open={TaskEditDialogOpen}
          onClose={handleTaskEditDialogClose}
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
          onRefresh={refreshMeetingData}
          enableLinkEditing={true}
        />
      )}

      {/* Mobile Upload Drawer */}
      {isMobile && renderMobileUploadDrawer()}
    </Drawer>
  )
}

export default PhaseDrawer
