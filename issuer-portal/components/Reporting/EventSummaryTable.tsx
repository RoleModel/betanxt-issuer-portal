'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material'

import SkeletonTable from '@/components/ui/SkeletonTable'

function formatVotingCutoff(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '--'
  const datePart = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
  // Default cutoff time when only a date is stored
  return `${datePart} 11:59 PM ET`
}

interface EventSummaryRow {
  event: string
  meetingId?: string
  meetingType: string
  inspector: string
  brokerSearchDate: string
  recordDate: string
  filingDate: string
  mailingDate: string
  mailingMethod: string
  votingCutoff: string
}

interface EventSummaryTableProps {
  data: EventSummaryRow[]
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
    return <SkeletonTable rows={5} columns={9} />
  }

  const rows: EventSummaryRow[] = data

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
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Meeting Type</TableCell>
                <TableCell>Inspector</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Broker Search Date</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Record Date</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Filing Date</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Mailing Date</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Mailing Method</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Voting Cutoff</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row, index) => (
                <TableRow key={`${row.meetingId ?? 'row'}-${index}`}>
                  <TableCell
                    size="small"
                    component="th"
                    scope="row"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
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
                  <TableCell size="small">{row.meetingType}</TableCell>
                  <TableCell size="small" sx={{ whiteSpace: 'nowrap' }}>
                    {row.inspector || '--'}
                  </TableCell>
                  <TableCell size="small" sx={{ whiteSpace: 'nowrap' }}>
                    {row.brokerSearchDate
                      ? new Date(row.brokerSearchDate).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                      })
                      : '--'}
                  </TableCell>
                  <TableCell size="small" sx={{ whiteSpace: 'nowrap' }}>
                    {row.recordDate
                      ? new Date(row.recordDate).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                      })
                      : '--'}
                  </TableCell>
                  <TableCell size="small" sx={{ whiteSpace: 'nowrap' }}>
                    {row.filingDate
                      ? new Date(row.filingDate).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                      })
                      : '--'}
                  </TableCell>
                  <TableCell size="small" sx={{ whiteSpace: 'nowrap' }}>
                    {row.mailingDate
                      ? new Date(row.mailingDate).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                      })
                      : '--'}
                  </TableCell>
                  <TableCell size="small">{row.mailingMethod || 'NAA'}</TableCell>
                  <TableCell size="small" sx={{ whiteSpace: 'nowrap' }}>
                    {row.votingCutoff
                      ? formatVotingCutoff(row.votingCutoff)
                      : '--'}
                  </TableCell>
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
