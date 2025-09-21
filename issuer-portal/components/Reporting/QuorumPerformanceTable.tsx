'use client'

import React from 'react'

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
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
}

interface QuorumPerformanceTableProps {
  data: QuorumData[]
  loading?: boolean
  title?: string
}

const QuorumPerformanceTable: React.FC<QuorumPerformanceTableProps> = ({
  data,
  loading = false,
  title = 'Quorum Performance',
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num))
  }

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Meeting</TableCell>
                <TableCell align="right">Required Shares</TableCell>
                <TableCell align="right">Actual Shares</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Participation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.meetingId}>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" noWrap>
                      {row.meetingTitle}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatNumber(row.requiredShares)}</TableCell>
                  <TableCell align="right">{formatNumber(row.actualShares)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.quorumMet ? 'Met' : 'Not Met'}
                      color={row.quorumMet ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{row.participationRate.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

export default QuorumPerformanceTable
