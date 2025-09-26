'use client'

import NextLink from 'next/link'
import React from 'react'

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
  TableRow,
  Typography,
} from '@mui/material'

interface QuorumData {
  meetingId: string
  meetingTitle: string
  requiredShares: number
  actualShares: number
  quorumMet: boolean
  participationRate: number
  daysToQuorum: number | null
  earlyVotesPct: number
  lateVotesPct: number
}

interface QuorumPerformanceTableProps {
  data: QuorumData[]
  loading?: boolean
  title?: string
  clientTicker?: string
}

const QuorumPerformanceTable: React.FC<QuorumPerformanceTableProps> = ({
  data,
  loading = false,
  title = 'Quorum Performance',
  clientTicker = '',
}) => {
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

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader title={title} />
        <CardContent>
          <Typography variant="body1" color="text.secondary">
            No quorum performance data available
          </Typography>
        </CardContent>
      </Card>
    )
  }

  // no-op helpers removed

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell padding="none" align="right">
                  Days to Quorum
                </TableCell>
                <TableCell align="right">Early Votes %</TableCell>
                <TableCell align="right">Late Votes % (1 wk)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => {
                // Extract year from meetingId (format: ticker-type-year)
                const yearMatch = row.meetingId.match(/(\d{4})$/)
                const year = yearMatch ? yearMatch[1] : ''
                const displayTitle = year
                  ? `${row.meetingTitle} ${year}`
                  : row.meetingTitle

                return (
                  <TableRow key={`${row.meetingId}-${index}`}>
                    <TableCell component="th" scope="row">
                      {clientTicker ? (
                        <MuiLink
                          component={NextLink}
                          href={`/${clientTicker}/meeting/${row.meetingId}/dashboard`}
                        >
                          <Typography variant="body2" noWrap>
                            {displayTitle}
                          </Typography>
                        </MuiLink>
                      ) : (
                        <Typography variant="body2" noWrap>
                          {displayTitle}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{row.daysToQuorum ?? '--'}</TableCell>
                    <TableCell align="right">{row.earlyVotesPct.toFixed(1)}%</TableCell>
                    <TableCell align="right">{row.lateVotesPct.toFixed(1)}%</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

export default QuorumPerformanceTable
