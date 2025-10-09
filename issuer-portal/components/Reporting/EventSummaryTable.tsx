'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
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
  const router = useRouter()
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
    ? (data)
    : [
        {
          event: 'Meeting Summary',
          recordDate: (data).materials?.sentDate || '',
          meetingType: 'Annual',
          quorum: (data).quorumAchieved ? 'Yes' : 'No',
          participation: `${((data).participationRate || 0).toFixed(1)}%`,
          numProposals: (data).totalProposals,
          outcome: `${(data).passedProposals}/${(data).totalProposals} Passed`,
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
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Record Date</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Meeting Type</TableCell>
                <TableCell>Quorum</TableCell>
                <TableCell>Participation</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}># Proposals</TableCell>
                <TableCell>Outcome</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row, index) => (
                <TableRow key={`${row.meetingId || 'row'}-${index}`}>
                  <TableCell component="th" scope="row">
                    {row.meetingId ? (
                      <Button
                        variant="text"
                        color="info"
                        onClick={() => {
                          router.push(`/${clientTicker}/meeting/${row.meetingId}`)
                        }}
                      >
                        {row.event}
                      </Button>
                    ) : (
                      row.event
                    )}
                  </TableCell>
                  <TableCell size="small">
                    {row.recordDate
                      ? new Date(row.recordDate).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        })
                      : '--'}
                  </TableCell>
                  <TableCell size="small">{row.meetingType}</TableCell>
                  <TableCell size="small">{row.quorum}</TableCell>
                  <TableCell size="small">{row.participation}</TableCell>
                  <TableCell size="small">{row.numProposals}</TableCell>
                  <TableCell size="small">{row.outcome}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10]}
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
