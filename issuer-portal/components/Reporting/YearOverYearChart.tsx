'use client'

import React from 'react'

import { Box, CircularProgress, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts'

interface YearOverYearData {
  year: number
  participationRate: number
  proposalsCount: number
  passedCount: number
  failedCount: number
}

interface YearOverYearChartProps {
  data: YearOverYearData[]
  loading?: boolean
  title?: string
}

const YearOverYearChart: React.FC<YearOverYearChartProps> = ({
  data,
  loading = false,
  title: _title = 'Year over Year Performance',
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
          Loading year over year data...
        </Typography>
      </Box>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography variant="body1" color="text.secondary">
          No year over year data available
        </Typography>
      </Box>
    )
  }

  const years = data.map((item) => item.year)
  const participationRates = data.map((item) => item.participationRate)
  const proposalCounts = data.map((item) => item.proposalsCount)
  const passedCounts = data.map((item) => item.passedCount)

  return (
    <LineChart
      height={300}
      series={[
        {
          data: participationRates,
          label: 'Participation Rate (%)',
          yAxisKey: 'leftAxis',
        },
        {
          data: proposalCounts,
          label: 'Total Proposals',
          yAxisKey: 'rightAxis',
        },
        {
          data: passedCounts,
          label: 'Passed Proposals',
          yAxisKey: 'rightAxis',
        },
      ]}
      xAxis={[{ data: years, scaleType: 'point' }]}
      yAxis={[
        { id: 'leftAxis', scaleType: 'linear' },
        { id: 'rightAxis', scaleType: 'linear' },
      ]}
      margin={{ left: 60, right: 60, top: 10, bottom: 40 }}
      grid={{ vertical: true, horizontal: true }}
      slotProps={{
        legend: {
          direction: 'horizontal',
          position: { vertical: 'bottom', horizontal: 'center' },
        },
      }}
    />
  )
}

export default YearOverYearChart
