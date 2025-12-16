'use client'

import React, { useEffect, useState } from 'react'

import { Box, Card, CardContent, CardHeader } from '@mui/material'
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
import SkeletonChart from '@/components/ui/SkeletonChart'

import buildApiClient from '@/domain-models/apiClient'

import { abbreviateNumber } from '@/utils/numberUtils'

import { CustomLegend } from './index'

interface Position {
  shares: number | string
  voteStatus?: string
  [key: string]: unknown
}

interface PositionsResponse {
  positions?: Position[]
}

interface ShareRangeData {
  range: string
  positions: number
  shares: number
  percentVoted: number
}

interface VotingPerformanceChartProps {
  meetingId?: string
}

export default function VotingPerformanceChart({
  meetingId,
}: VotingPerformanceChartProps) {
  const [data, setData] = useState<ShareRangeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!meetingId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const apiClient = await buildApiClient()

        // Fetch positions for this meeting to calculate share range performance
        const { data: positionsData, error } = await apiClient.GET('/positions', {
          params: { query: { meetingId } },
        })

        if (error) {
          console.error('Failed to fetch voting performance data:', error)
        } else if (positionsData) {
          // Define share ranges
          const ranges = [
            { min: 0, max: 999, label: '0-999' },
            { min: 1000, max: 4999, label: '1K-5K' },
            { min: 5000, max: 9999, label: '5K-10K' },
            { min: 10000, max: 19999, label: '10K-20K' },
            { min: 20000, max: 49999, label: '20K-50K' },
            { min: 50000, max: 99999, label: '50K-100K' },
            { min: 100000, max: 199999, label: '100K-200K' },
            { min: 200000, max: 499999, label: '200K-500K' },
            { min: 500000, max: 999999, label: '500K-1M' },
            { min: 1000000, max: Number.MAX_SAFE_INTEGER, label: '1M+' },
          ]

          // Process actual position data to calculate performance by share range
          // Handle both array and wrapped response formats
          const positionRecords = Array.isArray(positionsData)
            ? (positionsData as Position[])
            : (positionsData as PositionsResponse)?.positions || []
          const performanceData = ranges.map((rangeInfo) => {
            // Filter positions within this share range
            const rangePositions = positionRecords.filter((pos: Position) => {
              const shares = Number(pos.shares) || 0
              return shares >= rangeInfo.min && shares <= rangeInfo.max
            })

            // Calculate statistics for this range
            const totalPositions = rangePositions.length
            const totalShares = rangePositions.reduce(
              (sum: number, pos: Record<string, unknown>) =>
                sum + (Number(pos.shares) || 0),
              0
            )
            const votedPositions = rangePositions.filter(
              (pos: Record<string, unknown>) => {
                return pos.voteStatus === 'Voted'
              }
            )
            const votedShares = votedPositions.reduce(
              (sum: number, pos: Record<string, unknown>) => {
                return sum + (Number(pos.sharesVoted) || 0)
              },
              0
            )
            const percentVoted =
              totalShares > 0 ? Math.round((votedShares / totalShares) * 100) : 0

            return {
              range: rangeInfo.label,
              positions: totalPositions,
              shares: totalShares,
              percentVoted: percentVoted,
            }
          })
          // Show all ranges, even if they have 0 positions

          setData(performanceData)
        }
      } catch (error) {
        console.error('Failed to load voting performance data:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [meetingId])

  if (loading) {
    return <SkeletonChart title="Voting Performance By Share Range" height={345} showLegend />
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

  // Ensure all range labels are strings to prevent chart rendering errors
  const ranges = data.map((item) => String(item.range || ''))
  const positions = data.map((item) => item.positions)
  const shares = data.map((item) => item.shares)
  const percentVoted = data.map((item) => item.percentVoted)

  // Calculate max with safe fallback to prevent -Infinity
  const maxShares = shares.length > 0 ? Math.max(...shares) : 0

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
              minBarSize: 8,
            },
            {
              type: 'bar',
              data: shares,
              label: 'Shares',
              color: 'var(--mui-palette-chartSeries-2-main)',
              yAxisId: 'leftAxis',
              minBarSize: 8,
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
              min: 0,
              max: maxShares * 1.2 || 100, // Safe fallback if no data
              valueFormatter: (value) => abbreviateNumber(value as number),
            },
            {
              id: 'rightAxis',
              scaleType: 'linear',
              min: 0,
              max: 100,
              width: 60,
              valueFormatter: (value) => `${value}%`,
            },
          ]}
          height={345}
          margin={{ left: 10, right: 80, top: 10, bottom: 0 }}
        >
          <ChartsSurface>
            <ChartsGrid vertical horizontal />
            <BarPlot />
            <LinePlot />
            <MarkPlot />
            <ChartsXAxis axisId="x-axis-id" />
            <ChartsYAxis axisId="leftAxis" position="left" label="Positions" />
            <ChartsYAxis axisId="rightAxis" position="right" label="Percent %" />
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
