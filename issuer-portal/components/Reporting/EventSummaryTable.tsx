'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material'

interface EventSummaryRow {
  event: string
  meetingId?: string
  recordDate: string
  meetingType: string
  quorum: string
  participation: string
  numProposals: number
  outcome: string
}

interface EventSummaryData {
  totalProposals: number
  passedProposals: number
  failedProposals: number
  participationRate: number
  quorumAchieved: boolean
  materials: {
    sent: number
    total: number
    sentDate: string
  }
}

interface EventSummaryTableProps {
  data: EventSummaryData | EventSummaryRow[]
  loading?: boolean
  title?: string
  clientTicker?: string
}

const EventSummaryTable: React.FC<EventSummaryTableProps> = ({
  data,
  loading = false,
  title = 'Event Summary',
  clientTicker = '',
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  if (loading) {
    return (
      <Card>
        <CardHeader title={title} />
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" height={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  // Handle both old and new data formats
  const isRowFormat = Array.isArray(data)
  const rows: EventSummaryRow[] = isRowFormat
    ? (data as EventSummaryRow[])
    : [
        {
          event: 'Meeting Summary',
          recordDate: (data as EventSummaryData).materials?.sentDate || '',
          meetingType: 'Annual',
          quorum: (data as EventSummaryData).quorumAchieved ? 'Yes' : 'No',
          participation: `${((data as EventSummaryData).participationRate || 0).toFixed(1)}%`,
          numProposals: (data as EventSummaryData).totalProposals,
          outcome: `${(data as EventSummaryData).passedProposals}/${(data as EventSummaryData).totalProposals} Passed`,
        },
      ]

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Calculate pagination
  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Record Date</TableCell>
                <TableCell>Meeting Type</TableCell>
                <TableCell>Quorum</TableCell>
                <TableCell>Participation</TableCell>
                <TableCell># Proposals</TableCell>
                <TableCell>Outcome</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row, index) => (
                <TableRow key={`${row.meetingId || 'row'}-${index}`}>
                  <TableCell component="th" scope="row">
                    {row.meetingId ? (
                      <MuiLink
                        component={Link}
                        href={`/${clientTicker}/meeting/${row.meetingId}`}
                      >
                        {row.event}
                      </MuiLink>
                    ) : (
                      row.event
                    )}
                  </TableCell>
                  <TableCell>
                    {row.recordDate
                      ? new Date(row.recordDate).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        })
                      : '--'}
                  </TableCell>
                  <TableCell>{row.meetingType}</TableCell>
                  <TableCell>{row.quorum}</TableCell>
                  <TableCell>{row.participation}</TableCell>
                  <TableCell>{row.numProposals}</TableCell>
                  <TableCell>{row.outcome}</TableCell>
                </TableRow>
              ))}
              {/* Add empty rows to maintain table height */}
              {paginatedRows.length < rowsPerPage &&
                Array.from({ length: rowsPerPage - paginatedRows.length }, (_, index) => (
                  <TableRow key={`empty-${index}`} style={{ height: 53 }}>
                    <TableCell colSpan={7} />
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </CardContent>
    </Card>
  )
}

export default EventSummaryTable
