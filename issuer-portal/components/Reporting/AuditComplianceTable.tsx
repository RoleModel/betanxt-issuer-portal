'use client'

import Link from 'next/link'
import React from 'react'

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
  TableRow,
  Typography,
} from '@mui/material'

interface AuditComplianceData {
  event: string
  meetingId?: string
  materialsSent: string
  inspectorCertified: string
  universalProxy: string
  finalCertified: string
}

interface AuditComplianceTableProps {
  data: AuditComplianceData[]
  loading?: boolean
  title?: string
  clientTicker?: string
}

const AuditComplianceTable: React.FC<AuditComplianceTableProps> = ({
  data,
  loading = false,
  title = 'Audit & Compliance',
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
            No audit compliance data available
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Materials Sent</TableCell>
                <TableCell>Inspector Certified</TableCell>
                <TableCell>Universal Proxy</TableCell>
                <TableCell>Final Certified</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell size="small" component="th" scope="row">
                    {row.meetingId && clientTicker ? (
                      <Button
                        variant="text"
                        color="info"
                        component={Link}
                        href={`/clients/${clientTicker}/meetings/${row.meetingId}`}
                      >
                        {row.event}
                      </Button>
                    ) : (
                      <Typography variant="body3" noWrap>
                        {row.event}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell size="small">{row.materialsSent}</TableCell>
                  <TableCell size="small">{row.inspectorCertified}</TableCell>
                  <TableCell size="small">{row.universalProxy}</TableCell>
                  <TableCell size="small">{row.finalCertified}</TableCell>
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
