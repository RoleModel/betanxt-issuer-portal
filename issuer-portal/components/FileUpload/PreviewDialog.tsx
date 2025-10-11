'use client'

import React from 'react'

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

interface PreviewDialogProps<T> {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  data: T[] | null
  title: string
  columns: {
    key: keyof T
    label: string
    render?: (value: unknown, row: T) => React.ReactNode
  }[]
}

export default function PreviewDialog<T>({
  open,
  onClose,
  onConfirm,
  data,
  title,
  columns,
}: PreviewDialogProps<T>) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {title} - {data?.length ?? 0} Records
      </DialogTitle>
      <DialogContent>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={String(column.key)} sx={{ fontWeight: 600 }}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained">
          Confirm Upload
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Helper function for creating chip renderers
export const createChipRenderer = (
  getColor: (
    value: string
  ) => 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'default'
) => {
  const ChipRenderer = (value: unknown) => (
    <Chip
      label={String(value)}
      color={getColor(String(value))}
      variant="outlined"
      size="small"
    />
  )
  ChipRenderer.displayName = 'ChipRenderer'
  return ChipRenderer
}

// Helper function for creating formatted number renderer
export const createNumberRenderer = (formatter?: (num: number) => string) => {
  const NumberRenderer = (value: unknown) => {
    const num = Number(value)
    if (isNaN(num) || num === 0) return '-'
    return (
      <Typography variant="body2">
        {formatter ? formatter(num) : num.toLocaleString()}
      </Typography>
    )
  }
  NumberRenderer.displayName = 'NumberRenderer'
  return NumberRenderer
}

// Helper function for creating text renderer
export const createTextRenderer = (color?: 'text.secondary' | 'text.primary') => {
  const TextRenderer = (value: unknown) => {
    let displayValue: string
    if (value == null) {
      displayValue = '-'
    } else if (typeof value === 'object') {
      displayValue = JSON.stringify(value)
    } else {
      displayValue = String(value as string | number | boolean)
    }
    return (
      <Typography variant="body2" color={color}>
        {displayValue}
      </Typography>
    )
  }
  TextRenderer.displayName = 'TextRenderer'
  return TextRenderer
}
