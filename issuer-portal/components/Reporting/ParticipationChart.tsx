'use client'

import React from 'react'

import { Box, CircularProgress, Typography, useTheme } from '@mui/material'
import { PieChart } from '@mui/x-charts'

interface ParticipationData {
  webVoting: number
  printVoting: number
  ivrVoting: number
  totalVotes: number
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
  const _theme = useTheme()

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

  if (!data || data.totalVotes === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography variant="body1" color="text.secondary">
          No participation data available
        </Typography>
      </Box>
    )
  }

  const chartData = [
    { id: 0, value: data.webVoting, label: 'Web Voting' },
    { id: 1, value: data.printVoting, label: 'Print Voting' },
    { id: 2, value: data.ivrVoting, label: 'IVR Voting' },
  ].filter((item) => item.value > 0)

  return (
    <Box height={300}>
      <PieChart
        series={[
          {
            data: chartData,
            highlightScope: { fade: 'global', highlight: 'item' },
            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
          },
        ]}
        height={300}
        slotProps={{
          legend: {
            direction: 'column',
            position: { vertical: 'middle', horizontal: 'end' },
          },
        }}
      />
    </Box>
  )
}

export default ParticipationChart
