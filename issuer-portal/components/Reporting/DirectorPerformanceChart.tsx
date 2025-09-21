'use client'

import React from 'react'

import { Box, CircularProgress, Typography, useTheme } from '@mui/material'
import { BarChart } from '@mui/x-charts'

interface DirectorPerformanceData {
  directorName: string
  forVotes: number
  againstVotes: number
  abstainVotes: number
  totalVotes: number
}

interface DirectorPerformanceChartProps {
  data: DirectorPerformanceData[]
  loading?: boolean
  title?: string
}

const DirectorPerformanceChart: React.FC<DirectorPerformanceChartProps> = ({
  data,
  loading = false,
  title: _title = 'Director Performance',
}) => {
  const theme = useTheme()

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
          Loading director performance data...
        </Typography>
      </Box>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography variant="body1" color="text.secondary">
          No director performance data available for this meeting
        </Typography>
      </Box>
    )
  }

  const chartData = data.map((item) => {
    const total = item.totalVotes || item.forVotes + item.againstVotes + item.abstainVotes
    return {
      directorName: item.directorName,
      forPercentage: total > 0 ? Math.round((item.forVotes / total) * 100) : 0,
      againstPercentage: total > 0 ? Math.round((item.againstVotes / total) * 100) : 0,
      abstainPercentage: total > 0 ? Math.round((item.abstainVotes / total) * 100) : 0,
    }
  })

  const directorNames = chartData.map((item) => item.directorName)
  const forPercentageData = chartData.map((item) => item.forPercentage)
  const againstPercentageData = chartData.map((item) => item.againstPercentage)
  const abstainPercentageData = chartData.map((item) => item.abstainPercentage)

  return (
    <BarChart
      height={300}
      layout="horizontal"
      series={[
        {
          data: forPercentageData,
          label: 'For',
          color: theme.palette.success?.main || '#4caf50',
          stack: 'votes',
        },
        {
          data: againstPercentageData,
          label: 'Against',
          color: theme.palette.error?.main || '#f44336',
          stack: 'votes',
        },
        {
          data: abstainPercentageData,
          label: 'Abstain',
          color: theme.palette.warning?.main || '#ff9800',
          stack: 'votes',
        },
      ]}
      yAxis={[
        {
          data: directorNames,
          scaleType: 'band',
          tickSize: 7,
          tickLabelStyle: {
            fontSize: 12,
            width: 15,
          },
        },
      ]}
      xAxis={[
        {
          min: 0,
          max: 100,
          tickNumber: 11,
        },
      ]}
      margin={{ left: 120, right: 10, top: 10, bottom: 40 }}
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

export default DirectorPerformanceChart
