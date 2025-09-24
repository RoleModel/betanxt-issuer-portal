'use client'

import React from 'react'

import { Chip, SxProps, Theme } from '@mui/material'

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

// Display text mapping with dynamic review count support
const getStatusDisplayText = (
  status: UnifiedStatus | string | null,
  reviewCount?: number,
  totalReviews?: number
): string => {
  switch (status) {
    case 'active':
      return 'Approved'
    case 'pending':
      // Use dynamic review count if provided, otherwise default to 1/3
      if (reviewCount !== undefined && totalReviews !== undefined) {
        return `${reviewCount}/${totalReviews} Reviews Complete`
      }
      return '1/3 Reviews Complete'
    case 'inactive':
    case null:
    case undefined:
      return 'Not Uploaded'
    case 'Incomplete':
    case 'INCOMPLETE':
      return 'Incomplete'
    case 'NEEDS_AUTHORIZATION':
      return 'Needs Authorization'
    case 'COMPLETE':
      return 'Complete'
    case 'Unvoted':
      return 'Unvoted'
    case 'Voted':
      return 'Voted'
    // Task statuses - use as-is
    case 'Complete':
    case 'Pending Approval':
    case 'Pending':
    case 'Approved':
    case 'Not Started':
      return status
    // Fallback for any other status
    default:
      return typeof status === 'string' ? status : 'Unknown'
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
    'Approved to Send',
    'Approved',
    'Submitted',
    'Received',
    'Reached',
  ]

  // Yellow/Orange - Warning/Pending statuses
  const warningStatuses = [
    'Pending Approval',
    'Pending',
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

declare module '@mui/material/Chip' {
  interface ChipOwnProps {
    status?: string | null
  }
}

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
      status={status}
      className={`status-chip-${status}`}
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
