import type { components } from '@/types/api'
import { supabase } from '@/utils/supabase/client'

// Use generated types from OpenAPI schema
type Document = components['schemas']['Document']
type Comment = components['schemas']['Comment']
type CreateDocumentRequest = components['schemas']['CreateDocumentRequest']
type UpdateDocumentRequest = components['schemas']['UpdateDocumentRequest']
type CreateCommentRequest = components['schemas']['CreateCommentRequest']

// Helper type for backend responses
type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    statusCode?: number
  }
}

// Transform snake_case database fields to camelCase API fields
function transformDocument(dbDocument: any): Document {
  return {
    id: dbDocument.id,
    meetingId: dbDocument.meeting_id,
    title: dbDocument.title,
    description: dbDocument.description,
    type: dbDocument.type,
    status: dbDocument.status,
    taskId: dbDocument.task_id,
    file: dbDocument.file,
    createdAt: dbDocument.created_at,
    updatedAt: dbDocument.updated_at,
  }
}

function transformComment(dbComment: any): Comment {
  return {
    id: dbComment.id,
    documentId: dbComment.document_id,
    comment: dbComment.comment,
    userId: dbComment.user_id,
    createdAt: dbComment.created_at,
    updatedAt: dbComment.updated_at,
  }
}

export async function listDocuments(
  meetingId: string,
  opts?: {
    type?: string
    status?: string
  }
): Promise<ApiResponse<Document[]>> {
  try {
    let query = supabase.from('document').select('*').eq('meeting_id', meetingId)

    // Apply filters
    if (opts?.type) {
      query = query.eq('type', opts.type)
    }
    if (opts?.status) {
      query = query.eq('status', opts.status)
    }

    // Order by created date
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch documents' },
      }
    }

    return {
      data: data.map(transformDocument),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch documents',
      },
    }
  }
}

export async function createDocument(
  meetingId: string,
  body: CreateDocumentRequest
): Promise<ApiResponse<Document>> {
  try {
    const { data, error } = await supabase
      .from('document')
      .insert({
        meeting_id: meetingId,
        title: body.title,
        description: body.description,
        type: body.type,
        task_id: body.taskId,
        file: body.file,
        status: 'DRAFT',
      })
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to create document' },
      }
    }

    return {
      data: transformDocument(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to create document',
      },
    }
  }
}

export async function getDocumentById(id: string): Promise<ApiResponse<Document>> {
  try {
    const { data, error } = await supabase
      .from('document')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch document' },
      }
    }

    return {
      data: transformDocument(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch document',
      },
    }
  }
}

export async function updateDocument(
  id: string,
  body: UpdateDocumentRequest
): Promise<ApiResponse<Document>> {
  try {
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.file !== undefined) updateData.file = body.file

    const { data, error } = await supabase
      .from('document')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to update document' },
      }
    }

    return {
      data: transformDocument(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to update document',
      },
    }
  }
}

export async function listDocumentsByMeetingId(
  meetingId: string
): Promise<ApiResponse<Document[]>> {
  return listDocuments(meetingId)
}

export async function getDocumentComments(
  documentId: string
): Promise<ApiResponse<Comment[]>> {
  try {
    const { data, error } = await supabase
      .from('comment')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch comments' },
      }
    }

    return {
      data: data.map(transformComment),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch comments',
      },
    }
  }
}

export async function addComment(
  documentId: string,
  body: CreateCommentRequest
): Promise<ApiResponse<Comment>> {
  try {
    const { data, error } = await supabase
      .from('comment')
      .insert({
        document_id: documentId,
        comment: body.comment,
        user_id: 'current-user', // TODO: Get from session
      })
      .select()
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to add comment' },
      }
    }

    return {
      data: transformComment(data),
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to add comment',
      },
    }
  }
}

export async function downloadDocument(id: string): Promise<ApiResponse<string>> {
  try {
    const { data, error } = await supabase
      .from('document')
      .select('file')
      .eq('id', id)
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to get document file' },
      }
    }

    return {
      data: data.file || '',
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to download document',
      },
    }
  }
}
