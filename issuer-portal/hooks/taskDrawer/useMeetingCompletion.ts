import { useCallback } from 'react'

import buildApiClient from '@/domain-models/apiClient'

import type { components } from '@/types/api'
import { calculateOverallCompletion } from '@/utils/taskControl'

type Task = components['schemas']['Task']

interface Meeting {
  id?: string
}

interface UseMeetingCompletionProps {
  currentMeeting: Meeting | null
  tasks: Task[]
  refetch: () => void
}

export const useMeetingCompletion = ({
  currentMeeting,
  tasks,
  refetch,
}: UseMeetingCompletionProps) => {
  const updateMeetingCompletion = useCallback(() => {
    if (!currentMeeting?.id) return

    // Run meeting completion update asynchronously to avoid blocking the UI
    setTimeout(() => {
      const updateCompletion = async () => {
        try {
          const client = await buildApiClient()

          // Calculate overall completion with current tasks (no need to refetch)
          const overallCompletion = calculateOverallCompletion(tasks)

          // Update meeting completion percentage if meetingId exists
          if (currentMeeting.id) {
            await client.PUT('/meetings/{meetingId}', {
              params: {
                path: { meetingId: currentMeeting.id },
              },
              body: {
                overallCompletion: overallCompletion,
              },
            })
          }

          // Refetch tasks after update to sync UI
          refetch()
        } catch (_error) {
          // Non-fatal error
        }
      }

      updateCompletion()
    }, 0)
  }, [currentMeeting, tasks, refetch])

  return { updateMeetingCompletion }
}
