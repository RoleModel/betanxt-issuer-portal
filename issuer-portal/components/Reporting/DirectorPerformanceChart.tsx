'use client'

import React from 'react'

import { Box, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts'

import { ChartDataProvider } from '@/components/Reporting/ChartDataContext'
import SkeletonChart from '@/components/ui/SkeletonChart'

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
  if (loading) {
    return <SkeletonChart height={400} showLegend />
  }

  // Check if data is empty or undefined
  if (!data || data.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height={300}
        gap={2}
      >
        <Typography variant="body2" color="text.secondary">
          No director performance data available
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

  // Ensure all director names are strings to prevent chart rendering errors
  const directorNames = chartData.map((item) => String(item.directorName || 'Unknown'))
  const forPercentageData = chartData.map((item) => item.forPercentage)
  const againstPercentageData = chartData.map((item) => item.againstPercentage)
  const abstainPercentageData = chartData.map((item) => item.abstainPercentage)

  return (
    <ChartDataProvider
      value={{
        series: [
          {
            data: forPercentageData,
            label: 'For',
            color: 'var(--mui-palette-chartSeries-1-main)',
            stack: 'votes',
          },
          {
            data: againstPercentageData,
            label: 'Against',
            color: 'var(--mui-palette-chartSeries-5-main)',
            stack: 'votes',
          },
          {
            data: abstainPercentageData,
            label: 'Abstain',
            color: 'var(--mui-palette-chartSeries-2-main)',
            stack: 'votes',
          },
        ],
        yAxis: [
          {
            data: directorNames,
            scaleType: 'band',
            tickSize: 7,
            tickLabelStyle: { fontSize: 12, width: 15 },
          },
        ],
        xAxis: [
          {
            min: 0,
            max: 100,
            tickNumber: 11,
          },
        ],
      }}
    >
      <BarChart
        height={320}
        layout="horizontal"
        series={[
          {
            data: forPercentageData,
            label: 'For',
            color: 'var(--mui-palette-chartSeries-1-main)',
            stack: 'votes',
          },
          {
            data: againstPercentageData,
            label: 'Against',
            color: 'var(--mui-palette-chartSeries-5-main)',
            stack: 'votes',
          },
          {
            data: abstainPercentageData,
            label: 'Abstain',
            color: 'var(--mui-palette-chartSeries-2-main)',
            stack: 'votes',
          },
        ]}
        yAxis={[
          {
            data: directorNames,
            scaleType: 'band',
            tickSize: 7,
            tickLabelStyle: { fontSize: 12, width: 15 },
          },
        ]}
        xAxis={[
          {
            min: 0,
            max: 100,
            tickNumber: 11,
          },
        ]}
        margin={{ left: 130, right: 30, top: 10, bottom: 10 }}
        grid={{ vertical: true, horizontal: true }}
        slotProps={{
          legend: {
            direction: 'horizontal',
            position: { vertical: 'bottom', horizontal: 'center' },
          },
        }}
      />
    </ChartDataProvider>
  )
}

export default DirectorPerformanceChart
