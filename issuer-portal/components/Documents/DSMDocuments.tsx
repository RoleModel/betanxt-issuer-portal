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

import { components } from '@/domain-models/generated-schema'

import { formatDate } from '@/lib/formats'
import { getDocumentActionLabel } from '@/utils/documentUtils'

type ApiDocument = components['schemas']['Document']
// Extend with local placeholder status for UI only
type Document = Omit<ApiDocument, 'status'> & {
  status?: ApiDocument['status'] | 'NOT_UPLOADED'
}

type DSMDocumentsProps = {
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

  // Add all real DSM documents
  mergedRows.push(...dsmDocuments)

  // Add placeholders only if there are no real documents
  if (dsmDocuments.length === 0) {
    const placeholderDocs: Document[] = placeholders.map((placeholder) => ({
      id: placeholder.id,
      title: placeholder.title,
      status: 'NOT_UPLOADED',
      // Minimal required optional API fields left undefined intentionally
    }))
    mergedRows.push(...placeholderDocs)
  }

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
                    <Typography>{doc.title}</Typography>
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
                        (doc.filePath ? (doc.status ?? null) : 'NOT_UPLOADED') as
                          | string
                          | null
                      }
                    />
                  </TableCell>
                  <TableCell size="small" align="right">
                    <Button
                      variant="text"
                      data-testid={`dsm-document-action-${doc.id}`}
                      onClick={() => {
                        if (!doc.filePath) onOpenUploadFor(doc)
                        else onOpenDocument(doc)
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
