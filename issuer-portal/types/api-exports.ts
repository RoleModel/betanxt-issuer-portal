/**
 * Export commonly used types from the generated API schema
 * This file provides convenient type aliases for the auto-generated OpenAPI types
 */
import type { components, operations } from './api'

// Export schema types
export type Account = components['schemas']['Account']
export type Client = components['schemas']['Clients']
export type Document = components['schemas']['Document']
export type DocumentHistory = components['schemas']['DocumentHistory']
// export type KeyDate = components['schemas']['KeyDate'] // Not in schema
// Define KeyDate locally since it doesn't exist in OpenAPI schema
export interface KeyDate {
  id?: string
  title?: string
  date?: string
  phaseNumber?: number
}
export type Meeting = components['schemas']['Meeting']
export type Notification = components['schemas']['Notification']
export type Phase = components['schemas']['Phase']
export type Position = components['schemas']['Position']
export type PositionVote = components['schemas']['PositionVote']
export type Proposal = components['schemas']['Proposal']
export type Signature = components['schemas']['Signature']
export type Task = components['schemas']['Task']
export type TaskStatus = components['schemas']['TaskStatus']
export type User = components['schemas']['User']
export type Comment = components['schemas']['Comment']
export type Mailing = components['schemas']['Mailing']
export type TabulationReport = components['schemas']['TabulationReport']

// Export request/response types
export type CreateAccountRequest = components['schemas']['CreateAccountRequest']
export type UpdateAccountRequest = components['schemas']['UpdateAccountRequest']
export type CreateClientRequest = components['schemas']['CreateClientRequest']
export type UpdateClientRequest = components['schemas']['UpdateClientRequest']
export type CreateCommentRequest = components['schemas']['CreateCommentRequest']
export type CreateDocumentRequest = components['schemas']['CreateDocumentRequest']
export type UpdateDocumentRequest = components['schemas']['UpdateDocumentRequest']
// export type AddDocumentEventRequest = components['schemas']['AddDocumentEventRequest'] // Not in schema
export type CreateMeetingRequest = components['schemas']['CreateMeetingRequest']
export type UpdateMeetingRequest = components['schemas']['UpdateMeetingRequest']
// export type CreateNotificationRequest = components['schemas']['CreateNotificationRequest'] // Not in schema
export type CreatePhaseRequest = components['schemas']['CreatePhaseRequest']
export type UpdatePhaseRequest = components['schemas']['UpdatePhaseRequest']
export type CreatePositionRequest = components['schemas']['CreatePositionRequest']
export type UpdatePositionRequest = components['schemas']['UpdatePositionRequest']
export type CreateProposalRequest = components['schemas']['CreateProposalRequest']
export type UpdateProposalRequest = components['schemas']['UpdateProposalRequest']
// export type CreateSignatureRequest = components['schemas']['CreateSignatureRequest'] // Not in schema
// export type UpdateSignatureRequest = components['schemas']['UpdateSignatureRequest'] // Not in schema
export type CreateTaskRequest = components['schemas']['CreateTaskRequest']
export type UpdateTaskRequest = components['schemas']['UpdateTaskRequest']
export type CreateUserRequest = components['schemas']['CreateUserRequest']
export type UpdateUserRequest = components['schemas']['UpdateUserRequest']
// export type LoginRequest = components['schemas']['LoginRequest'] // Not in schema
export type CastVoteRequest = components['schemas']['CastVoteRequest']
// export type LogoutRequest = components['schemas']['LogoutRequest'] // Not in schema
// export type CreateMailingRequest = components['schemas']['CreateMailingRequest'] // Not in schema
// export type UpdateMailingRequest = components['schemas']['UpdateMailingRequest'] // Not in schema

// Export pagination and error types
// export type PaginationResponse = components['schemas']['PaginationResponse'] // Not in schema
// export type ProblemDetails = components['schemas']['ProblemDetails'] // Not in schema

// Re-export components and operations for advanced usage
export type { components, operations }
