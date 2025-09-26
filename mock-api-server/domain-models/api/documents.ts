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
    filePath: dbDocument.file_path,
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
  body: unknown
): Promise<ApiResponse<Document>> {
  try {
    const request = body as CreateDocumentRequest
    const { data, error } = await supabase
      .from('document')
      .insert({
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        meeting_id: meetingId,
        title: request.title,
        description: request.description,
        type: request.type,
        task_id: request.taskId,
        file_path: request.file,
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
  body: unknown
): Promise<ApiResponse<Document>> {
  try {
    const request = body as UpdateDocumentRequest
    const updateData: any = {}
    if (request.title !== undefined) updateData.title = request.title
    if (request.description !== undefined) updateData.description = request.description
    if (request.status !== undefined) updateData.status = request.status

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
): Promise<ApiResponse<any[]>> {
  try {
    const { data, error } = await supabase
      .from('comment')
      .select(
        `
        *,
        users:user_id (
          first_name,
          last_name,
          avatar
        )
      `
      )
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })

    if (error) {
      return {
        error: { message: error.message || 'Failed to fetch comments' },
      }
    }

    // Transform to match DocumentViewer's CommentWithUser interface
    const transformedComments = (data || []).map((dbComment: any) => ({
      id: dbComment.id?.toString() || '',
      comment: dbComment.comment || '',
      user: dbComment.user_id || 'Unknown User',
      first_name: dbComment.users?.first_name || 'Unknown',
      last_name: dbComment.users?.last_name || 'User',
      created_at: dbComment.created_at || new Date().toISOString(),
      users: {
        avatar: dbComment.users?.avatar || null,
      },
    }))

    return {
      data: transformedComments,
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
  body: CreateCommentRequest,
  userId?: string
): Promise<ApiResponse<Comment>> {
  try {
    const { data, error } = await supabase
      .from('comment')
      .insert({
        document_id: documentId,
        comment: body.comment,
        user_id: userId || 'ce4b0ac1-095c-5e6f-a301-e489723079a3', // Default to Dev User
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
      .select('file_path')
      .eq('id', id)
      .single()

    if (error) {
      return {
        error: { message: error.message || 'Failed to get document file' },
      }
    }

    return {
      data: data.file_path || '',
    }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to download document',
      },
    }
  }
}
