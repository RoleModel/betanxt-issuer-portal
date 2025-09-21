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
  data: EventSummaryData
  loading?: boolean
  title?: string
}

const EventSummaryTable: React.FC<EventSummaryTableProps> = ({
  data,
  loading = false,
  title = 'Event Summary',
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

  if (!data) {
    return (
      <Card>
        <CardHeader title={title} />
        <CardContent>
          <Typography variant="body1" color="text.secondary">
            No event summary data available
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const summaryRows = [
    {
      label: 'Total Proposals',
      value: data.totalProposals,
      format: (val: number) => val.toString(),
    },
    {
      label: 'Passed Proposals',
      value: data.passedProposals,
      format: (val: number) => `${val}/${data.totalProposals}`,
    },
    {
      label: 'Failed Proposals',
      value: data.failedProposals,
      format: (val: number) => `${val}/${data.totalProposals}`,
    },
    {
      label: 'Participation Rate',
      value: data.participationRate,
      format: (val: number) => `${val.toFixed(1)}%`,
    },
    {
      label: 'Quorum Status',
      value: data.quorumAchieved ? 1 : 0,
      format: (val: number) => (val ? 'Achieved' : 'Not Achieved'),
    },
    {
      label: 'Materials Sent',
      value: data.materials.sent,
      format: (val: number) => `${val}/${data.materials.total}`,
    },
    {
      label: 'Materials Sent Date',
      value: data.materials.sentDate,
      format: (val: string | number) => {
        if (typeof val === 'string' && val) {
          return new Date(val).toLocaleDateString()
        }
        return 'Not Available'
      },
    },
  ]

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell align="right">Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaryRows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    {row.label}
                  </TableCell>
                  <TableCell align="right">
                    {row.label === 'Quorum Status' ? (
                      <Chip
                        label={row.format(row.value)}
                        color={data.quorumAchieved ? 'success' : 'error'}
                        size="small"
                      />
                    ) : (
                      row.format(row.value)
                    )}
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

export default EventSummaryTable
