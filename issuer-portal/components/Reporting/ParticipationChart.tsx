'use client'

import React from 'react'

import { Box, CircularProgress, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts'

interface ParticipationData {
  meetings: Array<{
    event: string
    participationRate: number
    meetingYear: number
  }>
}

interface ParticipationChartProps {
  data: ParticipationData
  loading?: boolean
  title?: string
}

const ParticipationChart: React.FC<ParticipationChartProps> = ({
  data,
  loading = false,
  title: _title = 'Voting Method Distribution',
}) => {

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height={300}
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading participation data...
        </Typography>
      </Box>
    )
  }

  if (!data || !data.meetings || data.meetings.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography variant="body1" color="text.secondary">
          No participation data available
        </Typography>
      </Box>
    )
  }

  // Normalize dataset to use dataKey mapping (avoids index misalignment in tooltips/hover)
  // Aggregate by year to avoid duplicate year labels
  const aggByYear = data.meetings.reduce((acc, m) => {
    const y = String(m.meetingYear)
    const next = acc.get(y) || { sum: 0, count: 0 }
    next.sum += m.participationRate
    next.count += 1
    acc.set(y, next)
    return acc
  }, new Map<string, { sum: number; count: number }>())

  const years = Array.from(aggByYear.keys()).sort((a, b) => Number(a) - Number(b))
  const values = years.map((y) => {
    const { sum, count } = aggByYear.get(y) as { sum: number; count: number }
    return sum / Math.max(1, count)
  })
  const indices = years.map((_, i) => i)

  return (
    <Box height={300}>
      <BarChart
        dataset={undefined}
        grid={{ horizontal: true, vertical: true }}
        xAxis={[
          {
            scaleType: 'band',
            data: indices,
            valueFormatter: (v) => years[typeof v === 'number' ? v : Number(v)] ?? '',
          },
        ]}
        yAxis={[
          {
            label: 'Delta in Participation %',
            min: 0,
            max: 100,
          },
        ]}
        series={[
          {
            data: values,
            valueFormatter: (v: number | null) => (v == null ? '' : `${v.toFixed(1)}%`),
            color: 'var(--mui-palette-chartSeries-4-main)',
          },
        ]}
        height={300}
      />
    </Box>
  )
}

export default ParticipationChart
