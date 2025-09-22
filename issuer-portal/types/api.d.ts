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
export type Task = components['schemas']['Task']

export type Position = components['schemas']['Position']

export interface KeyDate {
  id: string
  title: string
  date: string
  phaseNumber: number
}

// Re-export task-related types from generated schema
export type TaskStatus = components['schemas']['TaskStatus']

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
