import buildApiClient, { ApiClientReturnType } from '@/domain-models/apiClient'

export async function createTask(
  meetingId: string,
  task: {
    taskId: string
    phaseId: string
    phaseNumber: number
    title: string
    type: string
    status: 'COMPLETE' | 'INCOMPLETE' | 'CANCELLED'
    dueDate?: string
    owner: string
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/meetings/{meetingId}/tasks', {
    params: {
      path: { meetingId },
    },
    body: task,
  })
}

export async function getTaskById(id: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/tasks/{id}', {
    params: {
      path: { id },
    },
  })
}

export async function updateTask(
  id: string,
  updates: {
    title?: string
    type?: string
    status?: 'COMPLETE' | 'INCOMPLETE' | 'CANCELLED'
    dueDate?: string
    owner?: string
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.PUT('/tasks/{id}', {
    params: {
      path: { id },
    },
    body: updates,
  })
}
