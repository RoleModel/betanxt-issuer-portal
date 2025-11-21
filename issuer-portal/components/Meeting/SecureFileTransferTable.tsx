'use client'

import React from 'react'

import { Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import SearchIcon from '@mui/icons-material/Search'
import EmptyState from '@/components/EmptyState'
import FileSearchIcon from '@rolemodel/betanxt-design-system/components/icons/brand/FileSearchIcon'

import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'
import SkeletonTable from '@/components/ui/SkeletonTable'

import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'
import buildApiClient from '@/domain-models/apiClient'
import { documentRepository } from '@/domain-models/documentRepository'
import type { components } from '@/domain-models/generated-schema'
import { getBrowserSupabase } from '@/lib/browserSupabase'
import { getStoragePublicUrl } from '@/utils/documentUtils'
import { bytesToSize } from '@/utils/numberUtils'

type Meeting = components['schemas']['Meeting']
type Document = components['schemas']['Document']

interface SecureFileTransferTableProps {
  clientTicker: string
  showHeader?: boolean
  maxHeight?: number | string
}

export default function SecureFileTransferTable({ clientTicker, showHeader = true, maxHeight }: SecureFileTransferTableProps) {
  const [meetingId, setMeetingId] = React.useState<string | null>(null)
  const [documents, setDocuments] = React.useState<Document[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [measuredSizes, setMeasuredSizes] = React.useState<Record<string, number>>({})
  const [deleteDoc, setDeleteDoc] = React.useState<Document | null>(null)
  const [searchQuery, setSearchQuery] = React.useState<string>('')

  const fetchMeetingAndDocuments = React.useCallback(async () => {
    try {
      setLoading(true)
      const api = await buildApiClient()
      const { data } = await api.GET('/meetings', { params: { query: { ticker: clientTicker.toUpperCase() } } })
      const meetings = Array.isArray(data)
        ? (data as Meeting[])
        : (data && (data as { meetings?: Meeting[] }).meetings) || []
      const active = meetings.find((m) => m.status === 'ACTIVE') || meetings[0]
      const uploadTargetId = active?.id ?? null
      setMeetingId(uploadTargetId)

      const meetingIds = meetings.map((m) => m.id).filter(Boolean) as string[]
      if (meetingIds.length > 0) {
        const allDocsArrays = await Promise.all(
          meetingIds.map((id) => documentRepository.listByMeeting(id))
        )
        const combined = allDocsArrays.flat()
          .filter((d) => {
            const title = (d.title ?? '').trim().toLowerCase()
            const isHostingTitle = title === 'document hosting site'
            const isHostingType = (d.type ?? '') === 'HOSTING_SITE'
            return !isHostingTitle && !isHostingType
          })
        combined.sort((a, b) => {
          const ad = new Date(a.updatedAt || a.uploadedDate || a.createdAt || '').getTime()
          const bd = new Date(b.updatedAt || b.uploadedDate || b.createdAt || '').getTime()
          return bd - ad
        })
        setDocuments(combined)
      } else {
        setDocuments([])
      }
    } finally {
      setLoading(false)
    }
  }, [clientTicker])

  React.useEffect(() => {
    void fetchMeetingAndDocuments()
  }, [fetchMeetingAndDocuments])

  React.useEffect(() => {
    const measure = async () => {
      const targets = documents.filter((d) => (!d.fileSize || d.fileSize === 0) && !!d.filePath)
      if (targets.length === 0) return
      const results = await Promise.all(
        targets.map(async (d) => {
          const url = getStoragePublicUrl(d.filePath!)
          const key = d.id && d.id.length > 0 ? d.id : (d.filePath || '')
          if (!key) return { key: '', size: 0 }
          try {
            const resp = await fetch(url, { method: 'HEAD' })
            const len = Number(resp.headers.get('content-length') || '0')
            return { key, size: Number.isFinite(len) ? len : 0 }
          } catch {
            return { key, size: 0 }
          }
        })
      )
      setMeasuredSizes((prev) => {
        const next = { ...prev }
        results.forEach((r) => {
          if (r.key && r.size > 0) next[r.key] = r.size
        })
        return next
      })
    }
    void measure()
  }, [documents])

  const handleDelete = async (docId: string) => {
    const supabase = getBrowserSupabase()
    await supabase.from('document').delete().eq('id', docId)
    void fetchMeetingAndDocuments()
  }

  const handleUpload = async (files: File[], _associations?: Record<string, string>, description?: string) => {
    if (!meetingId) return
    for (const file of files) {
      await documentRepository.uploadVersion({ meetingId, documentType: 'general-document', file, versionNotes: description })
    }
    setUploadOpen(false)
    void fetchMeetingAndDocuments()
  }

  const formatModified = (doc: Document): string => {
    const raw = doc.updatedAt || doc.uploadedDate || doc.createdAt
    if (!raw) return ''
    const d = new Date(raw)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Filter documents based on search query
  const filteredDocuments = React.useMemo(() => {
    if (!searchQuery.trim()) return documents

    const query = searchQuery.toLowerCase().trim()
    return documents.filter((doc) => {
      const title = (doc.title || '').toLowerCase()
      const type = (doc.type || '').toLowerCase()
      const fileName = doc.filePath ? (doc.filePath.split('/').pop() || '').toLowerCase() : ''

      return title.includes(query) || type.includes(query) || fileName.includes(query)
    })
  }, [documents, searchQuery])

  if (loading) {
    return (
      <Card>
        {showHeader && <CardHeader title="Secure File Transfer" />}
        <CardContent sx={{ p: 0 }}>
          <SkeletonTable columns={4} rows={6} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader
          title="Secure File Transfer"
        />
      )}
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ px: 2, pt: showHeader ? 0 : 3, pb: 2 }}>
        <TextField
          size="small"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            },
          }}
        />
        <Button variant="contained" onClick={() => setUploadOpen(true)}>Upload</Button>
      </Stack>
      <CardContent sx={{ p: 0 }}>
        {filteredDocuments.length === 0 ? (
          <EmptyState title="No files have been uploaded." icon={<FileSearchIcon />} />
        ) : (
          <TableContainer sx={{ maxHeight }}>
            <Table stickyHeader>
              <SROnlyTableCaption>Secure file transfer</SROnlyTableCaption>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>File Downloads</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>File Size</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Modified Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Delete</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const href = doc.filePath ? getStoragePublicUrl(doc.filePath) : ''
                  const name = doc.title || (doc.filePath ? (doc.filePath.split('/').pop() ?? '') : '')
                  return (
                    <TableRow key={doc.id} hover>
                      <TableCell size="small">
                        <Button variant="text" color="info" component="a" href={href} target="_blank" disabled={!href}>
                          {name || 'Download'}
                        </Button>
                      </TableCell>
                      <TableCell size="small">
                        <Typography variant="body3" color="text.secondary">
                          {bytesToSize(
                            (doc.fileSize ?? measuredSizes[doc.id || doc.filePath || ''] ?? 0)
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell size="small">
                        <Typography variant="body3">{formatModified(doc)}</Typography>
                      </TableCell>
                      <TableCell size="small">
                        <IconButton
                          aria-label="Delete file"
                          color="error"
                          onClick={() => setDeleteDoc(doc)}
                        >
                          <DeleteOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      <FileUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(files, associations) => handleUpload(files, associations)}
        onUploadWithNotes={handleUpload}
        meetingId={meetingId ?? undefined}
        documentType="general-document"
      />

      <Dialog open={Boolean(deleteDoc)} onClose={() => setDeleteDoc(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {`Delete ${(deleteDoc?.title || (deleteDoc?.filePath ? (deleteDoc?.filePath.split('/').pop() ?? '') : '')) || ''}?`}
        </DialogTitle>
        <DialogContent>
          <Typography>You will not be able to undo this action</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="primary" onClick={() => setDeleteDoc(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              if (deleteDoc?.id) {
                await handleDelete(deleteDoc.id)
              }
              setDeleteDoc(null)
            }}
          >
            Yes, delete it
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
