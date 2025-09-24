/**
 * Utility functions for calculating and updating meeting overall completion
 */
import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

type DbTask = components['schemas']['Task']
type TaskStatus = 'COMPLETE' | 'INCOMPLETE' | 'CANCELLED'

// Positive/Success statuses - updated to match API schema
const POSITIVE_STATUSES: TaskStatus[] = ['COMPLETE']

/**
 * Calculate the overall completion percentage for a meeting based on task statuses
 * @param tasks - Array of tasks for the meeting
 * @returns Completion percentage (0-100)
 */
export function calculateMeetingCompletion(tasks: DbTask[]): number {
  if (tasks.length === 0) return 0

  const completedTasks = tasks.filter((task) =>
    POSITIVE_STATUSES.includes(task.status as TaskStatus)
  ).length

  return Math.round((completedTasks / tasks.length) * 100)
}

/**
 * Update the overall completion for a meeting in the database
 * @param meetingId - The meeting ID to update
 * @returns Updated meeting or error
 */
export async function updateMeetingCompletion(meetingId: string) {
  try {
    const client = await buildApiClient()

    // Fetch all tasks for the meeting
    const tasksResult = await client.GET('/meetings/{meetingId}/tasks', {
      params: {
        path: { meetingId },
      },
    })

    if (tasksResult.error) {
      throw new Error(tasksResult.error.message || 'Failed to fetch tasks')
    }

    // Calculate completion percentage
    const completion = calculateMeetingCompletion(tasksResult.data || [])

    // Update the meeting's overall completion
    const updateResult = await client.PUT('/meetings/{meetingId}', {
      params: {
        path: { meetingId },
      },
      body: {
        overallCompletion: completion,
      },
    })

    if (updateResult.error) {
      throw new Error(updateResult.error.message || 'Failed to update meeting')
    }

    return { meeting: updateResult.data, error: null }
  } catch (error) {
    console.error('Error updating meeting completion:', error)
    return { meeting: null, error }
  }
}

/**
 * Hook to automatically update meeting completion when a task status changes
 * This should be called after any task status update
 */
export async function onTaskStatusChange(taskId: string) {
  try {
    const client = await buildApiClient()

    // Get the task to find its meeting ID
    const taskResult = await client.GET('/tasks/{id}', {
      params: {
        path: { id: taskId },
      },
    })

    if (taskResult.error || !taskResult.data?.meetingId) {
      console.error('Error fetching task:', taskResult.error)
      return
    }

    // Update the meeting completion
    await updateMeetingCompletion(taskResult.data.meetingId)
  } catch (error) {
    console.error('Error in onTaskStatusChange:', error)
  }
}
