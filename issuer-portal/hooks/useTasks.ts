'use client'

import { useCallback, useEffect, useState } from 'react'

import { createTask, getTaskById, updateTask } from '@/domain-models/api/tasks'
import buildApiClient from '@/domain-models/apiClient'
import type { Task, TaskLinkAction } from '@/types/api'

const fetchTasks = async (meetingId: string): Promise<Task[]> => {
  const apiClient = await buildApiClient()

  const result = await apiClient.GET('/meetings/{meetingId}/tasks', {
    params: {
      path: { meetingId },
    },
  })

  if (result.error) {
    throw new Error('Failed to fetch tasks')
  }

  // Transform the API response to match our Task interface
  const apiTasks = Array.isArray(result.data) ? result.data : []
  return apiTasks
    .filter((task) => task.id && task.title) // Filter out incomplete tasks
    .map((task) => ({
      id: task.id!,
      title: task.title!,
      description: task.description || null,
      owner: task.owner || 'BetaNXT',
      dueDate: task.dueDate || null,
      status: task.status || 'INCOMPLETE',
      meetingId: task.meetingId || '',
      phaseId: task.phaseId || '',
      phaseNumber: task.phaseNumber || 0,
      type: (task.type || 'external') as Task['type'],
      taskId: task.taskId || task.id!,
      documentId: task.documentId || null,
      links: Array.isArray(task.links)
        ? task.links.map(
            (link: { label?: unknown; url?: unknown; action?: unknown }) => {
              const actionStr = String(link.action ?? 'external')
              const validActions = ['download', 'upload', 'sign', 'authorize', 'external']
              return {
                label: String(link.label ?? ''),
                url: String(link.url ?? ''),
                action: (validActions.includes(actionStr) ? actionStr : 'external') as TaskLinkAction,
              }
            }
          )
        : null,
      createdAt: task.createdAt || null,
      updatedAt: task.updatedAt || null,
    }))
}

export interface UseTasksResult {
  tasks: Task[]
  loading: boolean
  error: string | null
  refetch: () => void
  updateTaskById: (id: string, updates: Partial<Task>) => Promise<void>
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
  }, [meetingId]) // Only refetch when meetingId changes, not on every fetchData change

  const updateTaskById = useCallback(
    async (id: string, updates: Partial<Task>) => {
      try {
        setError(null)
        // Convert our Task interface fields to API format
        const apiUpdates: any = {}
        if (updates.title !== undefined) apiUpdates.title = updates.title
        if (updates.status !== undefined) apiUpdates.status = updates.status
        if (updates.type !== undefined) apiUpdates.type = updates.type
        if (updates.dueDate !== undefined) apiUpdates.dueDate = updates.dueDate
        if (updates.owner !== undefined) apiUpdates.owner = updates.owner

        const result = await updateTask(id, apiUpdates)
        if (result.error) {
          throw new Error('Failed to update task')
        }

        // Refetch to get latest data
        await fetchData()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update task')
        throw err
      }
    },
    [fetchData]
  )

  const createNewTask = useCallback(
    async (meetingIdParam: string, task: Partial<Task>) => {
      try {
        setError(null)
        const taskData = {
          taskId: task.taskId || '',
          phaseId: task.phaseId || '',
          phaseNumber: task.phaseNumber || 1,
          title: task.title || '',
          type: (task.type || 'external') as Task['type'],
          status:
            (task.status as 'COMPLETE' | 'INCOMPLETE' | 'CANCELLED') || 'INCOMPLETE',
          dueDate: task.dueDate || undefined,
          owner: task.owner || 'BetaNXT',
        }

        const result = await createTask(meetingIdParam, taskData)
        if (result.error) {
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
