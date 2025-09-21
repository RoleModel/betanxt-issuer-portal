/**
 * API Types - Core domain types that match the backend API schema
 * These should be the source of truth and used throughout the application
 */

import type { components } from '@/domain-models/generated-schema'

// Re-export core API types from generated schema as the source of truth
export type Meeting = components['schemas']['Meeting']
export type Document = components['schemas']['Document']
export type Proposal = components['schemas']['Proposal']
export type Phase = components['schemas']['Phase']

// Core domain types with consistent naming
export interface Task {
  id: string
  title: string
  description: string | null
  owner: string
  dueDate: string | null
  status: TaskStatus
  meetingId: string
  phaseId: string
  phaseNumber: number
  type: TaskType
  taskId: string
  documentId: string | null
  links: TaskLink[] | null
  createdAt: string | null
  updatedAt: string | null
}

export interface Position {
  id: string
  meetingId: string
  shares: number
  sharesVoted?: number
  voteStatus: string
  source: string
}

export interface KeyDate {
  id: string
  title: string
  date: string
  phaseNumber: number
}

// Task-related types
export type TaskStatus =
  | 'INCOMPLETE'
  | 'COMPLETE'
  | 'CANCELLED'
  | 'NEEDS_AUTHORIZATION'
  | 'AUTHORIZED'

export type TaskType =
  | 'upload'
  | 'signature'
  | 'external'
  | 'authorize'
  | 'approve'

export interface TaskLink {
  label: string
  url: string
  action: TaskLinkAction
}

export type TaskLinkAction =
  | 'download'
  | 'upload'
  | 'sign'
  | 'authorize'
  | 'external'

// Client and Account types
export interface Client {
  id: string
  ticker: string
  companyName: string
  shortName?: string
  brandingId?: string
}

export interface Account {
  id: string
  accountName: string
  contactName?: string
  contactEmail?: string
}

// User types
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export type UserRole = 'ADMIN' | 'USER' | 'VIEWER'

// File upload types
export interface FileUploadResponse {
  data: Document | null
  error: string | null
}

export interface FileDeleteResponse {
  success: boolean
  error: string | null
}

// Document types extending core schema
export interface DocumentSignature {
  id: string
  documentId: string
  signerName: string
  signerEmail: string
  signedAt: string
  status: 'pending' | 'signed'
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface DocumentHistoryEntry {
  id: string
  documentId: string
  action: string
  userId: string
  userName: string
  timestamp: string
  details?: Record<string, unknown>
}

export interface DocumentWithHistory extends Document {
  history: DocumentHistoryEntry[]
}
