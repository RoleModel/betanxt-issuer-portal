'use client'

import { useCallback, useEffect, useState } from 'react'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'
import { syncCarryoverTaskStatus } from '@/utils/taskControl'

type Task = components['schemas']['Task']
type CreateTaskRequest = components['schemas']['CreateTaskRequest']

const fetchTasks = async (meetingId: string): Promise<Task[]> => {
  const apiClient = await buildApiClient()

  const result = await apiClient.GET('/meetings/{meetingId}/tasks', {
    params: {
      path: { meetingId },
    },
  })

  const { data, error } = result

  if (error || !data) {
    console.error('fetchTasks error details:', {
      error,
      meetingId,
    })
    throw new Error('Failed to fetch tasks')
  }

  // Return the API response directly
  const apiTasks: Task[] = Array.isArray(data) ? (data as Task[]) : []
  return apiTasks.filter((task) => task.id && task.title) // Filter out incomplete tasks
}

export interface UseTasksResult {
  tasks: Task[]
  loading: boolean
  error: string | null
  refetch: () => void
  updateTaskById: (id: string, updates: Partial<Task>, skipSync?: boolean) => Promise<void>
  createNewTask: (meetingId: string, task: Partial<Task>) => Promise<void>
}

export const useTasks = (meetingId?: string): UseTasksResult => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!meetingId) return

    setLoading(true)
    setError(null)

    try {
      const data = await fetchTasks(meetingId)
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [meetingId])

  useEffect(() => {
    fetchData()
  }, [fetchData]) // Only refetch when meetingId changes, not on every fetchData change

  const updateTaskById = useCallback(
    async (id: string, updates: Partial<Task>, skipSync = false) => {
      try {
        setError(null)
        // Convert to the correct API format
        const apiUpdates: Record<string, unknown> = {}
        if (updates.title !== undefined) apiUpdates.title = updates.title
        if (updates.description !== undefined)
          apiUpdates.description = updates.description
        if (updates.type !== undefined) apiUpdates.type = updates.type
        if (updates.status !== undefined) apiUpdates.status = updates.status
        if (updates.dueDate !== undefined) apiUpdates.dueDate = updates.dueDate
        if (updates.owner !== undefined) apiUpdates.owner = updates.owner
        if (updates.documentId !== undefined) apiUpdates.documentId = updates.documentId
        if (updates.links !== undefined) apiUpdates.links = updates.links

        const apiClient = await buildApiClient()
        const result = await apiClient.PUT('/tasks/{id}', {
          params: { path: { id } },
          body: apiUpdates,
        })

        const { data: _updateData, error: updateError } = result

        if (updateError) {
          console.error('API error updating task:', updateError)
          throw new Error(`Failed to update task: ${JSON.stringify(updateError)}`)
        }

        await fetchData()

        // Sync status across phases for carryover tasks (only if not already syncing)
        if (updates.status && !skipSync) {
          const updatedTask = tasks.find(t => t.id === id)
          if (updatedTask) {
            // Create a wrapper that sets skipSync=true to prevent infinite recursion
            const updateWithoutSync = (taskId: string, taskUpdates: { status: components['schemas']['TaskStatus'] }) =>
              updateTaskById(taskId, taskUpdates, true)

            const syncedIds = await syncCarryoverTaskStatus(
              { ...updatedTask, status: updates.status } as Task,
              tasks,
              updateWithoutSync
            )

            // Refresh data if any tasks were synced
            if (syncedIds.length > 0) {
              await fetchData()
            }
          }
        }
      } catch (err) {
        console.error('Error in updateTaskById:', err)
        setError(err instanceof Error ? err.message : 'Failed to update task')
        throw err
      }
    },
    [fetchData, tasks]
  )

  const createNewTask = useCallback(
    async (meetingIdParam: string, task: Partial<Task>) => {
      try {
        setError(null)
        // Convert to the correct API format
        const taskData: Record<string, unknown> = {}
        if (task.taskId !== undefined) taskData.taskId = task.taskId
        if (task.phaseId !== undefined) taskData.phaseId = task.phaseId
        if (task.phaseNumber !== undefined) taskData.phaseNumber = task.phaseNumber
        if (task.title !== undefined) taskData.title = task.title
        if (task.description !== undefined) taskData.description = task.description
        if (task.type !== undefined) taskData.type = task.type
        if (task.status !== undefined) taskData.status = task.status
        if (task.dueDate !== undefined) taskData.dueDate = task.dueDate
        if (task.owner !== undefined) taskData.owner = task.owner
        if (task.documentId !== undefined) taskData.documentId = task.documentId
        if (task.links !== undefined) taskData.links = task.links

        const apiClient = await buildApiClient()
        const result = await apiClient.POST('/meetings/{meetingId}/tasks', {
          params: { path: { meetingId: meetingIdParam } },
          body: taskData as CreateTaskRequest,
        })

        const { data: _createData, error: createError } = result

        if (createError) {
          throw new Error('Failed to create task')
        }

        // Refetch to get latest data
        await fetchData()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create task')
        throw err
      }
    },
    [fetchData]
  )

  return {
    tasks,
    loading,
    error,
    refetch: fetchData,
    updateTaskById,
    createNewTask,
  }
}
