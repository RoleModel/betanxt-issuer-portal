'use client'

import React from 'react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TablePaginationActions,
  TableRow,
  Typography,
} from '@mui/material'

import SrOnlyTableCaption from '@/components/ui/SROnlyTableCaption'
import StatusChip from '@/components/ui/StatusChip'

import type { components } from '@/domain-models/generated-schema'

import { formatDate } from '@/lib/formats'
import { getDocumentActionLabel } from '@/utils/documentUtils'

type ApiDocument = components['schemas']['Document']
// Extend with local placeholder status for UI only
type Document = Omit<ApiDocument, 'status'> & {
  status?: ApiDocument['status'] | 'NOT_UPLOADED'
}

interface DSMDocumentsProps {
  dsmDocuments: Document[]
  dsmPage: number
  dsmRowsPerPage: number
  dsmEmptyRows: number
  dsmProgress: { uploaded: number; totalRequired: number; percentage: number }
  onUpload: () => void
  onPageChange: (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => void
  onRowsPerPageChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  onOpenDocument: (doc: Document) => void
  onOpenUploadFor: (doc: Document) => void
  placeholders?: { id: string; title: string }[]
}

export default function DSMDocuments(props: DSMDocumentsProps) {
  const {
    dsmDocuments,
    dsmPage,
    dsmRowsPerPage,
    dsmEmptyRows,
    dsmProgress,
    onUpload,
    onPageChange,
    onRowsPerPageChange,
    onOpenDocument,
    onOpenUploadFor,
    placeholders = [],
  } = props

  // Show all DSM documents - placeholders for missing items, real documents for uploaded ones
  const mergedRows: Document[] = []

  // Create a map of uploaded documents by title for easy lookup
  const uploadedDocsByTitle = new Map(
    dsmDocuments.map((doc) => [doc.title?.toLowerCase(), doc])
  )

  // For each placeholder, either show the real document or the placeholder
  placeholders.forEach((placeholder) => {
    const realDoc = uploadedDocsByTitle.get(placeholder.title.toLowerCase())
    if (realDoc) {
      mergedRows.push(realDoc)
    } else {
      mergedRows.push({
        id: placeholder.id,
        title: placeholder.title,
        status: 'NOT_UPLOADED',
        // Minimal required optional API fields left undefined intentionally
      })
    }
  })

  // Add any DSM documents that don't match placeholders
  dsmDocuments.forEach((doc) => {
    const matchesPlaceholder = placeholders.some(
      (p) => p.title.toLowerCase() === doc.title?.toLowerCase()
    )
    if (!matchesPlaceholder) {
      mergedRows.push(doc)
    }
  })

  return (
    <Card>
      <CardHeader
        title={' Digital Shareholder Meeting Documents'}
        subheader={`${dsmProgress.uploaded} of ${dsmProgress.totalRequired} Materials Uploaded`}
        action={
          <Button variant="contained" onClick={onUpload} sx={{ textTransform: 'none' }}>
            Upload
          </Button>
        }
      />

      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <SrOnlyTableCaption>
              Digital Shareholder Meeting Documents - {dsmProgress.percentage}% complete
            </SrOnlyTableCaption>
            <TableHead>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Added/Updated</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(dsmRowsPerPage > 0
                ? mergedRows.slice(
                    dsmPage * dsmRowsPerPage,
                    dsmPage * dsmRowsPerPage + dsmRowsPerPage
                  )
                : mergedRows
              ).map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell size="small">
                    <Typography>{doc.title || 'Untitled Document'}</Typography>
                  </TableCell>
                  <TableCell size="small">
                    <Typography variant="caption" color="text.secondary">
                      {doc.updatedAt
                        ? formatDate(doc.updatedAt)
                        : doc.createdAt
                          ? formatDate(doc.createdAt)
                          : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell size="small">
                    <StatusChip
                      status={
                        (doc.status === 'NOT_UPLOADED' || (!doc.filePath && !doc.status)) 
                          ? 'NOT_UPLOADED' 
                          : (doc.status ?? null)
                      }
                    />
                  </TableCell>
                  <TableCell size="small" align="right">
                    <Button
                      variant="text"
                      data-testid={`dsm-document-action-${doc.id}`}
                      onClick={() => {
                        const hasFile = !!(doc.filePath)
                        if (!hasFile || doc.status === 'NOT_UPLOADED') {
                          onOpenUploadFor(doc)
                        } else {
                          onOpenDocument(doc)
                        }
                      }}
                    >
                      {getDocumentActionLabel({
                        status: doc.status || undefined,
                        filePath: doc.filePath,
                        url: doc.filePath || undefined,
                      })}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {dsmEmptyRows > 0 && (
                <TableRow style={{ height: 53 * dsmEmptyRows }}>
                  <TableCell colSpan={4} />
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[6, 10, 25, { label: 'All', value: -1 }]}
                  colSpan={5}
                  count={mergedRows.length}
                  rowsPerPage={dsmRowsPerPage}
                  page={dsmPage}
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
                  ActionsComponent={TablePaginationActions}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}
