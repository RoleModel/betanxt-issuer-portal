import React from 'react'

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { Box } from '@mui/material'

import NoWrapTableCell from './NoWrapTableCell'

export interface SortableHeaderCellProps<T> {
  column: keyof T
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
  sortColumn: keyof T | null
  sortDirection: 'asc' | 'desc'
  onSort: (column: keyof T) => void
}

const SortableHeaderCell = <T,>({
  column,
  children,
  align,
  sortColumn,
  sortDirection,
  onSort,
}: SortableHeaderCellProps<T>) => (
  <NoWrapTableCell
    align={align}
    sx={{
      cursor: 'pointer',
      userSelect: 'none',
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
      },
    }}
    onClick={() => onSort(column)}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        justifyContent:
          align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {children}
      {sortColumn === column &&
        (sortDirection === 'asc' ? (
          <ArrowUpwardIcon fontSize="small" />
        ) : (
          <ArrowDownwardIcon fontSize="small" />
        ))}
    </Box>
  </NoWrapTableCell>
)

// Utility function for sorting arrays
export function createSortFunction<T>(
  sortColumn: keyof T | null,
  sortDirection: 'asc' | 'desc'
) {
  return (data: T[]): T[] => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle string values
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }
}

// Hook for managing sort state
export function useSortableTable<T>() {
  const [sortColumn, setSortColumn] = React.useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

  const handleSort = React.useCallback(
    (column: keyof T) => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      } else {
        setSortColumn(column)
        setSortDirection('asc')
      }
    },
    [sortColumn, sortDirection]
  )

  const sortData = React.useCallback(
    (data: T[]) => createSortFunction(sortColumn, sortDirection)(data),
    [sortColumn, sortDirection]
  )

  return {
    sortColumn,
    sortDirection,
    handleSort,
    sortData,
  }
}

export default SortableHeaderCell
