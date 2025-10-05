'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  IconButton,
} from '@mui/material'
import {
  CheckCircle,
  Schedule,
  ArrowForward,
  Close,
  Refresh,
} from '@mui/icons-material'

import { usePhaseContext } from '@/contexts/PhaseContext'
import { usePhaseTransition } from '@/hooks/usePhaseTransition'
import type { components } from '@/domain-models/generated-schema'

type Task = components['schemas']['Task']
type Phase = components['schemas']['Phase']

interface PhaseManagerProps {
  meetingId: string
  currentPhase?: Phase
  tasks?: Task[]
  onPhaseChange?: (newPhase: Phase) => void
}

export function PhaseManager({
  meetingId,
  currentPhase,
  tasks = [],
  onPhaseChange
}: PhaseManagerProps) {
  const router = useRouter()
  const [showAdvanceNotification, setShowAdvanceNotification] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionError, setTransitionError] = useState<string | null>(null)
  const [lastCheckedPhase, setLastCheckedPhase] = useState<string | null>(null)

  const { validatePhaseTransition, transitionPhase, isValidating, error } = usePhaseTransition(meetingId)

  // Check if all tasks in current phase are complete
  const checkPhaseCompletion = useCallback(() => {
    if (!currentPhase || tasks.length === 0) return false

    const phaseTasks = tasks.filter(task => task.phaseId === currentPhase.id)
    if (phaseTasks.length === 0) return false

    return phaseTasks.every(task => task.status === 'COMPLETE')
  }, [currentPhase, tasks])

  const isPhaseComplete = checkPhaseCompletion()

  // Auto-advance logic
  useEffect(() => {
    if (!currentPhase || !isPhaseComplete || isTransitioning) return

    // Prevent duplicate checks for the same phase
    if (lastCheckedPhase === currentPhase.id) return

    const attemptAutoAdvance = async () => {
      try {
        setLastCheckedPhase(currentPhase.id || null)

        // Validate transition is possible
        if (!currentPhase.id) throw new Error('Current phase ID is missing')
        const validation = await validatePhaseTransition(currentPhase.id)
        if (!validation.canTransition) {
          console.log('Phase transition not possible:', validation.reason)
          return
        }

        // Show notification before advancing
        setShowAdvanceNotification(true)

        // Wait a moment for user to see the notification
        setTimeout(async () => {
          setIsTransitioning(true)

          // Find next phase
          const nextPhaseOrder = (currentPhase.orderIndex || 0) + 1

          try {
            // Fetch phases to find the next one
            const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'
            const phasesResponse = await fetch(`${API_URL}/meetings/${meetingId}/phases`)
            if (!phasesResponse.ok) throw new Error('Failed to fetch phases')

            const phases: Phase[] = await phasesResponse.json()
            const nextPhase = phases.find(p => p.orderIndex === nextPhaseOrder)

            if (!nextPhase) {
              throw new Error('No next phase found')
            }

            // Perform the transition
            if (!nextPhase.id) throw new Error('Next phase ID is missing')
            if (!currentPhase.id) throw new Error('Current phase ID is missing')
            const success = await transitionPhase(currentPhase.id, nextPhase.id)

            if (success) {
              // Navigate to new phase
              const currentUrl = window.location.pathname
              const newUrl = currentUrl.replace(
                /\/dashboard\/\d+/,
                `/dashboard/${nextPhaseOrder}`
              )

              // Call callback if provided
              onPhaseChange?.(nextPhase)

              // Navigate to new phase
              router.push(newUrl)

              setShowAdvanceNotification(false)
            } else {
              throw new Error('Phase transition failed')
            }
          } catch (err) {
            setTransitionError(err instanceof Error ? err.message : 'Failed to advance phase')
            setShowAdvanceNotification(false)
          } finally {
            setIsTransitioning(false)
          }
        }, 2000) // 2 second delay to show notification

      } catch (err) {
        setTransitionError(err instanceof Error ? err.message : 'Failed to validate phase transition')
        setLastCheckedPhase(null) // Allow retry
      }
    }

    // Debounce the auto-advance check
    const timer = setTimeout(attemptAutoAdvance, 1000)
    return () => clearTimeout(timer)
  }, [
    currentPhase,
    isPhaseComplete,
    isTransitioning,
    lastCheckedPhase,
    meetingId,
    validatePhaseTransition,
    transitionPhase,
    onPhaseChange,
    router
  ])

  // Reset error after some time
  useEffect(() => {
    if (transitionError || error) {
      const timer = setTimeout(() => {
        setTransitionError(null)
      }, 10000) // Clear error after 10 seconds
      return () => clearTimeout(timer)
    }
  }, [transitionError, error])

  const getPhaseCompletionStatus = () => {
    if (!currentPhase || tasks.length === 0) {
      return { completed: 0, total: 0, percentage: 0 }
    }

    const phaseTasks = tasks.filter(task => task.phaseId === currentPhase.id)
    const completedTasks = phaseTasks.filter(task => task.status === 'COMPLETE')

    return {
      completed: completedTasks.length,
      total: phaseTasks.length,
      percentage: phaseTasks.length > 0 ? (completedTasks.length / phaseTasks.length) * 100 : 0
    }
  }

  const status = getPhaseCompletionStatus()
  const displayError = transitionError || error

  return (
    <Box>
      {/* Phase Status Indicator */}
      {currentPhase && (
        <Card sx={{ mb: 2, bgcolor: isPhaseComplete ? 'success.50' : 'background.paper' }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {isPhaseComplete ? (
                  <CheckCircle color="success" />
                ) : (
                  <Schedule color="action" />
                )}
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Phase {currentPhase.orderIndex}: {currentPhase.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {status.completed} of {status.total} tasks completed
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {isValidating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress sx={{ width: 60 }} />
                    <Typography variant="caption" color="text.secondary">
                      Validating...
                    </Typography>
                  </Box>
                )}

                {isPhaseComplete && !isTransitioning && (
                  <Chip
                    icon={<CheckCircle />}
                    label="Ready to Advance"
                    color="success"
                    variant="outlined"
                  />
                )}

                {isTransitioning && (
                  <Chip
                    icon={<ArrowForward />}
                    label="Advancing..."
                    color="primary"
                  />
                )}

                <LinearProgress
                  variant="determinate"
                  value={status.percentage}
                  sx={{ width: 100, height: 6, borderRadius: 1 }}
                  color={isPhaseComplete ? 'success' : 'primary'}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Auto-Advance Notification */}
      <Snackbar
        open={showAdvanceNotification}
        autoHideDuration={null}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setShowAdvanceNotification(false)}
            >
              <Close fontSize="small" />
            </IconButton>
          }
          sx={{ minWidth: 400 }}
        >
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              🎉 Phase {currentPhase?.orderIndex} Complete!
            </Typography>
            <Typography variant="body2">
              All tasks completed. Automatically advancing to Phase {(currentPhase?.orderIndex || 0) + 1}...
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* Error Notification */}
      <Snackbar
        open={!!displayError}
        autoHideDuration={8000}
        onClose={() => setTransitionError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          action={
            <IconButton
              size="small"
              aria-label="retry"
              color="inherit"
              onClick={() => {
                setTransitionError(null)
                setLastCheckedPhase(null) // Allow retry
              }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          }
        >
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Phase Transition Error
            </Typography>
            <Typography variant="body2">
              {displayError}
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  )
}
