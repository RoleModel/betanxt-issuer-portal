'use client'

import React from 'react'

import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'

interface MeetingInformationCardProps {
  className?: string
  meeting?: {
    meetingType?: string
    inspector?: string
    cusip?: string
    ticker?: string
    employeeStockPlans?: string
  }
}

const MeetingInformationCard: React.FC<MeetingInformationCardProps> = ({
  className,
  meeting,
}) => {
  const meetingInfo = [
    { label: 'Meeting Type', value: meeting?.meetingType },
    { label: 'BetaNXT Inspector', value: meeting?.inspector },
    { label: 'Company CUSIP(s)', value: meeting?.cusip },
    { label: 'Ticker', value: meeting?.ticker },
    { label: 'Company Plans', value: meeting?.employeeStockPlans },
  ]

  return (
    <Card
      className={className}
      sx={{
        height: '100%',
        backgroundColor: '#f7f5f0',
        borderRadius: 1,
        boxShadow:
          '0px 1px 6px -1px rgba(0,0,0,0.04), 0px 5px 6px -1px rgba(0,0,0,0.05), 0px 3px 4px -1px rgba(0,0,0,0.08)',
      }}
    >
      <CardHeader
        title={"Meeting Information"}
      />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Table>
          <caption>
            Meeting details including type, inspector, and company CUSIP.
          </caption>
          <TableHead aria-hidden="false" sx={{ visibility: 'hidden', display: 'none' }}>
            <TableRow>
              <TableCell>Label</TableCell>
              <TableCell align="right">Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {meetingInfo.map((info, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:not(:last-child)': {
                    borderBottom: '1px solid rgba(31,30,28,0.12)',
                  },
                }}
              >
                <TableCell>
                  {info.label}
                </TableCell>
                <TableCell align="right">{info.value || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default MeetingInformationCard
