'use client'

import React from 'react'

import { Box, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts'

import SkeletonChart from '@/components/ui/SkeletonChart'

import { CustomLegend } from './index'

interface DirectorVotingData {
  year: number
  forPercentage: number
  againstPercentage: number
  abstainPercentage: number
}

interface IndividualDirectorChartProps {
  directorName: string
  data: DirectorVotingData[]
  loading?: boolean
}

const IndividualDirectorChart: React.FC<IndividualDirectorChartProps> = ({
  directorName,
  data,
  loading = false,
}) => {
  if (loading) {
    return <SkeletonChart height={400} showLegend />
  }

  if (!data || data.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography variant="body1" color="text.secondary">
          No voting data available for {directorName}
        </Typography>
      </Box>
    )
  }

  // Sort data by year and extract series
  const sortedData = [...data].sort((a, b) => a.year - b.year)
  const years = sortedData.map((d) => d.year)
  const forVotes = sortedData.map((d) => d.forPercentage)
  const againstVotes = sortedData.map((d) => d.againstPercentage)
  const abstainVotes = sortedData.map((d) => d.abstainPercentage)

  const legendItems = [
    {
      label: 'For',
      color: 'var(--mui-palette-chartSeries-1-main)',
      type: 'line' as const,
    },
    {
      label: 'Against',
      color: 'var(--mui-palette-chartSeries-5-main)',
      type: 'line' as const,
    },
    {
      label: 'Abstain',
      color: 'var(--mui-palette-chartSeries-2-main)',
      type: 'line' as const,
    },
  ]

  return (
    <Box>
      <LineChart
        height={320}
        series={[
          {
            data: forVotes,
            label: 'For',
            color: 'var(--mui-palette-chartSeries-1-main)',
            curve: 'catmullRom',
            showMark: false,
          },
          {
            data: againstVotes,
            label: 'Against',
            color: 'var(--mui-palette-chartSeries-5-main)',
            curve: 'catmullRom',
            showMark: false,
          },
          {
            data: abstainVotes,
            label: 'Abstain',
            color: 'var(--mui-palette-chartSeries-2-main)',
            curve: 'catmullRom',
            showMark: false,
          },
        ]}
        xAxis={[
          {
            data: years,
            scaleType: 'point',
            tickNumber: years.length,
          },
        ]}
        yAxis={[
          {
            min: 0,
            max: 100,
            tickNumber: 6,
            label: 'Share of Votes %',
          },
        ]}
        margin={{ left: 20, right: 20, top: 20, bottom: 0 }}
        grid={{ vertical: true, horizontal: true }}
        slots={{
          legend: () => null,
        }}
      />
      <CustomLegend items={legendItems} />
    </Box>
  )
}

export default IndividualDirectorChart
