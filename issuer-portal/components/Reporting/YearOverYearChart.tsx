'use client'

import React from 'react'

import { Box, CircularProgress, Typography } from '@mui/material'
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
        <Typography variant="body3" color="text.secondary">
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

  const legendItems = [
    {
      label: 'Past',
      color: 'var(--mui-palette-chartSeries-1-main)',
      type: 'bar' as const,
    },
    {
      label: 'Failed',
      color: 'var(--mui-palette-chartSeries-4-main)',
      type: 'bar' as const,
    },
    {
      label: 'Particicpation %',
      color: 'var(--mui-palette-chartSeries-8-main)',
      type: 'line' as const,
    },
  ]

  const years = data.map((item) => String(item.year))
  const participationRates = data.map((item) => item.participationRate)
  const passedCounts = data.map((item) => item.passedCount)
  const failedCounts = data.map((item) => item.failedCount)

  return (
    <ChartDataProvider
      // The configuration of the chart
      series={[
        {
          type: 'bar',
          data: passedCounts,
          label: 'Passed',
          color: 'var(--mui-palette-chartSeries-1-main)',
          yAxisId: 'leftAxis',
        },
        {
          type: 'bar',
          data: failedCounts,
          label: 'Failed',
          color: 'var(--mui-palette-chartSeries-4-main)',
          yAxisId: 'leftAxis',
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
          label: 'Proposals',
          min: 0,
        },
        {
          id: 'rightAxis',
          scaleType: 'linear',
          label: 'Participation %',
          min: 0,
          max: 100,
          width: 100,
          valueFormatter: (value) => `${value}%`,
        },
      ]}
      height={300}
      margin={{ left: 10, right: 60, top: 10, bottom: 0 }}
    >
      <ChartsSurface>
        <ChartsGrid vertical horizontal />
        <BarPlot />
        <LinePlot />
        <MarkPlot />
        <ChartsXAxis axisId="x-axis-id" />
        <ChartsYAxis axisId="leftAxis" position="left" />
        <ChartsYAxis axisId="rightAxis" position="right" />
        <ChartsTooltip />
      </ChartsSurface>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <CustomLegend items={legendItems} />
      </Box>
    </ChartDataProvider>
  )
}

export default YearOverYearChart
