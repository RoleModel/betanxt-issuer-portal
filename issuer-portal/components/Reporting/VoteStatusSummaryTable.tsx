'use client'

import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'

interface VoteStatusRow {
  category: string
  shareholders: number
  shares: number
  percentage: number
}

interface VoteStatusSummaryTableProps {
  title: string
  data: VoteStatusRow[]
  loading?: boolean
}

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const isSourceRow = (category: string): boolean => {
  return ['PRINT', 'IVR', 'WEB'].includes(category)
}

const isTotalRow = (category: string): boolean => {
  return category === 'Grand Total' || category === 'Voted Sub-Total'
}

export default function VoteStatusSummaryTable({
  title,
  data,
  loading,
}: VoteStatusSummaryTableProps) {
  if (loading || data.length === 0) {
    return (
      <Card>
        <CardHeader title={title} />
        <CardContent>
          <Skeleton variant="rectangular" height={200} />
        </CardContent>
      </Card>
    )
  }

  const isNonDtcTable = title.includes('Non-DTC')

  // Calculate totals for percentage calculations
  const totalShares = data.find(row => row.category === 'Grand Total')?.shares || 0
  const totalShareholders = data.find(row => row.category === 'Grand Total')?.shareholders || 0

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <SROnlyTableCaption>{title}</SROnlyTableCaption>
            <TableHead>
              <TableRow>
                {isNonDtcTable ? (
                  <>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Shareholders</TableCell>
                    <TableCell align="right">% of Total</TableCell>
                    <TableCell align="right">Shares</TableCell>
                    <TableCell align="right">% of Total</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Participants</TableCell>
                    <TableCell align="right">Shares</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => {
                const isSource = isSourceRow(row.category)
                const isTotal = isTotalRow(row.category)
                const shareholderPct = totalShareholders > 0 ? (row.shareholders / totalShareholders) * 100 : 0
                const sharesPct = totalShares > 0 ? (row.shares / totalShares) * 100 : 0

                return (
                  <TableRow
                    key={index}
                    sx={(theme) => ({
                      ...(isTotal && {
                        bgcolor: theme.vars.palette.dataGridPagination.backgroundFill,
                        fontWeight: 'bold',
                      }),
                    })}
                  >
                    <TableCell
                      sx={{
                        ...(isSource && { pl: 4 }),
                        ...(isTotal && { fontWeight: 'bold' }),
                      }}
                    >
                      {row.category}
                    </TableCell>
                    <TableCell align="right" sx={isTotal ? { fontWeight: 'bold' } : {}}>
                      {formatNumber(row.shareholders)}
                    </TableCell>
                    {isNonDtcTable && (
                      <TableCell align="right" sx={isTotal ? { fontWeight: 'bold' } : {}}>
                        {isTotal && row.category === 'Grand Total' ? '-' : `${shareholderPct.toFixed(2)}%`}
                      </TableCell>
                    )}
                    <TableCell align="right" sx={isTotal ? { fontWeight: 'bold' } : {}}>
                      {formatNumber(row.shares)}
                    </TableCell>
                    {isNonDtcTable && (
                      <TableCell align="right" sx={isTotal ? { fontWeight: 'bold' } : {}}>
                        {isTotal && row.category === 'Grand Total' ? '-' : `${sharesPct.toFixed(2)}%`}
                      </TableCell>
                    )}
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
