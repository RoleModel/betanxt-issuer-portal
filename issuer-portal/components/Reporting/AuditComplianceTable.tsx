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
  Tooltip,
  Typography,
} from '@mui/material'

interface AuditComplianceData {
  meetingId: string
  meetingTitle: string
  complianceScore: number
  issues: string[]
  materialsCompliant: boolean
}

interface AuditComplianceTableProps {
  data: AuditComplianceData[]
  loading?: boolean
  title?: string
}

const AuditComplianceTable: React.FC<AuditComplianceTableProps> = ({
  data,
  loading = false,
  title = 'Audit & Compliance',
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
            No audit compliance data available
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'success'
    if (score >= 70) return 'warning'
    return 'error'
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
                <TableCell align="center">Compliance Score</TableCell>
                <TableCell align="center">Materials</TableCell>
                <TableCell>Issues</TableCell>
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
                  <TableCell align="center">
                    <Chip
                      label={`${row.complianceScore}%`}
                      color={getComplianceColor(row.complianceScore)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.materialsCompliant ? 'Compliant' : 'Issues'}
                      color={row.materialsCompliant ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {row.issues.length > 0 ? (
                      <Tooltip title={row.issues.join(', ')}>
                        <Typography variant="body2" noWrap>
                          {row.issues.length} issue{row.issues.length !== 1 ? 's' : ''}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        None
                      </Typography>
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

export default AuditComplianceTable
