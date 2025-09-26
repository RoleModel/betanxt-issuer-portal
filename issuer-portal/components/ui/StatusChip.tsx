'use client'

import React from 'react'

import { Chip, SxProps, Theme } from '@mui/material'

import {
  DOCUMENT_STATUS_VALUES,
  type DocumentStatus,
  getDocumentStatusLabel,
} from '@/utils/documentUtils'

// Unified status types - combining document and task statuses
export type UnifiedStatus =
  // Document statuses
  | 'active' // Database status -> "Approved"
  | 'pending' // Database status -> "1/3 Reviews Complete"
  | 'inactive' // Database status -> "Not Uploaded"
  // Task statuses (from global TaskStatus)
  | 'Complete'
  | 'Pending Approval'
  | 'Pending'
  | 'Approved'
  | 'Not Started'
  | 'Incomplete'

// Display text mapping with dynamic review count support and friendly casing for document statuses
const getStatusDisplayText = (
  status: UnifiedStatus | string | null,
  reviewCount?: number,
  totalReviews?: number
): string => {
  if (status == null) return 'Not Uploaded'

  // Support placeholder UI status
  if (status === 'NOT_UPLOADED' || status === 'inactive') return 'Not Uploaded'

  // If this is a known document status (uppercase API enum) use helper for friendly label
  if (
    typeof status === 'string' &&
    (DOCUMENT_STATUS_VALUES as readonly string[]).includes(status)
  ) {
    return getDocumentStatusLabel(status as DocumentStatus)
  }

  switch (status) {
    case 'active':
      return 'Approved'
    case 'pending':
      if (reviewCount !== undefined && totalReviews !== undefined) {
        return `${reviewCount}/${totalReviews} Reviews Complete`
      }
      return '1/3 Reviews Complete'
    case 'Incomplete':
    case 'INCOMPLETE':
      return 'Incomplete'
    case 'NEEDS_AUTHORIZATION':
      return 'Needs Authorization'
    case 'AUTHORIZED':
      return 'Authorized'
    case 'PENDING_AUTHORIZATION':
      return 'Pending Authorization'
    case 'WAITING_FOR_FORM_RETURN':
      return 'Waiting for Form Return'
    case 'AUTHORIZATION_NEEDED':
      return 'Authorization Needed'
    case 'SUBMITTED_AWAITING_RECORD_DATE':
      return 'Submitted Awaiting Record Date'
    case 'REQUEST_FORM_TO_FOLLOW':
      return 'Request Form to Follow'
    case 'COMPLETE':
      return 'Complete'
    case 'Unvoted':
      return 'Unvoted'
    case 'Voted':
      return 'Voted'
    case 'Complete':
    case 'Pending Approval':
    case 'Pending':
    case 'Approved':
    case 'Not Started':
      return status
    default:
      return typeof status === 'string'
        ? status
            .split('_')
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
            .join(' ')
        : 'Unknown'
  }
}

// Status color mapping (using theme logic from theme/index.ts)
const getStatusStyles = (status: UnifiedStatus | string | null): SxProps<Theme> => {
  const displayText = getStatusDisplayText(status)

  // Green - Positive/Success statuses
  const successStatuses = [
    'COMPLETED',
    'complete',
    'completed',
    'Completed',
    'COMPLETE',
    'Complete',
    'Voted',
    'Shares Balanced',
    'Mailing Complete',
    'Ordered',
    'Authorized',
    'AUTHORIZED',
    'Approved to Send',
    'Approved',
    'Submitted',
    'Submitted Awaiting Record Date',
    'SUBMITTED_AWAITING_RECORD_DATE',
    'Received',
    'Reached',
  ]

  // Yellow/Orange - Warning/Pending statuses
  const warningStatuses = [
    'Pending Approval',
    'Pending',
    'Pending Authorization',
    'PENDING_AUTHORIZATION',
    'Waiting for Form Return',
    'WAITING_FOR_FORM_RETURN',
    'Delayed',
    '1/3 Reviews Complete',
    'Awaiting Review',
    'Pending Client Review',
    'Making Revisions',
    '3 of 5 Materials Uploaded',
  ]

  // Red - Error/Action needed statuses
  const errorStatuses = [
    'Shares Imbalanced',
    'Access Needed',
    'Needs Authorization',
    'NEEDS_AUTHORIZATION',
    'Authorization Needed',
    'AUTHORIZATION_NEEDED',
  ]

  // Grey/Neutral - Default/Incomplete statuses
  const neutralStatuses = ['Incomplete', 'INCOMPLETE', 'Unvoted', 'Not Started']

  // Blue - Info/In Progress statuses
  const infoStatuses = [
    'ACTIVE',
    'Active',
    'New',
    'Mailing',
    'In Edit Process',
    'Request form to follow',
    'Request Form to Follow',
    'REQUEST_FORM_TO_FOLLOW',
    'In Progress',
  ]

  // Make comparison case-insensitive
  const lowerDisplayText = displayText.toLowerCase()

  if (successStatuses.some((status) => status.toLowerCase() === lowerDisplayText)) {
    return {
      backgroundColor: (theme) => theme.vars.palette.success.main,
      color: (theme) => theme.vars.palette.success.contrastText,
    }
  }

  if (warningStatuses.some((status) => status.toLowerCase() === lowerDisplayText)) {
    return {
      backgroundColor: '#EBB322',
      color: (theme) => theme.vars.palette.common.black,
    }
  }

  if (errorStatuses.some((status) => status.toLowerCase() === lowerDisplayText)) {
    return {
      backgroundColor: (theme) => theme.vars.palette.error.dark,
      color: (theme) => theme.vars.palette.error.contrastText,
    }
  }

  if (infoStatuses.some((status) => status.toLowerCase() === lowerDisplayText)) {
    return {
      backgroundColor: (theme) => theme.vars.palette.info.main,
      color: (theme) => theme.vars.palette.info.contrastText,
    }
  }

  if (neutralStatuses.some((status) => status.toLowerCase() === lowerDisplayText)) {
    return {
      backgroundColor: (theme) => theme.vars.palette.action.selected,
      color: (theme) => theme.vars.palette.text.secondary,
    }
  }

  // Default - Neutral/Grey statuses
  return {
    backgroundColor: (theme) => theme.vars.palette.action.selected,
    color: (theme) => theme.vars.palette.text.secondary,
  }
}

export interface StatusChipProps {
  status: UnifiedStatus | string | null
  size?: 'small' | 'medium'
  sx?: SxProps<Theme>
  reviewCount?: number
  totalReviews?: number
  variant?: 'outlined' | 'filled'
}

// We avoid module augmentation for Chip props; use data-status attribute instead

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = 'small',
  sx = {},
  reviewCount,
  totalReviews,
  variant = 'filled',
}) => {
  const displayText = getStatusDisplayText(status, reviewCount, totalReviews)
  const statusStyles = getStatusStyles(status)

  return (
    <Chip
      data-status={status || undefined}
      className={`status-chip-${status || 'unknown'}`}
      variant={variant}
      label={displayText}
      size={size}
      sx={[
        statusStyles,
        {
          textTransform: 'capitalize',
          fontWeight: 500,
          fontSize: size === 'small' ? '0.75rem' : '0.875rem',
          height: size === 'small' ? 20 : 24,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  )
}

export default StatusChip

// Helper functions for external use
export { getStatusDisplayText, getStatusStyles }
