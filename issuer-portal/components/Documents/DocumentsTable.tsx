'use client'

import React from 'react'

import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'

import DocumentThumbnail from '@/components/Documents/DocumentThumbnail'
import EmptyState from '@/components/EmptyState'
import StatusChip from '@/components/ui/StatusChip'

import { components } from '@/domain-models/generated-schema'

import { formatDate } from '@/lib/formats'
import { getDocumentActionLabel } from '@/utils/documentUtils'
import type { ExtendedDocumentStatus } from '@/utils/documentUtils'

type Document = components['schemas']['Document']

type DocumentsTableProps = {
  documents: Document[]
  page: number
  rowsPerPage: number
  emptyRows: number
  onPageChange: (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => void
  onRowsPerPageChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  onOpenDocument?: (doc: Document) => void
}

export default function DocumentsTable(props: DocumentsTableProps) {
  const {
    documents,
    page,
    rowsPerPage,
    emptyRows,
    onPageChange,
    onRowsPerPageChange,
    onOpenDocument,
  } = props

  if (documents.length === 0) {
    return (
      <EmptyState
        title="No Documents"
        description="Upload documents to get started with your meeting materials."
        minHeight={300}
      />
    )
  }

  return (
    <TableContainer data-testid="documents-table">
      <Table sx={{ minWidth: 500 }} aria-label="Event Documents">
        <TableHead>
          <TableRow>
            <TableCell>Document</TableCell>
            <TableCell>Added/Updated</TableCell>
            <TableCell sx={{ width: '200px' }}>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(rowsPerPage > 0
            ? documents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            : documents
          ).map((doc) => (
            <TableRow key={doc.id}>
              <TableCell size="small">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DocumentThumbnail
                    filePath={doc.filePath}
                    onClick={doc.filePath ? () => onOpenDocument?.(doc) : undefined}
                  />
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {doc.title ?? 'Untitled Document'}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell size="small">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {doc.updatedAt
                      ? formatDate(doc.updatedAt)
                      : doc.createdAt
                        ? formatDate(doc.createdAt)
                        : '-'}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell size="small">
                <StatusChip status={(doc.status ?? null) as string | null} />
              </TableCell>
              <TableCell size="small" align="right">
                <Button
                  variant="text"
                  data-testid={`document-action-${doc.id}`}
                  onClick={() => {
                    if (doc.filePath) onOpenDocument?.(doc)
                  }}
                  disabled={!doc.filePath}
                >
                  {getDocumentActionLabel({
                    status:
                      typeof doc.status === 'string'
                        ? (doc.status as ExtendedDocumentStatus)
                        : undefined,
                    filePath: doc.filePath,
                  })}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={6} />
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow sx={{ minWidth: '100%' }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
              colSpan={4}
              count={documents.length}
              rowsPerPage={rowsPerPage}
              page={page}
              slotProps={{
                select: {
                  inputProps: {
                    'aria-label': 'rows per page',
                  },
                  native: true,
                },
              }}
              onPageChange={onPageChange}
              onRowsPerPageChange={onRowsPerPageChange}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  )
}
