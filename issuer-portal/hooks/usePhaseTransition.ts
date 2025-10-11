import { useState, useCallback } from 'react'

import type { components } from '@/domain-models/generated-schema'

type Phase = components['schemas']['Phase']
type Task = components['schemas']['Task']

interface PhaseTransitionResult {
  canTransition: boolean
  incompleteTasks: Task[]
  reason: string | null
}

export function usePhaseTransition(meetingId: string) {
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validatePhaseTransition = useCallback(
    async (currentPhaseId: string): Promise<PhaseTransitionResult> => {
      setIsValidating(true)
      setError(null)

      try {
        // Fetch all tasks for the current phase
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api'
        const response = await fetch(`${API_URL}/meetings/${meetingId}/tasks?phaseId=${currentPhaseId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch phase tasks')
        }

        const tasks: Task[] = await response.json()

        // Find incomplete tasks
        const incompleteTasks = tasks.filter(
          (task) => task.status !== 'COMPLETE' && task.status !== 'CANCELLED'
        )

        const canTransition = incompleteTasks.length === 0

        return {
          canTransition,
          incompleteTasks,
          reason: canTransition ? null : `${incompleteTasks.length} task(s) must be completed`,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Validation failed'
        setError(errorMessage)
        return {
          canTransition: false,
          incompleteTasks: [],
          reason: errorMessage,
        }
      } finally {
        setIsValidating(false)
      }
    },
    [meetingId]
  )

  const transitionPhase = useCallback(
    async (currentPhaseId: string, nextPhaseId: string): Promise<boolean> => {
      setIsValidating(true)
      setError(null)

      try {
        // First validate transition is allowed
        const validation = await validatePhaseTransition(currentPhaseId)

        if (!validation.canTransition) {
          setError(validation.reason)
          return false
        }

        // Mark current phase as complete
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api'
        const completeResponse = await fetch(`${API_URL}/phases/${currentPhaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETE' }),
        })

        if (!completeResponse.ok) {
          throw new Error('Failed to complete current phase')
        }

        // Start next phase
        const startResponse = await fetch(`${API_URL}/phases/${nextPhaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'IN_PROGRESS' }),
        })

        if (!startResponse.ok) {
          throw new Error('Failed to start next phase')
        }

        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Phase transition failed'
        setError(errorMessage)
        return false
      } finally {
        setIsValidating(false)
      }
    },
    [validatePhaseTransition]
  )

  return {
    validatePhaseTransition,
    transitionPhase,
    isValidating,
    error,
  }
}
