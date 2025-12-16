'use client'

import React from 'react'

import { Box, Typography } from '@mui/material'
import {
  BarPlot,
  ChartDataProvider,
  ChartsGrid,
  ChartsSurface,
  ChartsTooltip,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  MarkPlot,
} from '@mui/x-charts'

import SkeletonChart from '@/components/ui/SkeletonChart'

import { CustomLegend } from './index'

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
    return <SkeletonChart height={320} showLegend noCard />
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

  const legendItems = [
    {
      label: 'Passed',
      color: 'var(--mui-palette-chartSeries-1-main)',
      type: 'bar' as const,
    },
    {
      label: 'Failed',
      color: 'var(--mui-palette-chartSeries-4-main)',
      type: 'bar' as const,
    },
    {
      label: 'Participation %',
      color: 'var(--mui-palette-chartSeries-8-main)',
      type: 'line' as const,
    },
  ]

  const years = data.map((item) => String(item.year))
  const participationRates = data.map((item) => item.participationRate)
  const passedCounts = data.map((item) => item.passedCount)
  const failedCounts = data.map((item) => item.failedCount)

  // Fixed max of 10 proposals for chart display
  const yAxisMax = 10

  // Background bars fill the remaining space to reach 100% height (yAxisMax)
  const passedBackgrounds = passedCounts.map((passed) => Math.max(0, yAxisMax - passed))
  const failedBackgrounds = failedCounts.map((failed) => Math.max(0, yAxisMax - failed))

  return (
    <ChartDataProvider
      // The configuration of the chart - two separate stacks for Passed and Failed columns
      series={[
        // Passed column with background
        {
          type: 'bar',
          data: passedCounts,
          label: 'Passed',
          color: 'var(--mui-palette-chartSeries-1-main)',
          yAxisId: 'leftAxis',
          stack: 'passed',
        },
        {
          type: 'bar',
          data: passedBackgrounds,
          label: 'Passed Background',
          color: 'rgba(0, 0, 0, 0.1)',
          yAxisId: 'leftAxis',
          stack: 'passed',
        },
        // Failed column with background
        {
          type: 'bar',
          data: failedCounts,
          label: 'Failed',
          color: 'var(--mui-palette-chartSeries-4-main)',
          yAxisId: 'leftAxis',
          stack: 'failed',
        },
        {
          type: 'bar',
          data: failedBackgrounds,
          label: 'Failed Background',
          color: 'rgba(0, 0, 0, 0.1)',
          yAxisId: 'leftAxis',
          stack: 'failed',
        },
        {
          type: 'line',
          data: participationRates,
          label: 'Participation %',
          color: 'var(--mui-palette-chartSeries-8-main)',
          curve: 'catmullRom',
          showMark: false,
          yAxisId: 'rightAxis',
        },
      ]}
      xAxis={[
        {
          scaleType: 'band',
          data: years,
          id: 'x-axis-id',
        },
      ]}
      yAxis={[
        {
          id: 'leftAxis',
          scaleType: 'linear',
          min: 0,
          max: yAxisMax,
        },
        {
          id: 'rightAxis',
          scaleType: 'linear',
          min: 0,
          max: 100,
          width: 100,
          valueFormatter: (value) => `${value ?? 0}%`,
        },
      ]}
      height={320}
      margin={{ left: 10, right: 60, top: 10, bottom: 0 }}
    >
      <ChartsSurface>
        <ChartsGrid vertical horizontal />
        <BarPlot />
        <LinePlot />
        <MarkPlot />
        <ChartsXAxis axisId="x-axis-id" />
        <ChartsYAxis axisId="leftAxis" />
        <ChartsYAxis axisId="rightAxis" />
        <ChartsTooltip />
      </ChartsSurface>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <CustomLegend items={legendItems} />
      </Box>
    </ChartDataProvider>
  )
}

export default YearOverYearChart
