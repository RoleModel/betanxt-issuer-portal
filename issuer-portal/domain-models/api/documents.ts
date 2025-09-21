import buildApiClient from '@/domain-models/apiClient'
import type { paths } from '@/domain-models/generated-schema'

export async function createDocument(
  meetingId: string,
  document: paths['/meetings/{meetingId}/documents']['post']['requestBody']['content']['multipart/form-data']
) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/meetings/{meetingId}/documents', {
    params: {
      path: { meetingId },
    },
    body: document,
  })
}

export async function getDocumentById(id: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/documents/{id}', {
    params: {
      path: { id },
    },
  })
}

export async function updateDocument(
  id: string,
  updates: paths['/documents/{id}']['put']['requestBody']['content']['application/json']
) {
  const apiClient = await buildApiClient()

  return await apiClient.PUT('/documents/{id}', {
    params: {
      path: { id },
    },
    body: updates,
  })
}

export async function downloadDocument(id: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/documents/{id}/download', {
    params: {
      path: { id },
    },
  })
}

export async function getDocumentComments(documentId: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/documents/{id}/comments', {
    params: {
      path: { id: documentId },
    },
  })
}

export async function listDocumentsByMeetingId(meetingId: string) {
  const apiClient = await buildApiClient()

  return await apiClient.GET('/meetings/{meetingId}/documents', {
    params: {
      path: { meetingId },
    },
  })
}

export async function addComment(
  documentId: string,
  comment: {
    comment: string
  }
) {
  const apiClient = await buildApiClient()

  return await apiClient.POST('/documents/{id}/comments', {
    params: {
      path: { id: documentId },
    },
    body: comment,
  })
}
