'use client'

import { IconForFileType } from '@rolemodel/betanxt-design-system/components/icons/IconForFileType'
import React, { useEffect, useState } from 'react'

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'

import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'
import { getBrowserSupabase } from '@/lib/browserSupabase'

interface ReportItem {
  name: string
  path: string
}

interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, unknown>
}

export default function DownloadReportsTable({
  meetingId,
}: {
  meetingId: string
}) {
  const [reports, setReports] = useState<ReportItem[]>([])
  const supabase = getBrowserSupabase()

  useEffect(() => {
    async function fetchReports() {
      const { data, error } = await supabase.storage
        .from('documents')
        .list(`${meetingId}/reports`)

      if (error) {
        console.error('Error fetching reports:', error)
        return
      }

      if (data) {
        const reportItems = (data as StorageFile[])
          .filter((file: StorageFile) => file.name.endsWith('.xls'))
          .map((file: StorageFile) => ({
            name: file.name.replace('.xls', ''),
            path: `${meetingId}/reports/${file.name}`,
          }))
        setReports(reportItems)
      }
    }

    fetchReports()
  }, [meetingId, supabase])

  const handleDownload = async (path: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(path)

    if (error) {
      console.error('Error downloading report:', error)
      return
    }

    if (data) {
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Card>
      <CardHeader title="Download Meeting Reports" />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <SROnlyTableCaption>
              List of available meeting reports for download
            </SROnlyTableCaption>
            <TableHead>
              <TableRow>
                <TableCell>Report Name</TableCell>
                <TableCell align="right">Download</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report, index) => (
                <TableRow key={index}>
                  <TableCell>{report.name}</TableCell>
                  <TableCell align="right">
                    <Box component="span" sx={{ display: 'inline-flex', gap: 1 }}>
                      <IconButton
                        aria-label={`Download ${report.name} as XLS`}
                        title={`Download ${report.name} as XLS`}
                        onClick={() =>
                          handleDownload(report.path, `${report.name}.xls`)
                        }
                      >
                        <IconForFileType fileType="XLS" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}
