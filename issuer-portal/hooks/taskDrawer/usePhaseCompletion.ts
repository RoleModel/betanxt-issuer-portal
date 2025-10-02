import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

import buildApiClient from '@/domain-models/apiClient'

import type { components } from '@/types/api'
import {
  COMPLETED_STATUSES,
  calculateOverallCompletion,
} from '@/utils/taskDrawer/taskStatus'

interface SnackbarHandler {
  showSuccess: (message: string) => void
}

type Task = components['schemas']['Task']

interface Meeting {
  id?: string
  title?: string
}

interface Session {
  user?: {
    name?: string | null
  }
}

interface UsePhaseCompletionProps {
  currentMeeting: Meeting | null
  session: Session | null
  refreshContext:
    | (() => Promise<{ tasks: Task[]; positions: unknown[] } | null>)
    | undefined
  snackbar: SnackbarHandler
}

export const usePhaseCompletion = ({
  currentMeeting,
  session,
  refreshContext,
  snackbar,
}: UsePhaseCompletionProps) => {
  const router = useRouter()

  const checkAndCompletePhase = useCallback(
    async (taskWithPhase: Task | null): Promise<boolean> => {
      if (!taskWithPhase?.phaseNumber || taskWithPhase.phaseNumber <= 0) {
        return false
      }

      if (!refreshContext) {
        return false
      }

      const currentPhaseNumber = taskWithPhase.phaseNumber

      // Delay to ensure database is fully updated
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Refresh tasks from context to get latest status
      const refreshedData = await refreshContext()
      const freshTasks = refreshedData?.tasks || []

      // Get all tasks for the current phase (excluding BetaNXT and DFIN owned tasks)
      const currentPhaseTasks = freshTasks.filter(
        (t: Task) =>
          t.phaseNumber === currentPhaseNumber &&
          !['BetaNXT', 'DFIN'].includes(t.owner || '')
      )

      // Check if all phase tasks have been initiated
      const allPhaseTasksInitiated =
        currentPhaseTasks.length > 0 &&
        currentPhaseTasks.every((t: Task) =>
          COMPLETED_STATUSES.includes(t.status as never)
        )

      if (allPhaseTasksInitiated) {
        // Update meeting to next phase and calculate completion percentage
        if (currentMeeting?.id) {
          try {
            const client = await buildApiClient()

            // Calculate overall completion
            const overallCompletion = calculateOverallCompletion(freshTasks)

            const nextPhaseNumber = currentPhaseNumber + 1

            const updatePayload = {
              currentPhase: `Phase ${nextPhaseNumber}`,
              overallCompletion: overallCompletion,
            }

            // Update meeting phase and completion
            await client.PUT('/meetings/{meetingId}', {
              params: {
                path: { meetingId: currentMeeting.id },
              },
              body: updatePayload,
            })

            // Refresh meeting data to update the context with new phase
            await refreshContext()
          } catch (_error) {
            // Error handled silently during phase advancement
          }
        }

        // Get user name and meeting title for personalized message
        const userName = session?.user?.name || 'User'
        const meetingTitle = currentMeeting?.title || 'Shareholder Meeting'
        const nextPhaseNumber = currentPhaseNumber + 1

        // Show personalized snackbar
        snackbar.showSuccess(
          `Congratulations, ${userName}! 🎉 All tasks for Phase ${currentPhaseNumber} of "${meetingTitle}" are complete! You're now advancing to Phase ${nextPhaseNumber}.`
        )

        // Navigate to next phase dashboard after 3 seconds
        setTimeout(() => {
          const pathParts = window.location.pathname.split('/')
          const clientTicker = pathParts[1]
          const meetingId = pathParts[3]
          router.push(
            `/${clientTicker}/meeting/${meetingId}/dashboard/${nextPhaseNumber}`
          )
        }, 3000)

        return true
      }

      return false
    },
    [currentMeeting, session, refreshContext, snackbar, router]
  )

  return { checkAndCompletePhase }
}
