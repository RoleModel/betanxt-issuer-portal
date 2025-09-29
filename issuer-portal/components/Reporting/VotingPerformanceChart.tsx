'use client'

import React from 'react'

import { Box, Card, CardContent, CardHeader, CircularProgress } from '@mui/material'
import {
  BarPlot,
  ChartDataProvider,
  ChartsGrid,
  ChartsSurface,
  ChartsTooltip,
  ChartsYAxis,
  LinePlot,
  MarkPlot,
} from '@mui/x-charts'
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis'

import { EmptyState } from '@/components/EmptyState'

import { abbreviateNumber } from '@/utils/numberUtils'

import { CustomLegend } from './index'

interface ShareRangeData {
  range: string
  positions: number
  shares: number
  percentVoted: number
}

interface VotingPerformanceChartProps {
  meetingId?: string
  data?: ShareRangeData[]
  loading?: boolean
}

export default function VotingPerformanceChart({
  data = [],
  loading = false,
}: VotingPerformanceChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Voting Performance By Share Range" />
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" height={300}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader title="Voting Performance By Share Range" />
        <CardContent>
          <EmptyState
            title="No voting performance data available"
            description="Please check back later."
          />
        </CardContent>
      </Card>
    )
  }

  const ranges = data.map((item) => item.range)
  const positions = data.map((item) => item.positions)
  const shares = data.map((item) => item.shares)
  const percentVoted = data.map((item) => item.percentVoted)

  const legendItems = [
    {
      label: 'Positions',
      color: 'var(--mui-palette-chartSeries-1-main)',
      type: 'bar' as const,
    },
    {
      label: 'Shares',
      color: 'var(--mui-palette-chartSeries-2-main)',
      type: 'bar' as const,
    },
    {
      label: 'Percent Voted',
      color: 'var(--mui-palette-chartSeries-6-main)',
      type: 'line' as const,
    },
  ]

  return (
    <Card>
      <CardHeader title="Voting Performance By Share Range" />
      <CardContent>
        <ChartDataProvider
          series={[
            {
              type: 'bar',
              data: positions,
              label: 'Positions',
              color: 'var(--mui-palette-chartSeries-1-main)',
              yAxisId: 'leftAxis',
              minBarSize: 4,
            },
            {
              type: 'bar',
              data: shares,
              label: 'Shares',
              color: 'var(--mui-palette-chartSeries-2-main)',
              yAxisId: 'leftAxis',
              minBarSize: 4,
            },
            {
              type: 'line',
              data: percentVoted,
              label: 'Percent Voted',
              color: 'var(--mui-palette-chartSeries-6-main)',
              curve: 'catmullRom',
              showMark: false,
              yAxisId: 'rightAxis',
            },
          ]}
          xAxis={[
            {
              scaleType: 'band',
              data: ranges,
              id: 'x-axis-id',
              height: 70,
              tickLabelStyle: {
                angle: -50,
                textAnchor: 'end',
                dominantBaseline: 'hanging',
              },
            },
          ]}
          yAxis={[
            {
              id: 'leftAxis',
              scaleType: 'linear',
              label: 'Shares',
              min: 0,
              max: Math.max(...shares) * 1.2,
              valueFormatter: (value) => abbreviateNumber(value),
            },
            {
              id: 'rightAxis',
              scaleType: 'linear',
              label: 'Percent %',
              min: 0,
              max: 100,
              width: 200,
              valueFormatter: (value) => `${value}%`,
            },
          ]}
          height={315}
          margin={{ left: 10, right: 40, top: 10, bottom: 0 }}
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
      </CardContent>
    </Card>
  )
}
