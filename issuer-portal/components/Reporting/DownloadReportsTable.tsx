'use client'

import { IconForFileType } from '@rolemodel/betanxt-design-system/components/icons/IconForFileType'
import React from 'react'

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

interface ReportItem {
  name: string
}

const reports: ReportItem[] = [
  { name: 'Broker Analysis Report' },
  { name: 'Institutional Ownership Report' },
  { name: 'Vote Reconciliation Report' },
  { name: 'Top Shareholders Report' },
  { name: 'Voting Timeline Report' },
  { name: 'Non-Vote Analysis' },
  { name: 'Regional Distribution Report' },
  { name: 'Vote Method Breakdown' },
  { name: 'Proxy Statement Metrics' },
  { name: 'Final Tabulation Summary' },
]

export default function DownloadReportsTable() {
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
                        aria-label={`Download ${report.name} as PDF`}
                        title={`Download ${report.name} as PDF`}
                      >
                        <IconForFileType fileType="PDF" />
                      </IconButton>
                      <IconButton
                        aria-label={`Download ${report.name} as XLS`}
                        title={`Download ${report.name} as XLS`}
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
