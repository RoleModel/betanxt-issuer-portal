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

import DocumentThumbnail from '@/components/Documents/DocumentThumbnail'
import StatusChip from '@/components/ui/StatusChip'

import { components } from '@/domain-models/generated-schema'

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

  // Merge placeholders with real docs: show Not Uploaded for missing entries
  const docsByPlaceholderId = new Map(
    dsmDocuments
      .filter((doc) => doc.description?.startsWith('placeholder-'))
      .map((doc) => [doc.description, doc])
  )

  const mergedRows: Document[] = placeholders.map((placeholder) => {
    // Check if we have a real document for this placeholder
    const realDoc = docsByPlaceholderId.get(placeholder.id)

    if (realDoc) {
      // Return the real document but with the placeholder title
      return {
        ...realDoc,
        title: placeholder.title,
      }
    } else {
      // Return placeholder as "Not Uploaded"
      const placeholderDoc: Document = {
        id: placeholder.id,
        title: placeholder.title,
        status: 'NOT_UPLOADED',
        // Minimal required optional API fields left undefined intentionally
      }
      return placeholderDoc
    }
  })

  // Add any DSM documents that don't match placeholders
  const unmatchedDocs = dsmDocuments.filter(
    (doc) => !doc.description?.startsWith('placeholder-')
  )
  mergedRows.push(...unmatchedDocs)

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
            <TableHead>
              <TableRow>
                <TableCell>Thumbnail</TableCell>
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
                    <DocumentThumbnail
                      filePath={doc.filePath ?? (doc as { url?: string }).url}
                      onClick={
                        (doc.filePath ?? (doc as { url?: string }).url)
                          ? () => onOpenDocument(doc)
                          : undefined
                      }
                    />
                  </TableCell>
                  <TableCell size="small">
                    <Typography>{doc.title}</Typography>
                  </TableCell>
                  <TableCell size="small">
                    <Typography color="text.secondary">{doc.updatedAt || '—'}</Typography>
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
